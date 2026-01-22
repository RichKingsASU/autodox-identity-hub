import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
}

interface Application {
  id: string;
  user_id: string;
  company_name: string;
  ein: string;
  use_case: string;
  monthly_volume: string;
  tos_url: string;
  privacy_url: string;
  status: "pending" | "approved" | "rejected";
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    setProfile(data);
  }, []);

  const fetchApplication = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("applications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    setApplication(data);
  }, []);

  useEffect(() => {
    let applicationChannel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtimeSubscription = (userId: string) => {
      // Clean up existing channel if any
      if (applicationChannel) {
        supabase.removeChannel(applicationChannel);
      }

      // Set up realtime subscription for application status changes
      applicationChannel = supabase
        .channel(`application-status-${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'applications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const newApplication = payload.new as Application;
            setApplication(newApplication);
          }
        )
        .subscribe();
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to prevent potential race conditions
          setTimeout(() => {
            fetchProfile(session.user.id);
            fetchApplication(session.user.id);
            setupRealtimeSubscription(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setApplication(null);
          if (applicationChannel) {
            supabase.removeChannel(applicationChannel);
            applicationChannel = null;
          }
        }
        setLoading(false);
      }
    );

    // Then check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchApplication(session.user.id);
        setupRealtimeSubscription(session.user.id);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      if (applicationChannel) {
        supabase.removeChannel(applicationChannel);
      }
    };
  }, [fetchProfile, fetchApplication]);

  const signUp = async (
    email: string,
    password: string,
    metadata: { first_name: string; last_name: string; phone?: string }
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: metadata,
      },
    });
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const submitApplication = async (applicationData: {
    company_name: string;
    ein: string;
    use_case: string;
    monthly_volume: string;
    tos_url: string;
    privacy_url: string;
  }) => {
    if (!user) return { error: new Error("Not authenticated") };

    const { data, error } = await supabase
      .from("applications")
      .insert({
        user_id: user.id,
        ...applicationData,
      })
      .select()
      .single();

    if (data) {
      setApplication(data);
    }

    return { data, error };
  };

  const updateProfile = async (updates: Partial<Pick<Profile, "first_name" | "last_name" | "phone">>) => {
    if (!user) return { error: new Error("Not authenticated") };

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", user.id)
      .select()
      .single();

    if (data) {
      setProfile(data);
    }

    return { data, error };
  };

  return {
    user,
    session,
    profile,
    application,
    loading,
    signUp,
    signIn,
    signOut,
    submitApplication,
    updateProfile,
    refetchApplication: () => user && fetchApplication(user.id),
  };
}
