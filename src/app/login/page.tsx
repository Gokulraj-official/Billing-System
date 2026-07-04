"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/database";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { Leaf, Lock, Mail, User as UserIcon, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp, user } = useAuth();
  
  const [isSignUpMode, setIsSignUpMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Form Fields
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast({ title: "Validation Error", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }

    if (isSignUpMode && !fullName.trim()) {
      toast({ title: "Validation Error", description: "Full Name is required.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      if (isSignUpMode) {
        await signUp(email, password, fullName);
        toast({
          title: "Account Created",
          description: "Please check your email to verify your account or sign in directly.",
          variant: "success"
        });
        setIsSignUpMode(false);
      } else {
        await signIn(email, password);
        toast({
          title: "Welcome Back",
          description: "Successfully signed in.",
          variant: "success"
        });
        router.replace("/");
      }
    } catch (err: any) {
      console.error(err);
      let desc = err.message || "An unexpected error occurred.";
      const errMsg = String(err.message || "").toLowerCase();
      if (errMsg === "email not confirmed") {
        desc = "Email not confirmed. Check your inbox for the verification link or turn off 'Confirm email' in your Supabase Auth Settings.";
      } else if (errMsg.includes("rate limit") || errMsg.includes("request this once every")) {
        desc = "Rate limit exceeded. Turn off 'Confirm email' in your Supabase Auth settings (Providers -> Email) to sign up instantly without verification emails.";
      }
      toast({
        title: isSignUpMode ? "Registration Failed" : "Sign In Failed",
        description: desc,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const isSupabaseLive = supabase !== null;

  return (
    <div className="flex-1 flex items-center justify-center min-h-[80vh] px-4 py-12">
      <div className="w-full max-w-md flex flex-col gap-6">
        
        {/* Branding header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/20">
            <Leaf className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex flex-col mt-2">
            <h1 className="text-xl font-black tracking-tight text-foreground">KEERTHI BILLING SYSTEM</h1>
            <p className="text-xs text-muted-foreground mt-1">Enterprise Point-of-Sale Terminal</p>
          </div>
        </div>

        {/* Card Form */}
        <Card className="shadow-2xl border-border/40">
          <CardHeader className="pb-4">
            <div className="flex border-b border-border/40 p-1 bg-secondary/20 rounded-xl">
              <button
                type="button"
                onClick={() => setIsSignUpMode(false)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  !isSignUpMode 
                    ? "bg-white text-emerald-700 shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setIsSignUpMode(true)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  isSignUpMode 
                    ? "bg-white text-emerald-700 shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Create Account
              </button>
            </div>
            <CardDescription className="text-center mt-3">
              {isSignUpMode 
                ? "Register a new POS associate account" 
                : "Sign in with your POS credentials"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              
              {/* Full Name (Sign Up Only) */}
              {isSignUpMode && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-emerald-600" /> Full Name
                  </label>
                  <Input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Khiruthiga"
                    required
                  />
                </div>
              )}

              {/* Email Address */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-600" /> Email Address
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" /> Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="gradient"
                size="lg"
                disabled={loading}
                className="w-full mt-2 font-bold cursor-pointer"
              >
                {loading 
                  ? "Processing..." 
                  : isSignUpMode 
                  ? "Create POS Account" 
                  : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Offline Guest Info helper (only if Supabase envs are not loaded) */}
        {!isSupabaseLive && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs text-center flex flex-col gap-1">
            <span className="font-bold flex items-center justify-center gap-1">
              ⚠️ Sandbox Mode (Offline Fallback)
            </span>
            <span>Sign in with: <strong>admin@keerthi.com</strong> and password: <strong>admin123</strong></span>
          </div>
        )}
      </div>
    </div>
  );
}
