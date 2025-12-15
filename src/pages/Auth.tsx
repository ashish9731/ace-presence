import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    const checkUserPlan = async (userId: string) => {
      const { data } = await supabase
        .from("user_plans")
        .select("plan_name")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (data?.plan_name) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/pricing", { replace: true });
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setTimeout(() => checkUserPlan(session.user.id), 0);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        checkUserPlan(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const validateForm = () => {
    const result = authSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "email") fieldErrors.email = err.message;
        if (err.path[0] === "password") fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Welcome back!");
      } else {
        const redirectUrl = `${window.location.origin}/pricing`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
          },
        });
        if (error) throw error;
        toast.success("Account created!", {
          description: "You can now sign in.",
        });
        setIsLogin(true);
      }
    } catch (error: any) {
      let message = error.message;
      if (message.includes("User already registered")) {
        message = "An account with this email already exists. Please sign in.";
        setIsLogin(true);
      } else if (message.includes("Invalid login credentials")) {
        message = "Invalid email or password. Please try again.";
      }
      toast.error(isLogin ? "Sign in failed" : "Sign up failed", {
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/pricing`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error("Google sign in failed", {
        description: error.message,
      });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="w-full lg:w-1/2 bg-background flex flex-col p-8 lg:p-12">
        {/* Back Button */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm text-foreground hover:text-muted-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          {/* Badge */}
          <div 
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-6 w-fit"
            style={{ 
              backgroundColor: 'hsl(40 40% 94%)',
              color: '#B8973B',
              border: '1px solid hsl(40 30% 88%)'
            }}
          >
            <Sparkles className="w-4 h-4" />
            Executive Portal
          </div>

          {/* Heading */}
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Welcome Back
          </h1>
          <p className="text-muted-foreground mb-8">
            Continue your executive presence journey
          </p>

          {/* Google Sign In */}
          <Button
            type="button"
            variant="outline"
            className="w-full mb-6 gap-3 py-6 rounded-lg"
            style={{ 
              borderColor: '#D4A84B',
              color: '#B8973B'
            }}
            onClick={handleGoogleSignIn}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </Button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-4 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="test@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`py-6 rounded-lg ${errors.email ? "border-destructive" : ""}`}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`py-6 rounded-lg ${errors.password ? "border-destructive" : ""}`}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full py-6 rounded-lg text-base font-medium"
              style={{ backgroundColor: '#D4A84B', color: '#1a1a2e' }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isLogin ? "Signing in..." : "Creating account..."}
                </>
              ) : (
                isLogin ? "Sign In" : "Create account"
              )}
            </Button>
          </form>

          {/* Toggle */}
          <div className="text-center mt-6">
            <span className="text-muted-foreground">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              className="font-medium transition-colors"
              style={{ color: '#B8973B' }}
              disabled={isLoading}
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - Dark Background */}
      <div 
        className="hidden lg:flex lg:w-1/2 flex-col justify-center p-12"
        style={{ backgroundColor: '#1a1f2e' }}
      >
        <div className="max-w-lg">
          <h2 className="font-display text-4xl font-bold text-white mb-2">
            Continue Your
          </h2>
          <h2 className="font-display text-4xl font-bold mb-6" style={{ color: '#D4A84B' }}>
            Leadership Journey
          </h2>
          <p className="text-lg mb-10" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Access your personalized EP reports, training modules, and AI-powered insights to elevate your executive presence.
          </p>

          {/* Feature Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div 
              className="p-4 rounded-xl"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <p className="text-sm text-white/60 mb-1">Video Analysis</p>
              <p className="font-semibold" style={{ color: '#D4A84B' }}>AI-Powered</p>
            </div>
            <div 
              className="p-4 rounded-xl"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <p className="text-sm text-white/60 mb-1">EP Reports</p>
              <p className="font-semibold" style={{ color: '#D4A84B' }}>Instant</p>
            </div>
            <div 
              className="p-4 rounded-xl"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <p className="text-sm text-white/60 mb-1">Training</p>
              <p className="font-semibold" style={{ color: '#D4A84B' }}>Personalized</p>
            </div>
            <div 
              className="p-4 rounded-xl"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <p className="text-sm text-white/60 mb-1">Coaching</p>
              <p className="font-semibold" style={{ color: '#D4A84B' }}>Executive</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
