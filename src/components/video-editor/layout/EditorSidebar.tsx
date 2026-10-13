import {
	Camera,
	ClosedCaptioning,
	Cursor,
	Gear,
	PuzzlePiece,
	Sparkle,
	UserCircle,
	SignOut,
	Crown,
	VideoCamera,
	Clock,
	Envelope,
	Calendar,
} from "@phosphor-icons/react";
import { motion } from "motion/react";
import type { ComponentProps, Dispatch, SetStateAction } from "react";
import { useMemo, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { useI18n } from "@/contexts/I18nContext";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ExtensionManager from "../ExtensionManager";
import { SettingsPanel } from "../SettingsPanel";
import type { EditorEffectSection } from "../types";
import { getCurrentUser, signOut } from "@/lib/recordmeeAuth";
import { subscriptionLimits, type PlanType } from "@/lib/subscriptionLimits";

type Props = {
	t: ReturnType<typeof useI18n>["t"];
	activeSection: EditorEffectSection;
	setActiveSection: Dispatch<SetStateAction<EditorEffectSection>>;
	settingsPanelProps: ComponentProps<typeof SettingsPanel>;
	onAuthRequired?: () => void;
};

export function EditorSidebar({ t, activeSection, setActiveSection, settingsPanelProps, onAuthRequired }: Props) {
	const [user, setUser] = useState<{ email: string; avatarUrl?: string; id?: string } | null>(null);
	const [showProfileDropdown, setShowProfileDropdown] = useState(false);
	const [subscription, setSubscription] = useState<{ planType: PlanType; isPaid: boolean } | null>(null);
	const [usage, setUsage] = useState<{
		recordingsCount: number;
		durationMinutes: number;
		storageGB: number;
	} | null>(null);
	const [subscriptionData, setSubscriptionData] = useState<{
		endDate: string | null;
	} | null>(null);
	const [isLoadingUser, setIsLoadingUser] = useState(false);

	const loadUser = useCallback(async () => {
		console.log("[Sidebar] ========== LOAD USER START ==========");
		setIsLoadingUser(true);
		const currentUser = await getCurrentUser();
		console.log("[Sidebar] Current user:", currentUser?.email || "Not authenticated");
		
		if (currentUser) {
			setUser({
				email: currentUser.email || "",
				avatarUrl: currentUser.user_metadata?.avatar_url,
				id: currentUser.id,
			});

			// Load subscription and usage
			if (currentUser.id) {
				console.log("[Sidebar] User ID:", currentUser.id);
				
				// NOTE: Local sync disabled to prevent counting other users' recordings on shared devices
				// Only recordings made AFTER authentication will be tracked
				// Pre-auth recordings are not synced to avoid cross-user data contamination

				console.log("[Sidebar] Fetching subscription status...");
				const subStatus = await subscriptionLimits.getUserSubscriptionStatus(currentUser.id);
				setSubscription({ planType: subStatus.planType, isPaid: subStatus.isPaid });
				console.log("[Sidebar] Subscription status:", subStatus);

				// Fetch subscription details (for end date)
				const subscription = await subscriptionLimits.getUserSubscriptionWithRetry(currentUser.id);
				if (subscription) {
					console.log("[Sidebar] Full subscription data:", subscription);
					console.log("[Sidebar] End date value:", subscription.end_date);
					console.log("[Sidebar] End date type:", typeof subscription.end_date);
					setSubscriptionData({
						endDate: subscription.end_date,
					});
				} else {
					console.log("[Sidebar] No subscription data found");
				}

				console.log("[Sidebar] Fetching user usage...");
				const userUsage = await subscriptionLimits.getUserUsage(currentUser.id);
				console.log("[Sidebar] User usage data:", userUsage);
				
				if (userUsage) {
					setUsage({
						recordingsCount: userUsage.recordings_count,
						durationMinutes: Math.floor(userUsage.total_recording_duration_seconds / 60),
						storageGB: Number((userUsage.cloud_storage_used_bytes / (1024 * 1024 * 1024)).toFixed(2)),
					});
					console.log("[Sidebar] ✅ Usage data set successfully");
				} else {
					console.log("[Sidebar] ⚠️ No usage data found for user");
				}
			}
		}
		setIsLoadingUser(false);
		console.log("[Sidebar] ========== LOAD USER COMPLETE ==========");
	}, []);

	useEffect(() => {
		void loadUser();
	}, [loadUser]);

	// Listen for auth success event to reload user data
	useEffect(() => {
		const handleAuthSuccess = () => {
			void loadUser();
		};

		window.addEventListener("auth-success", handleAuthSuccess);
		return () => {
			window.removeEventListener("auth-success", handleAuthSuccess);
		};
	}, [loadUser]);

	async function handleSignOut() {
		await signOut();
		setUser(null);
		setSubscription(null);
		setUsage(null);
		setShowProfileDropdown(false);
		toast.success("Signed out successfully");
	}
	const sections = useMemo(
		() => [
			{ id: "scene" as const, label: t("settings.sections.scene", "Scene"), icon: Sparkle },
			{ id: "cursor" as const, label: t("settings.sections.cursor", "Cursor"), icon: Cursor },
			{ id: "webcam" as const, label: t("settings.sections.webcam", "Webcam"), icon: Camera },
			{
				id: "captions" as const,
				label: t("settings.sections.captions", "Captions"),
				icon: ClosedCaptioning,
			},
			{
				id: "settings" as const,
				label: t("settings.sections.settings", "Settings"),
				icon: Gear,
			},
			{
				id: "extensions" as const,
				label: t("settings.sections.extensions", "Extensions"),
				icon: PuzzlePiece,
			},
		],
		[t],
	);
	return (
		<div className="flex flex-shrink-0 gap-1.5">
			<div className="flex flex-shrink-0 flex-col items-center gap-0.5 px-2 py-2">
				{sections.map((section) => {
					const isActive = activeSection === section.id;
					return (
						<div key={section.id} className="flex items-center">
							<motion.button
								type="button"
								onClick={() => setActiveSection(section.id)}
								title={section.label}
								className="group relative flex h-9 w-9 items-center justify-center rounded-lg outline-none focus:outline-none focus-visible:outline-none"
								animate={{ opacity: isActive ? 1 : 0.55 }}
								transition={{ duration: 0.14 }}
							>
								{isActive ? (
									<motion.span
										layoutId="rail-active-bg"
										className="absolute inset-0 rounded-lg bg-foreground/[0.08]"
										transition={{ type: "spring", stiffness: 450, damping: 35 }}
									/>
								) : null}
								<motion.span
									className="relative z-10"
									animate={{
										color: isActive ? "#2563EB" : "hsl(var(--foreground))",
									}}
									transition={{ duration: 0.14 }}
								>
									<section.icon
										className="h-[27px] w-[27px]"
										weight={isActive ? "fill" : "regular"}
									/>
								</motion.span>
							</motion.button>
							<div className="ml-1.5 h-1.5 w-1.5 flex-shrink-0">
								{isActive ? (
									<motion.span
										layoutId="rail-active-dot"
										className="block h-1.5 w-1.5 rounded-full bg-[#2563EB]"
										initial={{ opacity: 0, scale: 0.5 }}
										animate={{ opacity: 1, scale: 1 }}
										exit={{ opacity: 0, scale: 0.5 }}
										transition={{ type: "spring", stiffness: 500, damping: 32 }}
									/>
								) : null}
							</div>
						</div>
					);
				})}
				<div className="mt-auto flex flex-col items-center gap-0.5 pt-3">
					<DropdownMenu open={showProfileDropdown} onOpenChange={setShowProfileDropdown}>
						<DropdownMenuTrigger asChild>
							<motion.button
								type="button"
								title={user ? user.email : t("editor.account.title", "Account")}
								className="group relative flex h-9 w-9 items-center justify-center rounded-lg text-foreground/55 outline-none transition hover:text-foreground focus:outline-none focus-visible:outline-none"
								whileHover={{ opacity: 1 }}
								initial={{ opacity: 0.55 }}
							>
								<motion.span className="absolute inset-0 rounded-lg bg-foreground/[0.04] opacity-0 transition group-hover:opacity-100" />
								{isLoadingUser ? (
									<div className="relative z-10 h-[22px] w-[22px] flex items-center justify-center">
										<div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-foreground/50" />
									</div>
								) : user?.avatarUrl ? (
									<img
										src={user.avatarUrl}
										alt="Profile"
										className="relative z-10 h-[22px] w-[22px] rounded-full object-cover"
									/>
								) : (
									<UserCircle className="relative z-10 h-[22px] w-[22px]" />
								)}
							</motion.button>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="center"
							sideOffset={10}
							className="w-72 rounded-xl border border-foreground/10 bg-editor-surface p-2 text-foreground shadow-2xl"
						>
							{user ? (
								<>
									<div className="px-3 py-2">
										<p className="text-xs font-medium text-muted-foreground">
											Signed in as
										</p>
										<p className="text-sm font-semibold text-foreground truncate">
											{user.email}
										</p>
									</div>
									<DropdownMenuSeparator className="my-1" />

									{/* Plan Section */}
									<div className="px-3 py-2">
										<div className="flex items-center gap-2 mb-2">
											<Crown className="h-4 w-4 text-[#FFD700]" />
											<p className="text-xs font-semibold text-foreground uppercase">
												{subscription?.planType || "Starter"} Plan
											</p>
											{subscription?.isPaid && (
												<span className="ml-auto text-xs bg-[#10B981]/20 text-[#10B981] px-2 py-0.5 rounded-full">
													Active
												</span>
											)}
										</div>
									</div>

									<DropdownMenuSeparator className="my-1" />

									{/* Usage Section */}
									{usage && (
										<div className="px-3 py-2 space-y-3">
											<div className="space-y-1">
												<div className="flex items-center justify-between">
													<div className="flex items-center gap-2">
														<VideoCamera className="h-4 w-4 text-muted-foreground" />
														<p className="text-xs text-muted-foreground">Recordings</p>
													</div>
													<p className="text-xs font-semibold text-foreground">
														{usage.recordingsCount} / 10
													</p>
												</div>
												<div className="h-1.5 w-full bg-foreground/10 rounded-full overflow-hidden">
													<div
														className="h-full bg-[#2563EB] rounded-full transition-all"
														style={{ width: `${Math.min((usage.recordingsCount / 10) * 100, 100)}%` }}
													/>
												</div>
											</div>
											<div className="space-y-1">
												<div className="flex items-center justify-between">
													<div className="flex items-center gap-2">
														<Clock className="h-4 w-4 text-muted-foreground" />
														<p className="text-xs text-muted-foreground">Duration</p>
													</div>
													<p className="text-xs font-semibold text-foreground">
														{usage.durationMinutes} / 30 min
													</p>
												</div>
												<div className="h-1.5 w-full bg-foreground/10 rounded-full overflow-hidden">
													<div
														className="h-full bg-[#10B981] rounded-full transition-all"
														style={{ width: `${Math.min((usage.durationMinutes / 30) * 100, 100)}%` }}
													/>
												</div>
											</div>
											{subscriptionData?.endDate && (
												<div className="flex items-center gap-2">
													<Calendar className="h-4 w-4 text-muted-foreground" />
													<p className="text-xs text-muted-foreground">Expires</p>
													<p className="ml-auto text-xs font-semibold text-foreground">
														{new Date(subscriptionData.endDate).toLocaleDateString()}
													</p>
												</div>
											)}
										</div>
									)}

									<DropdownMenuSeparator className="my-1" />
									<DropdownMenuItem
										onClick={handleSignOut}
										className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-foreground/5 focus:bg-foreground/5 cursor-pointer"
									>
										<SignOut className="h-4 w-4" />
										<span>Sign out</span>
									</DropdownMenuItem>
								</>
							) : (
								<>
									<div className="px-3 py-2 text-center">
										<p className="text-sm text-muted-foreground">
											{t("editor.account.comingSoon", "Sign in to your account")}
										</p>
									</div>
									<DropdownMenuSeparator className="my-1" />
									<DropdownMenuItem
										onClick={() => onAuthRequired?.()}
										className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-foreground/5 focus:bg-foreground/5 cursor-pointer"
									>
										<Envelope className="h-4 w-4" />
										<span>Sign in</span>
									</DropdownMenuItem>
								</>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
			{activeSection === "extensions" ? (
				<ExtensionManager />
			) : (
				<SettingsPanel {...settingsPanelProps} />
			)}
		</div>
	);
}
