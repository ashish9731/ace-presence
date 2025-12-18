import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, X, ArrowLeft, Loader2, Zap, CheckCircle, Crown, Building2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { PaymentModal } from "@/components/PaymentModal";

const planFeatures = {
  free_trial: {
    name: "Free Trial",
    subtitle: "2-day trial to explore",
    price: "$0",
    yearlyPrice: "$0",
    testPrice: 0,
    period: "/mo",
    icon: Zap,
    iconBg: "bg-gray-100",
    iconColor: "text-gray-600",
    features: [
      { text: "2 video analyses", included: true },
      { text: "2 simulator scenarios", included: true },
      { text: "2 learning bytes", included: true },
      { text: "Report preview only", included: true },
      { text: "No download access", included: true },
      { text: "Basic support", included: true },
      { text: "No PDF downloads", included: false },
      { text: "Limited scenarios", included: false },
      { text: "Screenshot protected", included: false },
    ],
    cta: "Start Free Trial",
    popular: false,
    requiresPayment: false,
  },
  basic: {
    name: "Basic",
    subtitle: "Essential tools for growth",
    price: "$25",
    yearlyPrice: "$275",
    testPrice: 1, // $1 for testing
    period: "/mo",
    icon: CheckCircle,
    iconBg: "bg-[#C4A84D]/10",
    iconColor: "text-[#C4A84D]",
    features: [
      { text: "7 video analyses per month", included: true },
      { text: "Report download enabled", included: true },
      { text: "Basic EP score (4 dimensions)", included: true },
      { text: "Limited simulator scenarios", included: true },
      { text: "Daily Learning Bytes", included: true },
      { text: "Weekly Training modules", included: true },
      { text: "Basic analytics dashboard", included: true },
      { text: "Email support", included: true },
    ],
    cta: "Upgrade Now",
    popular: false,
    requiresPayment: true,
  },
  pro: {
    name: "Pro",
    subtitle: "Complete executive presence mastery",
    price: "$80",
    yearlyPrice: "$850",
    testPrice: 80,
    period: "/mo",
    icon: Crown,
    iconBg: "bg-[#C4A84D]/10",
    iconColor: "text-[#C4A84D]",
    features: [
      { text: "Unlimited video analyses", included: true },
      { text: "Advanced EP scoring + benchmarks", included: true },
      { text: "Full Simulator (all 20 scenarios)", included: true },
      { text: "Complete Learning Bytes library", included: true },
      { text: "Full Training module access", included: true },
      { text: "Advanced analytics + trends", included: true },
      { text: "PDF downloads + sharing", included: true },
      { text: "Priority support", included: true },
      { text: "Early access to features", included: true },
    ],
    cta: "Upgrade Now",
    popular: true,
    requiresPayment: true,
  },
  enterprise: {
    name: "Enterprise",
    subtitle: "Custom solutions for teams",
    price: "Custom",
    yearlyPrice: "Custom",
    testPrice: 0,
    period: "",
    icon: Building2,
    iconBg: "bg-gray-100",
    iconColor: "text-gray-600",
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Custom branding", included: true },
      { text: "Bulk user licenses (10+)", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "Custom integrations", included: true },
      { text: "SLA guarantees", included: true },
      { text: "Team management dashboard", included: true },
      { text: "Advanced reporting", included: true },
    ],
    cta: "Contact Sales",
    popular: false,
    requiresPayment: false,
  },
};

export default function Pricing() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [selectingPlan, setSelectingPlan] = useState<string | null>(null);
  const [existingPlan, setExistingPlan] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<string | null>(null);
  const [pendingPayments, setPendingPayments] = useState<string[]>([]);
  const [trialExpired, setTrialExpired] = useState(false);

  useEffect(() => {
    checkExistingPlan();
    checkPendingPayments();
  }, [user]);

  const checkExistingPlan = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("user_plans")
      .select("plan_name, trial_started_at, trial_ends_at, is_active")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (data?.plan_name) {
      setExistingPlan(data.plan_name);
      
      // Check if trial has expired
      if (data.plan_name === "free_trial" && data.trial_ends_at) {
        const expired = new Date() > new Date(data.trial_ends_at);
        setTrialExpired(expired);
      }
    }
  };

  const checkPendingPayments = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("payments")
      .select("plan_name")
      .eq("user_id", user.id)
      .eq("status", "pending");

    if (data) {
      setPendingPayments(data.map(p => p.plan_name));
    }
  };

  const handleSelectPlan = async (planKey: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (planKey === "enterprise") {
      toast.info("Please contact our sales team for Enterprise pricing");
      return;
    }

    const plan = planFeatures[planKey as keyof typeof planFeatures];

    // If paid plan and user doesn't already have it approved, show payment modal
    if (plan.requiresPayment && existingPlan !== planKey) {
      // Check if there's already a pending payment for this plan
      if (pendingPayments.includes(planKey)) {
        toast.info("Payment pending approval", {
          description: "Your payment for this plan is being reviewed by admin.",
        });
        return;
      }
      
      setSelectedPlanForPayment(planKey);
      setPaymentModalOpen(true);
      return;
    }

    // Prevent selecting free_trial if user already has any plan
    if (planKey === "free_trial" && existingPlan) {
      toast.error("Free trial already used", { 
        description: "You have already used your free trial. Please select a paid plan to continue." 
      });
      return;
    }

    setSelectingPlan(planKey);
    
    try {
      // Calculate trial end date (2 days from now)
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 2);

      if (existingPlan) {
        // User already has a plan - update it (upgrade)
        const { error } = await supabase
          .from("user_plans")
          .update({ 
            plan_name: planKey, 
            selected_at: new Date().toISOString(),
            is_active: true,
          })
          .eq("user_id", user.id);

        if (error) throw error;
        
        toast.success(`Upgraded to ${plan.name} plan!`);
      } else {
        // New user - insert plan with trial dates
        const { error } = await supabase
          .from("user_plans")
          .insert({ 
            user_id: user.id, 
            plan_name: planKey,
            trial_started_at: planKey === "free_trial" ? new Date().toISOString() : null,
            trial_ends_at: planKey === "free_trial" ? trialEndsAt.toISOString() : null,
            is_active: true,
          });

        if (error) throw error;
        
        toast.success(`${plan.name} plan activated!`);
      }
      
      navigate("/dashboard");
    } catch (error: any) {
      toast.error("Failed to select plan", { description: error.message });
    } finally {
      setSelectingPlan(null);
    }
  };

  const handlePaymentSubmitted = () => {
    checkPendingPayments();
    toast.info("Payment submitted", {
      description: "Your plan will be activated once admin approves the payment.",
    });
  };

  const getButtonText = (key: string) => {
    const plan = planFeatures[key as keyof typeof planFeatures];
    
    if (existingPlan === key) return "Current Plan";
    if (pendingPayments.includes(key)) return "Pending Approval";
    if (key === "free_trial" && existingPlan) return "Trial Used";
    if (existingPlan && key !== "free_trial" && plan.requiresPayment) return "Upgrade";
    
    return plan.cta;
  };

  const isButtonDisabled = (key: string) => {
    if (selectingPlan !== null) return true;
    if (existingPlan === key) return true;
    if (pendingPayments.includes(key)) return true;
    if (key === "free_trial" && !!existingPlan) return true;
    return false;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <Loader2 className="w-8 h-8 animate-spin text-[#C4A84D]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-1">
            <span className="font-bold text-xl text-gray-900">Executive Presence</span>
            <span className="text-xl font-medium text-[#C4A84D]">Quotient</span>
          </Link>
          <div className="flex items-center gap-4">
            {user && existingPlan ? (
              <Link 
                to="/dashboard" 
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Link>
            ) : (
              <Link 
                to="/" 
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
            )}
            {!user && (
              <Link to="/auth">
                <Button 
                  size="sm"
                  className="rounded-lg bg-[#C4A84D] hover:bg-[#B39940] text-white"
                >
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Trial Expired Banner */}
      {trialExpired && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="container mx-auto px-4 py-3 flex items-center justify-center gap-2 text-amber-700">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">
              Your free trial has expired. Upgrade to continue using all features.
            </span>
          </div>
        </div>
      )}

      {/* Pending Payment Banner */}
      {pendingPayments.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="container mx-auto px-4 py-3 flex items-center justify-center gap-2 text-blue-700">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">
              Payment pending approval. Your plan will be activated once confirmed by admin.
            </span>
          </div>
        </div>
      )}

      {/* Pricing Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Choose Your <span className="text-[#C4A84D]">Plan</span>
            </h1>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Select the perfect plan to elevate your executive presence
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <div className="flex items-center bg-white rounded-full p-1 border border-gray-200">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  billingPeriod === "monthly"
                    ? "bg-[#C4A84D] text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod("yearly")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  billingPeriod === "yearly"
                    ? "bg-[#C4A84D] text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Yearly
                <span className="text-xs bg-[#C4A84D]/20 text-[#C4A84D] px-2 py-0.5 rounded-full">
                  Save 17%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {Object.entries(planFeatures).map(([key, plan]) => {
              const Icon = plan.icon;
              const hasPendingPayment = pendingPayments.includes(key);
              
              return (
                <div
                  key={key}
                  className={`relative bg-white rounded-2xl p-6 transition-all ${
                    plan.popular
                      ? "border-2 border-[#C4A84D] shadow-lg"
                      : "border border-gray-200"
                  } ${hasPendingPayment ? "ring-2 ring-blue-300" : ""}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-semibold rounded-full bg-[#C4A84D] text-white uppercase tracking-wide">
                      Most Popular
                    </div>
                  )}

                  {hasPendingPayment && (
                    <div className="absolute -top-3 right-4 px-3 py-1 text-xs font-semibold rounded-full bg-blue-500 text-white">
                      Pending
                    </div>
                  )}

                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl ${plan.iconBg} flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${plan.iconColor}`} />
                  </div>

                  {/* Plan Name */}
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{plan.subtitle}</p>

                  {/* Price */}
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold text-gray-900">
                      {billingPeriod === "yearly" && plan.yearlyPrice
                        ? plan.yearlyPrice
                        : plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-gray-500">
                        {billingPeriod === "yearly" ? "/yr" : plan.period}
                      </span>
                    )}
                  </div>

                  {/* Test Price Notice for Basic */}
                  {key === "basic" && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-4 text-center">
                      <span className="text-xs text-green-700 font-medium">
                        🎉 Testing: Only $1 to upgrade!
                      </span>
                    </div>
                  )}

                  {/* Features */}
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-[#C4A84D] flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={`text-sm ${feature.included ? "text-gray-600" : "text-gray-400"}`}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button
                    className={`w-full rounded-lg ${
                      plan.popular
                        ? "bg-[#C4A84D] hover:bg-[#B39940] text-white"
                        : "bg-[#C4A84D]/10 hover:bg-[#C4A84D]/20 text-[#C4A84D] border border-[#C4A84D]/30"
                    } ${isButtonDisabled(key) ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => handleSelectPlan(key)}
                    disabled={isButtonDisabled(key)}
                  >
                    {selectingPlan === key ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : hasPendingPayment ? (
                      <Clock className="w-4 h-4 mr-2" />
                    ) : null}
                    {getButtonText(key)}
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Bottom CTA */}
          <div className="mt-12 text-center bg-white rounded-2xl border border-gray-200 p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Not sure which plan is right for you?
            </h3>
            <p className="text-gray-500 mb-4">
              Start with our 2-day free trial and upgrade anytime to unlock more features.
            </p>
            <Button
              variant="outline"
              className="border-[#C4A84D] text-[#C4A84D] hover:bg-[#C4A84D]/5"
              onClick={() => user ? navigate("/dashboard") : navigate("/auth")}
            >
              Continue to Dashboard
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200 bg-white">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">
            © 2025 Executive Presence Quotient. Professional leadership assessment platform.
          </p>
        </div>
      </footer>

      {/* Payment Modal */}
      {selectedPlanForPayment && user && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedPlanForPayment(null);
          }}
          planName={selectedPlanForPayment}
          amount={planFeatures[selectedPlanForPayment as keyof typeof planFeatures]?.testPrice || 0}
          userId={user.id}
          onPaymentSubmitted={handlePaymentSubmitted}
        />
      )}
    </div>
  );
}
