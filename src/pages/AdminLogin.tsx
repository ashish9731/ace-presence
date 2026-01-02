import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Shield, Loader2 } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading: authLoading } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [user, isAdmin, authLoading, navigate]);

  const ADMIN_EMAIL = "ankur@c2x.co.in";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // First check if email matches admin email
    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      toast.error("Access Denied", {
        description: "This email is not authorized for admin access.",
      });
      setIsLoading(false);
      return;
    }

    try {
      // Try to sign in first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (signInError) {
        // If user doesn't exist, try to sign up (first time admin setup)
        if (signInError.message.includes("Invalid login credentials")) {
          const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/admin/dashboard`
            }
          });
          
          if (signUpError) throw signUpError;
          
          toast.success("Admin account created!", {
            description: "Please check your email for verification or try logging in again.",
          });
          setIsLoading(false);
          return;
        }
        throw signInError;
      }
      
      // Check if user is admin after login
      const { data: { user: loggedInUser } } = await supabase.auth.getUser();
      if (loggedInUser) {
        const { data: isAdminUser } = await supabase.rpc('has_role', {
          _user_id: loggedInUser.id,
          _role: 'admin'
        });
        
        if (!isAdminUser) {
          await supabase.auth.signOut();
          toast.error("Access Denied", {
            description: "Admin role not assigned. Please contact support.",
          });
          return;
        }
        
        toast.success("Welcome, Admin!");
        navigate("/admin/dashboard", { replace: true });
      }
    } catch (error: any) {
      toast.error("Login failed", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-xl p-8 border border-border">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'hsl(38 92% 50%)' }}>
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">Admin Portal</h1>
              <p className="text-sm text-muted-foreground">Secure access only</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="py-5"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="py-5"
                disabled={isLoading}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full py-5 text-base font-medium"
              style={{ backgroundColor: 'hsl(38 92% 50%)', color: 'hsl(222 47% 11%)' }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In to Admin"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
