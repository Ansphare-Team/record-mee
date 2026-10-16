import { createClient, Session } from "@supabase/supabase-js";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const AUTH_CALLBACK_URL = "recordmee://auth/callback";
export const AUTH_WEBSITE_URL = "https://recordmee.com/auth?desktop=true";
export const PRICING_PAGE_URL = "https://recordmee.com/pricing";
export const CLIENT_PAGE_URL = "https://recordmee.com/clients";

let supabase: ReturnType<typeof createClient> | null = null;

// Enterprise-level file-based storage adapter for Electron
// Uses Electron IPC to read/write session data to disk
const fileBasedStorage = {
	// In-memory cache for performance
	cache: {} as Record<string, string>,

	init() {
		try {
			if (typeof window.electronAPI === "undefined") {
				console.log("[File Storage] Not in Electron, skipping init");
				return;
			}
			// Load from disk asynchronously (fire and forget)
			window.electronAPI.getSessionData().then((result) => {
				if (result.success && result.data) {
					this.cache = result.data;
					console.log("[File Storage] Session loaded from disk");
					toast.success("Session loaded from disk");
				} else {
					console.log("[File Storage] No existing session found");
				}
			}).catch((error) => {
				console.error("[File Storage] Failed to load session:", error);
				toast.error("Failed to load session from disk");
			});
		} catch (error) {
			console.error("[File Storage] Failed to load session:", error);
		}
	},

	getItem: (key: string) => {
		try {
			const value = fileBasedStorage.cache[key] ?? null;
			console.log(`[File Storage] GET ${key}:`, value ? "found" : "not found");
			return value;
		} catch (error) {
			console.error("[File Storage] GET error:", error);
			return null;
		}
	},

	setItem: (key: string, value: string) => {
		try {
			fileBasedStorage.cache[key] = value;
			console.log(`[File Storage] SET ${key}: success`);

			// Save to disk via Electron IPC (fire and forget)
			if (typeof window.electronAPI !== "undefined") {
				window.electronAPI.saveSessionData(fileBasedStorage.cache).then(() => {
					console.log("[File Storage] Session saved to disk");
				}).catch((err) => {
					console.error("[File Storage] Failed to save to disk:", err);
					toast.error("Failed to save session to disk");
				});
			}

			// Show success toast for critical session saves
			if (key.includes("access-token") || key.includes("refresh-token")) {
				toast.success("Session saved successfully");
			}
		} catch (error) {
			console.error("[File Storage] SET error:", error);
			toast.error(`Failed to save session: ${String(error)}`);
		}
	},

	removeItem: (key: string) => {
		try {
			delete fileBasedStorage.cache[key];
			console.log(`[File Storage] REMOVE ${key}: success`);

			// Save to disk via Electron IPC (fire and forget)
			if (typeof window.electronAPI !== "undefined") {
				window.electronAPI.saveSessionData(fileBasedStorage.cache).catch((err) => {
					console.error("[File Storage] Failed to save to disk:", err);
				});
			}
		} catch (error) {
			console.error("[File Storage] REMOVE error:", error);
		}
	},
};

// Initialize file-based storage on load
if (typeof window !== "undefined") {
	fileBasedStorage.init();
}

// Fallback to localStorage if available (for browser testing)
const localStorageBasedStorage = {
	getItem: (key: string) => {
		try {
			if (typeof localStorage === "undefined") return null;
			return localStorage.getItem(key);
		} catch {
			return null;
		}
	},
	setItem: (key: string, value: string) => {
		try {
			if (typeof localStorage === "undefined") return;
			localStorage.setItem(key, value);
		} catch {
			// Silently fail
		}
	},
	removeItem: (key: string) => {
		try {
			if (typeof localStorage === "undefined") return;
			localStorage.removeItem(key);
		} catch {
			// Silently fail
		}
	},
};

// Use file-based storage in Electron, localStorage in browser
const storage = typeof window !== "undefined" && typeof window.electronAPI !== "undefined"
	? fileBasedStorage
	: localStorageBasedStorage;

export function getSupabaseClient() {
	if (!supabase) {
		if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
			console.error("Supabase credentials not configured");
			toast.error("Supabase credentials not configured");
			return null;
		}
		supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
			auth: {
				persistSession: true,
				autoRefreshToken: true,
				detectSessionInUrl: false,
				storage,
			},
		});
		console.log("[Supabase] Client initialized with file-based persistence");
		toast.success("Session persistence enabled");
	}
	return supabase;
}

export async function signInWithGoogle() {
	const client = getSupabaseClient();
	if (!client) {
		throw new Error("Supabase client not initialized");
	}

	const { data, error } = await client.auth.signInWithOAuth({
		provider: "google",
		options: {
			redirectTo: AUTH_WEBSITE_URL,
		},
	});

	if (error) {
		throw error;
	}

	return data;
}

export async function signInWithEmail(email: string, password: string) {
	const client = getSupabaseClient();
	if (!client) {
		throw new Error("Supabase client not initialized");
	}

	const { data, error } = await client.auth.signInWithPassword({
		email,
		password,
	});

	if (error) {
		throw error;
	}

	return data;
}

export async function exchangeAuthCallback(callbackUrl: string) {
	const client = getSupabaseClient();
	if (!client) {
		throw new Error("Supabase client not initialized");
	}

	// Extract tokens from URL hash
	const url = new URL(callbackUrl);
	const hash = url.hash.substring(1); // Remove '#'
	const params = new URLSearchParams(hash);

	const accessToken = params.get("access_token");
	const refreshToken = params.get("refresh_token");

	if (!accessToken || !refreshToken) {
		throw new Error("No tokens found in callback URL");
	}

	// Set session with tokens
	const { data, error } = await client.auth.setSession({
		access_token: accessToken,
		refresh_token: refreshToken,
	});

	if (error) {
		throw error;
	}

	return data;
}

export async function signOut() {
	const client = getSupabaseClient();
	if (!client) {
		return;
	}

	await client.auth.signOut();
}

export async function getSession(): Promise<Session | null> {
	const client = getSupabaseClient();
	if (!client) {
		return null;
	}

	const { data } = await client.auth.getSession();
	return data.session;
}

export async function getCurrentUser() {
	const session = await getSession();
	return session?.user ?? null;
}
