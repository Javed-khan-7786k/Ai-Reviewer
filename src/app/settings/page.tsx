"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  User,
  Zap,
  Sliders,
  Shield,
  Trash2,
  LogOut,
  Check,
  CreditCard,
  Bell,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { getCurrentUserAction, logoutUserAction } from "@/actions/auth";
import { updateProfileNameAction, purgeAllUserDocumentsAction } from "@/actions/settings";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";

export default function SettingsPage() {
  const router = useRouter();
  const toast = useToast();

  const [user, setUser] = useState<any>(null);
  const [nameInput, setNameInput] = useState("");
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [defaultMode, setDefaultMode] = useState("auto");
  const [sensitivity, setSensitivity] = useState("balanced");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [autoPurge, setAutoPurge] = useState(false);
  const [purgeModalOpen, setPurgeModalOpen] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    async function load() {
      const u = await getCurrentUserAction();
      setUser(u);
      setNameInput(u.name || "");
    }
    load();
  }, []);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    setIsUpdatingName(true);
    const res = await updateProfileNameAction(nameInput);
    setIsUpdatingName(false);

    if (res.success) {
      toast.success("Profile name updated successfully!");
      setUser((prev: any) => {
        const updated = { ...prev, name: nameInput.trim() };
        if (typeof window !== "undefined") {
          const raw = localStorage.getItem("ai_reviewer_user");
          if (raw) {
            try {
              const u = JSON.parse(raw);
              localStorage.setItem("ai_reviewer_user", JSON.stringify({ ...u, name: nameInput.trim() }));
            } catch (e) {}
          }
        }
        return updated;
      });
    } else {
      toast.error(res.error || "Failed to update name.");
    }
  };

  const handlePurgeAll = async () => {
    setIsPurging(true);
    const res = await purgeAllUserDocumentsAction();
    setIsPurging(false);

    if (res.success) {
      setPurgeModalOpen(false);
      toast.success("All your review documents and analyses were permanently erased.");
      router.refresh();
    } else {
      toast.error(res.error || "Failed to purge documents.");
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logoutUserAction();
    if (typeof window !== "undefined") {
      localStorage.removeItem("ai_reviewer_user");
      localStorage.removeItem("ai_reviewer_jwt");
    }
    toast.info("You have signed out.");
    router.push("/login");
  };

  return (
    <DashboardShell>
      <div className="space-y-8 max-w-4xl">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Account Settings
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your personal profile, plan limits, review preferences, and data privacy.
          </p>
        </div>

        {/* 1. Customer Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <span>Personal Profile</span>
            </CardTitle>
            <CardDescription>
              Your personal identification and login credentials.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleUpdateName} className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Display Name
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 font-medium"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    variant="outline"
                    isLoading={isUpdatingName}
                  >
                    Save Name
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || "user@example.com"}
                  className="w-full px-3 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Primary email used for review notifications and account login.
                </span>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* 2. Membership & Plan Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Membership & Plan</span>
            </CardTitle>
            <CardDescription>
              Your active subscription tier and daily review allowances.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-slate-900 capitalize">
                    {user?.plan || "free"} Plan
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200 uppercase">
                    Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {user?.plan === "pro"
                    ? "Unlimited document analyses, full ATS checks, and priority queue."
                    : "5 reviews per day and 25 paragraph rewrites daily."}
                </p>
              </div>

              <Link href="/subscription">
                <Button size="sm" className="shadow-xs whitespace-nowrap">
                  <span>
                    {user?.plan === "pro" ? "Manage Subscription" : "Upgrade to Pro Plan"}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* 3. Review & Analysis Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>Analysis Preferences</span>
            </CardTitle>
            <CardDescription>
              Customize how documents are categorized and reviewed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Document Detection
              </label>
              <select
                value={defaultMode}
                onChange={(e) => {
                  setDefaultMode(e.target.value);
                  toast.success("Default document mode updated.");
                }}
                className="w-full max-w-sm px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="auto">Auto-detect (Recommended)</option>
                <option value="resume">Always analyze as Resume / CV</option>
                <option value="general">Always analyze as General Document</option>
              </select>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Auto-detect checks for experience, education, and skill headers.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                AI Pattern Sensitivity
              </label>
              <select
                value={sensitivity}
                onChange={(e) => {
                  setSensitivity(e.target.value);
                  toast.success("Sensitivity threshold updated.");
                }}
                className="w-full max-w-sm px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="balanced">Balanced (Standard linguistic variance)</option>
                <option value="strict">Strict (Flags subtle sentence uniformity)</option>
                <option value="lenient">Lenient (Tolerates repetitive editorial phrasing)</option>
              </select>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">
                  Processing Completion Alerts
                </span>
                <span className="text-[11px] text-slate-500">
                  Notify me with a browser toast when document analysis completes.
                </span>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* 4. Privacy & Data Sovereignty */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Privacy & Data Sovereignty</span>
            </CardTitle>
            <CardDescription>
              Full control over your stored documents and review records.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">
                  Automatic Document Auto-Purge
                </span>
                <span className="text-[11px] text-slate-500">
                  Automatically delete reviewed files after 30 days.
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoPurge}
                onChange={(e) => {
                  setAutoPurge(e.target.checked);
                  toast.success(
                    e.target.checked
                      ? "Auto-purge enabled (30-day retention)."
                      : "Auto-purge disabled."
                  );
                }}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
            </div>

            <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-rose-700 block">
                  Purge All Document History
                </span>
                <span className="text-[11px] text-slate-500">
                  Permanently erase all past uploaded files and analysis results.
                </span>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setPurgeModalOpen(true)}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                <span>Purge All Documents</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 5. Session Logout */}
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-800 block">
                Session Management
              </span>
              <span className="text-[11px] text-slate-500">
                Sign out of this browser session.
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              isLoading={isLoggingOut}
              className="text-slate-700 hover:text-rose-600"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              <span>Sign Out</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Purge All Documents Modal */}
      <ConfirmDeleteModal
        isOpen={purgeModalOpen}
        documentTitle="ALL uploaded documents and analyses"
        isDeleting={isPurging}
        onClose={() => setPurgeModalOpen(false)}
        onConfirm={handlePurgeAll}
      />
    </DashboardShell>
  );
}
