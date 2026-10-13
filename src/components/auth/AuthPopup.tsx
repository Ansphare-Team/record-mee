import { useState, useEffect } from "react";
import { X } from "@phosphor-icons/react";
import {
	getSupabaseClient,
	AUTH_WEBSITE_URL,
	exchangeAuthCallback,
} from "../../lib/recordmeeAuth";
import {
	Dialog,
	DialogContent,
	DialogHeader,
} from "@/components/ui/dialog";

interface AuthPopupProps {
	open: boolean;
	onClose: () => void;
}

export function AuthPopup({ open, onClose }: AuthPopupProps) {
	const [loading, setLoading] = useState(false);
	const [googleLoading, setGoogleLoading] = useState(false);
	const [emailLoading, setEmailLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isAuthenticating, setIsAuthenticating] = useState(false);

	useEffect(() => {
		// Listen for auth callback from custom protocol
		const handleAuthCallback = async (_event: Electron.IpcRendererEvent, url: string) => {
			try {
				setLoading(true);
				await exchangeAuthCallback(url);
				setLoading(false);
				// Dispatch event to notify other components
				window.dispatchEvent(new Event("auth-success"));
				onClose();
			} catch (err) {
				setError(err instanceof Error ? err.message : "Authentication failed");
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
	}, [onClose]);

	async function signInWithGoogle() {
		if (isAuthenticating) return;

		setIsAuthenticating(true);
		setGoogleLoading(true);
		setError(null);

		try {
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
			setGoogleLoading(false);
			setIsAuthenticating(false);
		}
	}

	async function signInWithEmail() {
		if (isAuthenticating) return;

		try {
			setIsAuthenticating(true);
			setEmailLoading(true);
			setError(null);
			window.open(AUTH_WEBSITE_URL, "_blank");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to open email sign in");
		} finally {
			setEmailLoading(false);
			setIsAuthenticating(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="max-w-md rounded-2xl border border-foreground/10 bg-editor-surface p-0 text-foreground shadow-2xl overflow-hidden" showCloseButton={false}>
				<DialogHeader className="border-b border-foreground/10 p-6 pb-4">
					<div className="flex items-center justify-between">
						<div>
							<h2 className="text-lg font-semibold text-foreground">
								Sign in to Export
							</h2>
							<p className="text-sm text-muted-foreground">
								Sign in to export your recordings
							</p>
						</div>
						<button
							onClick={onClose}
							className="text-muted-foreground hover:text-foreground transition-colors"
						>
							<X className="h-[18px] w-[18px]" />
						</button>
					</div>
				</DialogHeader>

				<div className="px-6 py-4">
					<img
						src="/login-banner.png"
						alt="Login Banner"
						className="w-full h-32 object-cover rounded-xl mb-4"
					/>

					{error && (
						<div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
							<p className="text-sm text-red-400">{error}</p>
						</div>
					)}

					{loading ? (
						<div className="text-center py-8">
							<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#4285F4]" />
							<p className="mt-4 text-sm text-muted-foreground">
								Waiting for authentication...
							</p>
						</div>
					) : (
						<div className="space-y-3">
							<button
								onClick={signInWithGoogle}
								disabled={googleLoading || emailLoading}
								className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-foreground/10 rounded-[5px] bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{googleLoading ? (
									<div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-[#4285F4]" />
								) : (
									<svg className="w-5 h-5" viewBox="0 0 24 24">
										<path
											fill="#4285F4"
											d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
										/>
										<path
											fill="#34A853"
											d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
										/>
										<path
											fill="#FBBC05"
											d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
										/>
										<path
											fill="#EA4335"
											d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
										/>
									</svg>
								)}
								<span className="text-sm font-medium text-gray-700">
									{googleLoading ? "Loading..." : "Continue with Google"}
								</span>
							</button>

							<button
								onClick={signInWithEmail}
								disabled={googleLoading || emailLoading}
								className="w-full px-4 py-3 bg-[#2563EB] text-white rounded-[5px] hover:bg-[#2563EB]/92 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
							>
								{emailLoading && <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
								<span>{emailLoading ? "Loading..." : "Sign in with Email"}</span>
							</button>
						</div>
					)}
				</div>

				<p className="px-6 pb-4 text-xs text-center text-muted-foreground">
					By signing in, you agree to our Terms of Service and Privacy Policy
				</p>
			</DialogContent>
		</Dialog>
	);
}
