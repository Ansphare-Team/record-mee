import { getSupabaseClient } from "./recordmeeAuth";

export type PlanType = "starter" | "pro" | "enterprise";
export type SubscriptionStatus = "active" | "cancelled" | "expired" | "past_due";

export interface PlanFeatures {
	plan_type: PlanType;
	max_recordings_per_month: number | null;
	max_recording_duration_minutes: number | null;
	max_cloud_storage_gb: number | null;
	features_available: string[];
}

export interface UserSubscription {
	user_id: string;
	plan_type: PlanType;
	status: SubscriptionStatus;
	stripe_subscription_id: string | null;
	start_date: string;
	end_date: string | null;
}

export interface UserUsage {
	user_id: string;
	recordings_count: number;
	total_recording_duration_seconds: number;
	cloud_storage_used_bytes: number;
}

export interface PaymentHistory {
	user_id: string;
	amount: number;
	status: "completed" | "pending" | "failed" | "succeeded";
	stripe_payment_intent_id: string | null;
	created_at: string;
}

export interface SubscriptionStatusResult {
	planType: PlanType;
	status: SubscriptionStatus;
	isPaid: boolean;
}

export interface CanUserRecordResult {
	allowed: boolean;
	reason?: string;
}

export class SubscriptionLimits {
	private supabase = getSupabaseClient();

	async getUserSubscription(userId: string): Promise<UserSubscription | null> {
		if (!this.supabase) return null;

		const { data, error } = await this.supabase
			.from("user_subscriptions")
			.select("*")
			.eq("user_id", userId)
			.single();

		if (error) {
			console.error("Error fetching subscription:", error);
			return null;
		}

		return data;
	}

	async getUserSubscriptionWithRetry(userId: string): Promise<UserSubscription | null> {
		if (!this.supabase) return null;

		try {
			return await this.getUserSubscription(userId);
		} catch (error) {
			console.error("Error fetching subscription with retry:", error);
			return null;
		}
	}

	async getUserUsage(userId: string): Promise<UserUsage | null> {
		if (!this.supabase) return null;

		const { data, error } = await this.supabase
			.from("usage_limits")
			.select("*")
			.eq("user_id", userId)
			.single();

		if (error) {
			console.error("Error fetching usage:", error);
			return null;
		}

		return data;
	}

	async getPlanFeatures(planType: PlanType): Promise<PlanFeatures | null> {
		if (!this.supabase) return null;

		const { data, error } = await this.supabase
			.from("plan_features")
			.select("*")
			.eq("plan_type", planType)
			.single();

		if (error) {
			console.error("Error fetching plan features:", error);
			return null;
		}

		return data;
	}

	async getPaymentHistory(userId: string): Promise<PaymentHistory[]> {
		if (!this.supabase) return [];

		const { data, error } = await this.supabase
			.from("payment_history")
			.select("*")
			.eq("user_id", userId)
			.order("created_at", { ascending: false });

		if (error) {
			console.error("Error fetching payment history:", error);
			return [];
		}

		return data || [];
	}

	async getUserSubscriptionStatus(userId: string): Promise<SubscriptionStatusResult> {
		const subscription = await this.getUserSubscription(userId);

		if (!subscription) {
			// No subscription found - return null values instead of hardcoded "starter"
			return { planType: "starter" as PlanType, status: "cancelled", isPaid: false };
		}

		// Check payment history
		const paymentHistory = await this.getPaymentHistory(userId);
		const recentPayments = paymentHistory.filter(
			(p) => p.status === "completed" || p.status === "succeeded",
		);
		const isPaid = recentPayments.length > 0;

		return {
			planType: subscription.plan_type,
			status: subscription.status,
			isPaid,
		};
	}

	async canUserRecord(userId: string): Promise<CanUserRecordResult> {
		const subscription = await this.getUserSubscription(userId);

		if (!subscription) {
			return { allowed: false, reason: "No subscription found" };
		}

		if (subscription.status !== "active") {
			return { allowed: false, reason: "Subscription not active" };
		}

		const usage = await this.getUserUsage(userId);
		const planFeatures = await this.getPlanFeatures(subscription.plan_type);

		if (!planFeatures) {
			return { allowed: false, reason: "Plan features not found" };
		}

		// Check monthly recording limit
		if (
			planFeatures.max_recordings_per_month !== null &&
			usage &&
			usage.recordings_count >= planFeatures.max_recordings_per_month
		) {
			return {
				allowed: false,
				reason: `Monthly recording limit reached (${planFeatures.max_recordings_per_month})`,
			};
		}

		return { allowed: true };
	}

	async canUserExport(userId: string): Promise<CanUserRecordResult> {
		const subscription = await this.getUserSubscription(userId);

		if (!subscription) {
			return { allowed: false, reason: "No subscription found" };
		}

		if (subscription.status !== "active") {
			return { allowed: false, reason: "Subscription not active" };
		}

		// All active plans (starter, pro, enterprise) allow export
		// Starter: free local export
		// Pro/Enterprise: paid plans with cloud features
		return { allowed: true };
	}

	async trackRecordingUsage(userId: string, durationSeconds: number): Promise<void> {
		if (!this.supabase) {
			console.error("[Usage] Supabase client not available");
			return;
		}

		console.log(`[Usage] Tracking recording for user ${userId}, duration: ${durationSeconds}s`);

		try {
			// First, check if user has a usage record
			const { data: existingUsage, error: fetchError } = await this.supabase
				.from("usage_limits")
				.select("*")
				.eq("user_id", userId)
				.single();

			if (fetchError && fetchError.code !== "PGRST116") {
				console.error("[Usage] Error fetching existing usage:", fetchError);
				return;
			}

			if (existingUsage) {
				// Update existing record
				console.log(`[Usage] Updating existing usage for user ${userId}`);
				const { error: updateError } = await this.supabase
					.from("usage_limits")
					.update({
						recordings_count: (existingUsage as UserUsage).recordings_count + 1,
						total_recording_duration_seconds: (existingUsage as UserUsage).total_recording_duration_seconds + durationSeconds,
					} as never)
					.eq("user_id", userId);

				if (updateError) {
					console.error("[Usage] Error updating usage:", updateError);
				} else {
					console.log(`[Usage] Successfully updated usage for user ${userId}`);
				}
			} else {
				// Create new record (no monthly reset - reset only on subscription renewal)
				console.log(`[Usage] Creating new usage record for user ${userId}`);
				const { error: insertError } = await this.supabase
					.from("usage_limits")
					.insert({
						user_id: userId,
						recordings_count: 1,
						total_recording_duration_seconds: durationSeconds,
						cloud_storage_used_bytes: 0,
					} as never);

				if (insertError) {
					console.error("[Usage] Error inserting usage:", insertError);
				} else {
					console.log(`[Usage] Successfully created usage record for user ${userId}`);
				}
			}
		} catch (error) {
			console.error("[Usage] Error tracking recording usage:", error);
		}
	}

	async syncLocalRecordings(userId: string): Promise<void> {
		if (!this.supabase) {
			console.error("[Usage] Supabase client not available");
			return;
		}

		console.log(`[Usage] ========== SYNC START ==========`);
		console.log(`[Usage] Syncing local recordings for user ${userId}`);

		try {
			// Step 1: Scan local recordings directory
			console.log("[Usage] Step 1: Scanning local recordings directory...");
			const scanResult = await window.electronAPI?.scanLocalRecordings();
			
			if (!scanResult) {
				console.error("[Usage] ❌ Scan result is null/undefined");
				return;
			}

			if (!scanResult.success) {
				console.error("[Usage] ❌ Scan failed:", scanResult.error);
				return;
			}

			if (!scanResult.files || scanResult.files.length === 0) {
				console.log("[Usage] ℹ️ No local recordings found");
				return;
			}

			const localRecordingCount = scanResult.count || 0;
			console.log(`[Usage] ✅ Found ${localRecordingCount} local recordings`);
			console.log(`[Usage] Files:`, scanResult.files);

			// Step 2: Get current database usage
			console.log("[Usage] Step 2: Fetching current database usage...");
			const { data: existingUsage, error: fetchError } = await this.supabase
				.from("usage_limits")
				.select("*")
				.eq("user_id", userId)
				.single();

			if (fetchError && fetchError.code !== "PGRST116") {
				console.error("[Usage] ❌ Error fetching existing usage:", fetchError);
				return;
			}

			const dbRecordingCount = existingUsage ? (existingUsage as UserUsage).recordings_count : 0;
			console.log(`[Usage] Database has ${dbRecordingCount} recordings`);
			console.log(`[Usage] Local has ${localRecordingCount} recordings`);

			// Step 3: Calculate difference
			const difference = localRecordingCount - dbRecordingCount;
			console.log(`[Usage] Difference: ${difference} recordings`);

			if (difference <= 0) {
				console.log(`[Usage] ✅ Database is up to date (${dbRecordingCount} recordings)`);
				console.log(`[Usage] ========== SYNC COMPLETE (NO CHANGE) ==========`);
				return;
			}

			console.log(`[Usage] Step 3: Syncing ${difference} missing recordings to database`);

			// Estimate average duration (30 seconds per recording as fallback)
			const averageDurationSeconds = 30;
			const additionalDuration = difference * averageDurationSeconds;
			console.log(`[Usage] Adding ${additionalDuration}s estimated duration`);

			// Step 4: Update database
			console.log("[Usage] Step 4: Updating database...");
			if (existingUsage) {
				// Update existing record
				const newTotalDuration = (existingUsage as UserUsage).total_recording_duration_seconds + additionalDuration;
				console.log(`[Usage] New total duration: ${newTotalDuration}s`);
				
				const { error: updateError } = await this.supabase
					.from("usage_limits")
					.update({
						recordings_count: localRecordingCount,
						total_recording_duration_seconds: newTotalDuration,
					} as never)
					.eq("user_id", userId);

				if (updateError) {
					console.error("[Usage] ❌ Error syncing usage:", updateError);
					console.log(`[Usage] ========== SYNC FAILED ==========`);
					return;
				}
				
				console.log(`[Usage] ✅ Successfully synced ${difference} recordings for user ${userId}`);
				console.log(`[Usage] Updated count: ${localRecordingCount}, duration: ${newTotalDuration}s`);
			} else {
				// Create new record (no monthly reset - reset only on subscription renewal)
				const totalDuration = localRecordingCount * averageDurationSeconds;
				console.log(`[Usage] Creating new record with count: ${localRecordingCount}, duration: ${totalDuration}s`);

				const { error: insertError } = await this.supabase
					.from("usage_limits")
					.insert({
						user_id: userId,
						recordings_count: localRecordingCount,
						total_recording_duration_seconds: totalDuration,
						cloud_storage_used_bytes: 0,
					} as never);

				if (insertError) {
					console.error("[Usage] ❌ Error inserting synced usage:", insertError);
					console.log(`[Usage] ========== SYNC FAILED ==========`);
					return;
				}
				
				console.log(`[Usage] ✅ Successfully created synced usage record for user ${userId}`);
			}

			// Step 5: Verify the update
			console.log("[Usage] Step 5: Verifying database update...");
			const { data: verifyData } = await this.supabase
				.from("usage_limits")
				.select("*")
				.eq("user_id", userId)
				.single();

			if (verifyData) {
				console.log(`[Usage] ✅ Verification successful! DB now has ${(verifyData as UserUsage).recordings_count} recordings`);
			} else {
				console.error("[Usage] ❌ Verification failed - data not found in DB");
			}

			console.log(`[Usage] ========== SYNC COMPLETE ==========`);
		} catch (error) {
			console.error("[Usage] ❌ Error syncing local recordings:", error);
			console.log(`[Usage] ========== SYNC FAILED ==========`);
		}
	}

	async getUsagePercentage(userId: string): Promise<{
		recordingsPercentage: number;
		durationPercentage: number;
		storagePercentage: number;
	}> {
		const subscription = await this.getUserSubscription(userId);
		const usage = await this.getUserUsage(userId);

		if (!subscription || !usage) {
			return { recordingsPercentage: 0, durationPercentage: 0, storagePercentage: 0 };
		}

		const planFeatures = await this.getPlanFeatures(subscription.plan_type);

		if (!planFeatures) {
			return { recordingsPercentage: 0, durationPercentage: 0, storagePercentage: 0 };
		}

		const recordingsPercentage =
			planFeatures.max_recordings_per_month !== null
				? (usage.recordings_count / planFeatures.max_recordings_per_month) * 100
				: 0;

		const durationPercentage =
			planFeatures.max_recording_duration_minutes !== null
				? (usage.total_recording_duration_seconds /
						(planFeatures.max_recording_duration_minutes * 60)) *
					100
				: 0;

		const storagePercentage =
			planFeatures.max_cloud_storage_gb !== null
				? (usage.cloud_storage_used_bytes / (planFeatures.max_cloud_storage_gb * 1024 * 1024 * 1024)) *
					100
				: 0;

		return {
			recordingsPercentage: Math.min(recordingsPercentage, 100),
			durationPercentage: Math.min(durationPercentage, 100),
			storagePercentage: Math.min(storagePercentage, 100),
		};
	}
}

export const subscriptionLimits = new SubscriptionLimits();
