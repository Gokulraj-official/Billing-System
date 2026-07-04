"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { 
  Leaf, 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  BarChart3, 
  User, 
  LogOut,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/billing", label: "Billing", icon: ShoppingCart },
    { href: "/products", label: "Products", icon: Package },
    { href: "/members", label: "Members", icon: Users },
    { href: "/reports", label: "Reports", icon: BarChart3 },
  ];

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getInitials = () => {
    const name = user?.user_metadata?.full_name || user?.email || "U";
    if (name.includes("@")) {
      return name.split("@")[0].substring(0, 2).toUpperCase();
    }
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 glassmorphism shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-md shadow-emerald-500/20">
              <Leaf className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tight text-foreground leading-none">KEERTHI</span>
              <span className="text-[10px] text-emerald-600 font-semibold tracking-widest leading-none mt-0.5">BILLING SYSTEM</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer",
                    isActive
                      ? "bg-emerald-50 text-emerald-700 font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-emerald-600" : "text-muted-foreground")} />
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Section / User Settings Dropdown */}
          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live POS Mode
            </span>

            {user && (
              <div className="relative" ref={dropdownRef}>
                {/* User Avatar Circle */}
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white font-black text-xs shadow-md shadow-emerald-500/10 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer border border-emerald-400/20"
                >
                  {getInitials()}
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2.5 w-56 rounded-2xl border border-border/80 bg-white p-2.5 shadow-2xl animate-zoom-in z-50">
                    {/* User Profile Summary */}
                    <div className="flex flex-col px-3 py-2">
                      <span className="font-extrabold text-sm text-foreground truncate">
                        {user.user_metadata?.full_name || "POS Associate"}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate mt-0.5">
                        {user.email}
                      </span>
                    </div>

                    <div className="border-t border-border/40 my-1.5"></div>

                    {/* Links */}
                    <Link
                      href="/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4 text-emerald-600" />
                      <span>Account Settings</span>
                    </Link>

                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        signOut();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
