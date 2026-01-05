import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Shield, Loader2 } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";

// Hardcoded admin credentials - only this email can access admin
const ADMIN_EMAIL = "ankur@c2x.co.in";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Strict email validation - only admin email allowed
    if (email.toLowerCase().trim() !== ADMIN_EMAIL.toLowerCase()) {
      toast.error("Access Denied", {
        description: "Only authorized admin email can access this portal.",
      });
      setIsLoading(false);
      return;
    }

    try {
      // Sign in with provided credentials
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });
      
      if (signInError) {
        console.error('Sign in error:', signInError.message);
        toast.error("Login Failed", {
          description: "Invalid email or password. Please try again.",
        });
        setIsLoading(false);
        return;
      }

      if (!data.user) {
        toast.error("Login Failed", {
          description: "No user returned. Please try again.",
        });
        setIsLoading(false);
        return;
      }

      // Verify admin role in database
      const { data: hasAdminRole, error: roleError } = await supabase.rpc('has_role', {
        _user_id: data.user.id,
        _role: 'admin'
      });
      
      if (roleError) {
        console.error('Role check error:', roleError);
        await supabase.auth.signOut();
        toast.error("Access Error", {
          description: "Failed to verify admin role. Please contact support.",
        });
        setIsLoading(false);
        return;
      }

      if (!hasAdminRole) {
        await supabase.auth.signOut();
        toast.error("Access Denied", {
          description: "Admin role not assigned to this account.",
        });
        setIsLoading(false);
        return;
      }
      
      toast.success("Welcome, Admin!", {
        description: "Redirecting to dashboard...",
      });
      navigate("/admin/dashboard", { replace: true });
    } catch (error: any) {
      console.error('Admin login error:', error);
      toast.error("Login Failed", {
        description: error.message || "An unexpected error occurred.",
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
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">Admin Portal</h1>
              <p className="text-sm text-muted-foreground">Secure access only</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter admin email"
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

          <p className="mt-4 text-xs text-center text-muted-foreground">
            This portal is restricted to authorized administrators only.
          </p>
        </div>
      </div>
    </div>
  );
}
