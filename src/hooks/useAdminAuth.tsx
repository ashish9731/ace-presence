import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Hardcoded admin email - only this email can have admin access
const ADMIN_EMAIL = "ankur@c2x.co.in";

export function useAdminAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminRole = async (userId: string, email: string | undefined) => {
      // First check if email matches the hardcoded admin email
      if (!email || email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        console.log('Email does not match admin email');
        return false;
      }
      
      // Then verify with database role check
      try {
        const { data, error } = await supabase.rpc('has_role', {
          _user_id: userId,
          _role: 'admin'
        });
        
        if (error) {
          console.error('Error checking admin role:', error);
          return false;
        }
        
        console.log('Admin role check result:', data);
        return data === true;
      } catch (err) {
        console.error('Exception checking admin role:', err);
        return false;
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to avoid Supabase auth deadlock
          setTimeout(async () => {
            const adminStatus = await checkAdminRole(session.user.id, session.user.email);
            setIsAdmin(adminStatus);
            setIsLoading(false);
          }, 0);
        } else {
          setIsAdmin(false);
          setIsLoading(false);
        }
      }
    );

    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const adminStatus = await checkAdminRole(session.user.id, session.user.email);
        setIsAdmin(adminStatus);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
  };

  return { user, session, isAdmin, isLoading, signOut };
}
