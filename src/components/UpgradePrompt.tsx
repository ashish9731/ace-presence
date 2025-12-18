import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Lock, AlertTriangle, Crown } from "lucide-react";

interface UpgradePromptProps {
  title?: string;
  message?: string;
  feature?: string;
  isTrialExpired?: boolean;
}

export function UpgradePrompt({ 
  title = "Upgrade Required",
  message = "This feature is not available on your current plan.",
  feature,
  isTrialExpired = false
}: UpgradePromptProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-[#C4A84D]/10 flex items-center justify-center mb-4">
        {isTrialExpired ? (
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        ) : (
          <Lock className="w-8 h-8 text-[#C4A84D]" />
        )}
      </div>
      
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        {isTrialExpired ? "Free Trial Expired" : title}
      </h3>
      
      <p className="text-gray-500 mb-4 max-w-md">
        {isTrialExpired 
          ? "Your 2-day free trial has ended. Upgrade to a paid plan to continue using all features."
          : message}
      </p>

      {feature && (
        <p className="text-sm text-gray-400 mb-4">
          Feature: <span className="font-medium">{feature}</span>
        </p>
      )}

      <Button 
        onClick={() => navigate("/pricing")}
        className="bg-[#C4A84D] hover:bg-[#B39940] text-white"
      >
        <Crown className="w-4 h-4 mr-2" />
        View Upgrade Options
      </Button>
    </div>
  );
}
