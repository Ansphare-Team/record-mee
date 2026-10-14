import { createClient, Session } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const AUTH_CALLBACK_URL = "recordmee://auth/callback";
export const AUTH_WEBSITE_URL = "https://recordmee.com/account?desktop=true";
export const PRICING_PAGE_URL = "https://recordmee.com/pricing";
export const CLIENT_PAGE_URL = "https://recordmee.com/clients";

let supabase: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
	if (!supabase) {
		if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
			console.error("Supabase credentials not configured");
			return null;
		}
		supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
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
