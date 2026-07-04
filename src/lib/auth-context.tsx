"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/database";
import { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  updateProfile: (fullName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local Storage Fallback User key name
const LOCAL_USER_KEY = "keerthi_pos_mock_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (supabase) {
      // 1. Fetch current session user
      supabase.auth.getUser().then(({ data: { user } }) => {
        setUser(user);
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });

      // 2. Set up auth state change listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // LocalStorage Auth Fallback (if Supabase is not configured)
      const storedUser = localStorage.getItem(LOCAL_USER_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    if (supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } else {
      // Mock Login Fallback
      if (email === "admin@keerthi.com" && password === "admin123") {
        const mockUser: User = {
          id: "mock-user-123",
          email: "admin@keerthi.com",
          user_metadata: { full_name: "Keerthi Admin" },
          aud: "authenticated",
          created_at: new Date().toISOString(),
          app_metadata: {},
        } as any;
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(mockUser));
        setUser(mockUser);
      } else {
        throw new Error("Invalid mock credentials. Try admin@keerthi.com / admin123");
      }
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    if (supabase) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      if (error) throw error;
    } else {
      // Mock Signup Fallback
      const mockUser: User = {
        id: "mock-user-" + Math.random().toString(36).substring(2, 9),
        email,
        user_metadata: { full_name: fullName },
        aud: "authenticated",
        created_at: new Date().toISOString(),
        app_metadata: {},
      } as any;
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(mockUser));
      setUser(mockUser);
    }
  };

  const signOut = async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } else {
      localStorage.removeItem(LOCAL_USER_KEY);
      setUser(null);
    }
  };

  const updatePassword = async (password: string) => {
    if (supabase) {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    } else {
      console.log("Mock update password succeeded locally");
    }
  };

  const updateProfile = async (fullName: string) => {
    if (supabase) {
      const { data, error } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });
      if (error) throw error;
      setUser(data.user);
    } else {
      if (user) {
        const updated = {
          ...user,
          user_metadata: { ...user.user_metadata, full_name: fullName }
        };
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updated));
        setUser(updated);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        updatePassword,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
