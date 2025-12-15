import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function Pricing() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [selectingPlan, setSelectingPlan] = useState<string | null>(null);
  const [existingPlan, setExistingPlan] = useState<string | null>(null);

  useEffect(() => {
    checkExistingPlan();
  }, [user]);

  const checkExistingPlan = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("user_plans")
      .select("plan_name")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (data?.plan_name) {
      setExistingPlan(data.plan_name);
      navigate("/dashboard", { replace: true });
    }
  };

  const handleSelectPlan = async (planName: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    setSelectingPlan(planName);
    
    try {
      const { error } = await supabase
        .from("user_plans")
        .insert({ user_id: user.id, plan_name: planName });

      if (error) throw error;
      
      toast.success(`${planName} plan activated!`);
      navigate("/dashboard");
    } catch (error: any) {
      toast.error("Failed to select plan", { description: error.message });
    } finally {
      setSelectingPlan(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4A84B]" />
      </div>
    );
  }
  const plans = [
    {
      name: "Starter",
      price: "Free",
      description: "Perfect for trying out the platform",
      features: [
        "1 video assessment per month",
        "Basic EP score",
        "Communication analysis",
        "Email support",
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Professional",
      price: "$49",
      period: "/month",
      description: "For leaders serious about improvement",
      features: [
        "10 video assessments per month",
        "Full 4-dimension analysis",
        "Detailed coaching recommendations",
        "PDF export for coaches",
        "Boardroom Simulator access",
        "Priority support",
      ],
      cta: "Start Free Trial",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For teams and organizations",
      features: [
        "Unlimited assessments",
        "Team analytics dashboard",
        "Custom branding",
        "API access",
        "Dedicated success manager",
        "SSO & advanced security",
      ],
      cta: "Contact Sales",
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-1">
            <span className="font-display text-xl font-bold text-foreground">
              Executive Presence
            </span>
            <span className="text-xl font-medium" style={{ color: '#D4A84B' }}>Quotient</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link 
              to="/" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <Link to="/auth">
              <Button 
                size="sm"
                className="rounded-lg"
                style={{ backgroundColor: '#D4A84B', color: '#1a1a2e' }}
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Pricing Section */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Simple, Transparent <span style={{ color: '#D4A84B' }}>Pricing</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your leadership development journey
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-card border rounded-2xl p-8 ${
                  plan.popular
                    ? "shadow-lg scale-105"
                    : "border-border"
                }`}
                style={plan.popular ? { borderColor: '#D4A84B', borderWidth: '2px' } : {}}
              >
                {plan.popular && (
                  <div 
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-sm font-medium rounded-full"
                    style={{ backgroundColor: '#D4A84B', color: '#1a1a2e' }}
                  >
                    Most Popular
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="font-display text-xl font-bold text-foreground mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="font-display text-4xl font-bold text-foreground">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-muted-foreground">{plan.period}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div 
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: 'hsl(40 40% 90%)' }}
                      >
                        <Check className="w-3 h-3" style={{ color: '#B8973B' }} />
                      </div>
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full rounded-lg"
                  style={plan.popular 
                    ? { backgroundColor: '#D4A84B', color: '#1a1a2e' } 
                    : { backgroundColor: 'transparent', borderColor: '#D4A84B', color: '#D4A84B', borderWidth: '1px', borderStyle: 'solid' }
                  }
                  onClick={() => handleSelectPlan(plan.name)}
                  disabled={selectingPlan !== null}
                >
                  {selectingPlan === plan.name ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 Executive Presence Quotient. Professional leadership assessment platform.
          </p>
        </div>
      </footer>
    </div>
  );
}
