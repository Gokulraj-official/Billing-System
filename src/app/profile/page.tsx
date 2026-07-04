"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { User, Lock, Mail, ShieldAlert, Key } from "lucide-react";

export default function ProfilePage() {
  const { user, updatePassword, updateProfile } = useAuth();
  
  // Profile state
  const [fullName, setFullName] = useState<string>(user?.user_metadata?.full_name || "");
  const [profileLoading, setProfileLoading] = useState<boolean>(false);

  // Security state
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [securityLoading, setSecurityLoading] = useState<boolean>(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast({ title: "Validation Error", description: "Name is required.", variant: "destructive" });
      return;
    }

    setProfileLoading(true);
    try {
      await updateProfile(fullName);
      toast({
        title: "Profile Updated",
        description: "Your display details have been updated successfully.",
        variant: "success"
      });
    } catch (err: any) {
      toast({
        title: "Failed to Update Profile",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      toast({ title: "Validation Error", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }

    if (password.length < 6) {
      toast({ title: "Validation Error", description: "Password must be at least 6 characters long.", variant: "destructive" });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: "Validation Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }

    setSecurityLoading(true);
    try {
      await updatePassword(password);
      setPassword("");
      setConfirmPassword("");
      toast({
        title: "Security Updated",
        description: "Your login password has been changed successfully.",
        variant: "success"
      });
    } catch (err: any) {
      toast({
        title: "Failed to Change Password",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setSecurityLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
      
      {/* Title bar */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
          <User className="w-6 h-6 text-emerald-600" /> Account Settings
        </h1>
        <p className="text-xs text-muted-foreground">Manage your associate profile details and POS security settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Profile Details */}
        <Card className="shadow-sm border-border/40">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" /> Profile Details
            </CardTitle>
            <CardDescription>Update your display name and view POS credentials</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
              
              {/* Email (Readonly) */}
              <div className="flex flex-col gap-1.5 opacity-70">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-600" /> Email Address (Primary)
                </label>
                <Input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-secondary/40 cursor-not-allowed text-xs font-medium"
                />
              </div>

              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-600" /> Full Name
                </label>
                <Input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Khiruthiga"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="gradient"
                disabled={profileLoading}
                className="mt-2 font-bold cursor-pointer w-full"
              >
                {profileLoading ? "Saving..." : "Save Details"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Card 2: Change Password */}
        <Card className="shadow-sm border-border/40">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-600" /> Change Password
            </CardTitle>
            <CardDescription>Update your password to secure your POS profile</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
              
              {/* New Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" /> New Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" /> Confirm New Password
                </label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="gradient"
                disabled={securityLoading}
                className="mt-2 font-bold cursor-pointer w-full"
              >
                {securityLoading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
