import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface TierLimits {
  videoAnalyses: number;
  simulatorScenarios: number;
  learningBytes: number;
  canDownloadReport: boolean;
  canShareReport: boolean;
  screenshotProtected: boolean;
  hasFullSimulator: boolean;
  hasAdvancedAnalytics: boolean;
}

interface UserPlan {
  plan_name: string;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  is_active: boolean;
}

interface TierEnforcement {
  userPlan: string | null;
  isTrialExpired: boolean;
  isTrialActive: boolean;
  videoUsageThisMonth: number;
  limits: TierLimits;
  canUseVideoAnalysis: boolean;
  canUseSimulator: boolean;
  canUseLearningBytes: boolean;
  pendingPayment: boolean;
  loading: boolean;
  refreshUsage: () => Promise<void>;
  recordVideoUsage: (assessmentId: string) => Promise<boolean>;
}

const TIER_LIMITS: Record<string, TierLimits> = {
  free_trial: {
    videoAnalyses: 2, // Changed to 2 as per request
    simulatorScenarios: 2,
    learningBytes: 2,
    canDownloadReport: false,
    canShareReport: false,
    screenshotProtected: true,
    hasFullSimulator: false,
    hasAdvancedAnalytics: false,
  },
  basic: {
    videoAnalyses: 7,
    simulatorScenarios: 5,
    learningBytes: 30,
    canDownloadReport: true,
    canShareReport: false,
    screenshotProtected: false,
    hasFullSimulator: false,
    hasAdvancedAnalytics: false,
  },
  pro: {
    videoAnalyses: Infinity,
    simulatorScenarios: 20,
    learningBytes: Infinity,
    canDownloadReport: true,
    canShareReport: true,
    screenshotProtected: false,
    hasFullSimulator: true,
    hasAdvancedAnalytics: true,
  },
  enterprise: {
    videoAnalyses: Infinity,
    simulatorScenarios: Infinity,
    learningBytes: Infinity,
    canDownloadReport: true,
    canShareReport: true,
    screenshotProtected: false,
    hasFullSimulator: true,
    hasAdvancedAnalytics: true,
  },
};

export function useTierEnforcement(): TierEnforcement {
  const { user } = useAuth();
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [planData, setPlanData] = useState<UserPlan | null>(null);
  const [videoUsageThisMonth, setVideoUsageThisMonth] = useState(0);
  const [pendingPayment, setPendingPayment] = useState(false);
  const [loading, setLoading] = useState(true);

  const getCurrentMonthYear = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  };

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch user plan
      const { data: plan } = await supabase
        .from("user_plans")
        .select("plan_name, trial_started_at, trial_ends_at, is_active")
        .eq("user_id", user.id)
        .maybeSingle();

      if (plan) {
        setUserPlan(plan.plan_name);
        setPlanData(plan as UserPlan);
      }

      // Fetch video usage for current month
      const monthYear = getCurrentMonthYear();
      const { data: usage, error: usageError } = await supabase
        .from("video_usage")
        .select("id")
        .eq("user_id", user.id)
        .eq("month_year", monthYear);

      if (!usageError && usage) {
        setVideoUsageThisMonth(usage.length);
      }

      // Check for pending payments
      const { data: payments } = await supabase
        .from("payments")
        .select("status")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .limit(1);

      setPendingPayment(payments && payments.length > 0);
    } catch (error) {
      console.error("Error fetching tier data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshUsage = async () => {
    await fetchData();
  };

  const recordVideoUsage = async (assessmentId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const monthYear = getCurrentMonthYear();
      const { error } = await supabase.from("video_usage").insert({
        user_id: user.id,
        assessment_id: assessmentId,
        month_year: monthYear,
      });

      if (error) {
        // Ignore duplicate key errors (assessment already recorded)
        if (error.code === "23505") return true;
        throw error;
      }

      await refreshUsage();
      return true;
    } catch (error) {
      console.error("Error recording video usage:", error);
      return false;
    }
  };

  // Check trial status
  const isTrialExpired = (() => {
    if (userPlan !== "free_trial" || !planData) return false;
    if (!planData.trial_ends_at) return false;
    return new Date() > new Date(planData.trial_ends_at);
  })();

  const isTrialActive = userPlan === "free_trial" && !isTrialExpired;

  // Get limits for current plan
  const limits = TIER_LIMITS[userPlan || "free_trial"] || TIER_LIMITS.free_trial;

  // Calculate if user can use features
  const canUseVideoAnalysis = (() => {
    if (!userPlan) return false;
    if (isTrialExpired) return false;
    if (userPlan === "free_trial" || userPlan === "basic") {
      return videoUsageThisMonth < limits.videoAnalyses;
    }
    return true; // Pro and Enterprise have unlimited
  })();

  const canUseSimulator = (() => {
    if (!userPlan) return false;
    if (isTrialExpired) return false;
    return true; // All plans have some simulator access
  })();

  const canUseLearningBytes = (() => {
    if (!userPlan) return false;
    if (isTrialExpired) return false;
    return true; // All plans have some learning bytes access
  })();

  return {
    userPlan,
    isTrialExpired,
    isTrialActive,
    videoUsageThisMonth,
    limits,
    canUseVideoAnalysis,
    canUseSimulator,
    canUseLearningBytes,
    pendingPayment,
    loading,
    refreshUsage,
    recordVideoUsage,
  };
}
