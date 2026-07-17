import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'commercial' | 'technicien' | 'user';

interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isCommercial: boolean;
  isTechnicien: boolean;
  userRole: AppRole | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCommercial, setIsCommercial] = useState(false);
  const [isTechnicien, setIsTechnicien] = useState(false);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer role check with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            checkUserRole(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setIsCommercial(false); setIsTechnicien(false);
          setUserRole(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkUserRole(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error checking user role:', error);
        setIsAdmin(false);
        setIsCommercial(false); setIsTechnicien(false);
        setUserRole(null);
      } else if (data) {
        const role = data.role as AppRole;
        setUserRole(role);
        setIsAdmin(role === 'admin');
        setIsCommercial(role === 'commercial'); setIsTechnicien(role === 'technicien');
      } else {
        setIsAdmin(false);
        setIsCommercial(false); setIsTechnicien(false);
        setUserRole(null);
      }
    } catch (err) {
      console.error('Error checking user role:', err);
      setIsAdmin(false);
      setIsCommercial(false); setIsTechnicien(false);
      setUserRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setIsCommercial(false); setIsTechnicien(false);
    setUserRole(null);
  };

  return {
    user,
    session,
    isAdmin,
    isCommercial,
    isTechnicien,
    userRole,
    isLoading,
    signIn,
    signUp,
    signOut,
  };
}
