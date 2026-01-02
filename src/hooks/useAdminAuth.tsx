import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const ADMIN_EMAIL = "ankur@c2x.co.in";

export function useAdminAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminRole = async (userId: string, email: string | undefined) => {
      // First check if email matches admin email
      if (email !== ADMIN_EMAIL) {
        return false;
      }
      
      // Then verify with database
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: 'admin'
      });
      
      if (error) {
        console.error('Error checking admin role:', error);
        return false;
      }
      return data === true;
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
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
  };

  return { user, session, isAdmin, isLoading, signOut };
}
