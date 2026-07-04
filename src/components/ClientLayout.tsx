"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ToastProvider } from "@/components/ui/toast";
import Navbar from "@/components/Navbar";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== "/login") {
        router.replace("/login");
      } else if (user && pathname === "/login") {
        router.replace("/");
      }
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
        <span className="text-xs text-muted-foreground font-bold tracking-wide animate-pulse">
          Loading POS Session...
        </span>
      </div>
    );
  }

  if (!user && pathname !== "/login") return null;
  if (user && pathname === "/login") return null;

  return <>{children}</>;
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <AuthProvider>
      <ToastProvider>
        <AuthGuard>
          {!isLoginPage && <Navbar />}
          <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            {children}
          </main>
        </AuthGuard>
      </ToastProvider>
    </AuthProvider>
  );
}
