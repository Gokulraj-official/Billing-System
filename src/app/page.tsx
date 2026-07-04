"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getInvoices, getProducts, getMembers } from "@/lib/database";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  ShoppingCart, 
  PlusCircle, 
  FileText, 
  ArrowRight,
  ChevronRight
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function Dashboard() {
  const [stats, setStats] = useState({
    todaySales: 0,
    productsSoldToday: 0,
    totalMembers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const todayStr = new Date().toISOString().split("T")[0];
        
        // Fetch data
        const invoices = await getInvoices();
        const members = await getMembers();

        // Calculate stats
        const todayInvoices = invoices.filter(inv => inv.date === todayStr);
        const todaySales = todayInvoices.reduce((acc, inv) => acc + Number(inv.total), 0);
        
        let productsSoldToday = 0;
        todayInvoices.forEach(inv => {
          inv.items.forEach(item => {
            productsSoldToday += item.quantity;
          });
        });

        setStats({
          todaySales,
          productsSoldToday,
          totalMembers: members.length,
        });
      } catch (err) {
        console.error("Error loading dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
      {/* Welcome Hero Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/10 rounded-3xl p-6 md:p-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            Keerthi POS & Billing System
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            Manage your product sales, track members, and print clean invoices instantly.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/billing">
            <Button variant="gradient" size="lg" className="shadow-lg shadow-emerald-500/25">
              <ShoppingCart className="w-5 h-5" />
              Start New Bill
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI 1: Today's Sales */}
        <Card className="relative overflow-hidden group border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-90 group-hover:opacity-95 transition-opacity" />
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-110 transition-transform" />
          <CardContent className="relative p-6 text-white flex flex-col justify-between min-h-[140px]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold tracking-wider uppercase opacity-85">Today's Sales</span>
              <div className="p-2 bg-white/10 rounded-xl">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="mt-4">
              {loading ? (
                <div className="h-9 w-28 bg-white/20 rounded animate-pulse" />
              ) : (
                <h3 className="text-3xl font-extrabold tracking-tight leading-none">
                  {formatCurrency(stats.todaySales)}
                </h3>
              )}
              <span className="text-[11px] opacity-75 mt-1.5 inline-block">Real-time revenue tracking</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Products Sold Today */}
        <Card className="relative overflow-hidden group border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-90 group-hover:opacity-95 transition-opacity" />
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-110 transition-transform" />
          <CardContent className="relative p-6 text-white flex flex-col justify-between min-h-[140px]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold tracking-wider uppercase opacity-85">Products Sold</span>
              <div className="p-2 bg-white/10 rounded-xl">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="mt-4">
              {loading ? (
                <div className="h-9 w-20 bg-white/20 rounded animate-pulse" />
              ) : (
                <h3 className="text-3xl font-extrabold tracking-tight leading-none">
                  {stats.productsSoldToday}
                </h3>
              )}
              <span className="text-[11px] opacity-75 mt-1.5 inline-block">Units sold today</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Total Active Members */}
        <Card className="relative overflow-hidden group border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-green-700 opacity-90 group-hover:opacity-95 transition-opacity" />
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-110 transition-transform" />
          <CardContent className="relative p-6 text-white flex flex-col justify-between min-h-[140px]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold tracking-wider uppercase opacity-85">Total Members</span>
              <div className="p-2 bg-white/10 rounded-xl">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="mt-4">
              {loading ? (
                <div className="h-9 w-16 bg-white/20 rounded animate-pulse" />
              ) : (
                <h3 className="text-3xl font-extrabold tracking-tight leading-none">
                  {stats.totalMembers}
                </h3>
              )}
              <span className="text-[11px] opacity-75 mt-1.5 inline-block">Registered clients in center</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation Area */}
      <div className="flex flex-col gap-4 mt-2">
        <h2 className="text-lg font-bold tracking-tight text-foreground">Quick Management</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/billing" className="group">
            <div className="flex items-center justify-between p-5 bg-card border border-border/40 rounded-2xl hover:border-emerald-500/30 hover:bg-emerald-50/10 transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-foreground">POS Terminal</span>
                  <span className="text-xs text-muted-foreground">Checkout cart & print bill</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          <Link href="/products" className="group">
            <div className="flex items-center justify-between p-5 bg-card border border-border/40 rounded-2xl hover:border-emerald-500/30 hover:bg-emerald-50/10 transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-foreground">Products</span>
                  <span className="text-xs text-muted-foreground">Manage catalog & inventory</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          <Link href="/reports" className="group">
            <div className="flex items-center justify-between p-5 bg-card border border-border/40 rounded-2xl hover:border-emerald-500/30 hover:bg-emerald-50/10 transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 group-hover:text-indigo-700 transition-colors">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-foreground">Sales Reports</span>
                  <span className="text-xs text-muted-foreground">Export CSV & view history</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
