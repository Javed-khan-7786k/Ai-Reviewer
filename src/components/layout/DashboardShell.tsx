"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sparkles,
  LayoutDashboard,
  FileText,
  BarChart3,
  Settings,
  UploadCloud,
  Menu,
  X,
  ChevronRight,
  Shield,
  Zap,
  CreditCard,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getCurrentUserAction, logoutUserAction } from "@/actions/auth";
import { getAdminPublicLimitsAction } from "@/actions/admin";
import { useToast } from "@/components/ui/Toast";
import { USER_CHANGED_EVENT } from "@/components/auth/LocalStorageUserSync";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{
    id: string;
    name: string | null;
    email: string;
    plan: string;
    role?: string;
  } | null>(null);
  const [limits, setLimits] = useState<{ maxDailyUploadsFree: number; maxDailyRewritesFree: number } | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const u = await getCurrentUserAction();
        setUser(u);
        const lim = await getAdminPublicLimitsAction();
        setLimits(lim);
      } catch {
        // ignore
      }
    }
    fetchUser();

    const handleUserChanged = (e: any) => {
      if (e.detail) {
        setUser(e.detail);
      } else {
        fetchUser();
      }
    };

    window.addEventListener(USER_CHANGED_EVENT, handleUserChanged);
    return () => {
      window.removeEventListener(USER_CHANGED_EVENT, handleUserChanged);
    };
  }, [pathname]);

  const handleLogout = async () => {
    await logoutUserAction();
    if (typeof window !== "undefined") {
      localStorage.removeItem("ai_reviewer_user");
      localStorage.removeItem("ai_reviewer_jwt");
    }
    toast.info("You have signed out.");
    router.push("/login");
  };

  const isAdmin =
    user?.role === "admin" ||
    user?.email?.toLowerCase() === "javedkhan7786king@gmail.com";
  const isPro = user?.plan === "pro";

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Documents",
      href: "/documents",
      icon: FileText,
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: BarChart3,
    },
    {
      name: "Subscription",
      href: "/subscription",
      icon: CreditCard,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
    },
    ...(isAdmin
      ? [
          {
            name: "Admin Panel",
            href: "/admin",
            icon: Shield,
          },
        ]
      : []),
  ];

  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Workspace Overview";
    if (pathname === "/documents") return "Document Management";
    if (pathname?.startsWith("/documents/")) return "Analysis Workspace";
    if (pathname === "/analytics") return "Usage & Insights";
    if (pathname === "/subscription") return "Subscription & Pricing";
    if (pathname === "/settings") return "Account Settings";
    if (pathname === "/admin") return "Admin Command Center";
    return "AI Reviewer";
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile top navigation */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-bold text-base text-slate-900">AI Reviewer</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200/80 sticky top-0 h-screen shrink-0">
        {/* Brand */}
        <div className="p-5 border-b border-slate-100 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base text-slate-900 tracking-tight leading-none">
              AI Reviewer
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase mt-0.5">
              Workspace
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <div className="p-3 space-y-1 flex-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname?.startsWith(item.href);

            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? "text-blue-600" : "text-slate-400"
                  }`}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Dynamic Plan / Quota Widget */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 m-3 rounded-xl border">
          {isAdmin ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Admin Master</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  Full Access
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug mb-3">
                Full system control, zero rate limits, and administrative privileges.
              </p>
              <Link href="/admin">
                <button className="w-full text-center py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-white border border-indigo-200 rounded-lg shadow-2xs hover:bg-indigo-50 transition-colors cursor-pointer">
                  Admin Console
                </button>
              </Link>
            </div>
          ) : isPro ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-blue-600" />
                  <span>Pro Plan</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  Unlimited
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug mb-3">
                Unlimited document reviews and deep ATS career diagnostics.
              </p>
              <Link href="/subscription">
                <button className="w-full text-center py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-white border border-slate-200 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer">
                  Manage Plan
                </button>
              </Link>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Free Plan</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  Active
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug mb-3">
                {limits?.maxDailyUploadsFree || 5} reviews per day with paragraph rewrites.
              </p>
              <Link href="/subscription">
                <button className="w-full text-center py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-white border border-slate-200 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer">
                  Upgrade to Pro
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* User profile footer with Logout */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
              {user?.name
                ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                : "GU"}
            </div>
            <div className="flex flex-col truncate">
              <span className="text-xs font-semibold text-slate-900 truncate">
                {user?.name || "Guest User"}
              </span>
              <span className="text-[11px] text-slate-400 truncate">
                {user?.email || "guest@aireviewer.local"}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-64 bg-white h-full p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-slate-900">AI Reviewer</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-600 truncate font-medium">{user?.name || "Guest User"}</span>
              <button
                onClick={handleLogout}
                className="text-rose-600 font-medium flex items-center gap-1 hover:underline cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Topbar */}
        <header className="bg-white border-b border-slate-200/80 px-6 py-3.5 sticky top-0 z-30 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400 font-medium">Workspace</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <h1 className="font-semibold text-slate-800 text-sm tracking-tight">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/subscription"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full border border-blue-200 font-medium transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isPro ? "Pro Member" : "Free Tier"}</span>
            </Link>

            <Link href="/dashboard#upload">
              <Button size="sm" className="shadow-xs">
                <UploadCloud className="w-4 h-4 mr-1.5" />
                <span>Upload Document</span>
              </Button>
            </Link>

            <button
              onClick={handleLogout}
              className="text-xs font-medium text-slate-500 hover:text-rose-600 flex items-center gap-1 ml-1 cursor-pointer"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
