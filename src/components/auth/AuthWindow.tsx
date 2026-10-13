import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
	getSupabaseClient,
	AUTH_WEBSITE_URL,
	exchangeAuthCallback,
	getSession,
} from "../../lib/recordmeeAuth";

interface AuthWindowProps {
	onClose: () => void;
	onSuccess: () => void;
}

export function AuthWindow({ onClose, onSuccess }: AuthWindowProps) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isLoggedIn, setIsLoggedIn] = useState(false);

	useEffect(() => {
		// Check if already logged in
		void checkExistingSession();

		// Listen for auth callback from Electron IPC
		const handleAuthCallback = async (_event: Electron.IpcRendererEvent, url: string) => {
			try {
				setLoading(true);
				await exchangeAuthCallback(url);
				setIsLoggedIn(true);
				onSuccess();
			} catch (err) {
				setError(err instanceof Error ? err.message : "Authentication failed");
			} finally {
				setLoading(false);
			}
		};

		if (window.electronAPI?.onAuthCallback) {
			window.electronAPI.onAuthCallback(handleAuthCallback);
		}

		return () => {
			if (window.electronAPI?.removeAuthCallbackListener) {
				window.electronAPI.removeAuthCallbackListener(handleAuthCallback);
			}
		};
	}, [onSuccess]);

	async function checkExistingSession() {
		try {
			const session = await getSession();
			if (session) {
				setIsLoggedIn(true);
				onSuccess();
			}
		} catch (err) {
			console.error("Failed to check session:", err);
		}
	}

	async function signInWithGoogle() {
		try {
			setLoading(true);
			setError(null);
			const client = getSupabaseClient();
			if (!client) {
				throw new Error("Supabase not configured");
			}

			const { data, error: signInError } = await client.auth.signInWithOAuth({
				provider: "google",
				options: {
					redirectTo: AUTH_WEBSITE_URL,
				},
			});

			if (signInError) {
				throw signInError;
			}

			// Open auth website in external browser
			if (data.url) {
				window.open(data.url, "_blank");
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to sign in with Google");
		} finally {
			setLoading(false);
		}
	}

	if (isLoggedIn) {
		return null;
	}

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
			<div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md p-6 relative">
				<button
					onClick={onClose}
					className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
				>
					<X size={20} />
				</button>

				<div className="mb-6">
					<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
						Sign in to Recordmee
					</h2>
					<p className="text-gray-600 dark:text-gray-400">
						Sign in to sync your recordings across devices
					</p>
				</div>

				{error && (
					<div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
						<p className="text-sm text-red-600 dark:text-red-400">{error}</p>
					</div>
				)}

				{loading ? (
					<div className="text-center py-8">
						<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
						<p className="mt-4 text-gray-600 dark:text-gray-400">
							Signing in...
						</p>
					</div>
				) : (
					<div className="space-y-4">
						<button
							onClick={signInWithGoogle}
							className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
						>
							<svg className="w-5 h-5" viewBox="0 0 24 24">
								<path
									fill="currentColor"
									d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
								/>
								<path
									fill="currentColor"
									d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								/>
								<path
									fill="currentColor"
									d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
								/>
								<path
									fill="currentColor"
									d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
								/>
							</svg>
							<span className="text-gray-700 dark:text-gray-300 font-medium">
								Continue with Google
							</span>
						</button>

						<div className="relative">
							<div className="absolute inset-0 flex items-center">
								<div className="w-full border-t border-gray-300 dark:border-gray-700" />
							</div>
							<div className="relative flex justify-center text-sm">
								<span className="px-2 bg-white dark:bg-gray-900 text-gray-500">
									Or
								</span>
							</div>
						</div>

						<button
							onClick={() => window.open(AUTH_WEBSITE_URL, "_blank")}
							className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
						>
							Sign in with Email
						</button>
					</div>
				)}

				<p className="mt-6 text-xs text-center text-gray-500 dark:text-gray-400">
					By signing in, you agree to our Terms of Service and Privacy Policy
				</p>
			</div>
		</div>
	);
}
