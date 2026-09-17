"use client";

import React, { useState, useEffect } from "react";
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
  ShieldAlert,
  Gift,
  Lock,
  CreditCard,
  Sliders,
  Users,
  CheckCircle2,
  RefreshCw,
  Save,
  Server,
  Key,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import {
  getAdminConfigAction,
  updateAdminConfigAction,
  getAllUsersAdminAction,
  verifyAdminPasscodeAction,
  cleanupExpiredGuestsAdminAction,
} from "@/actions/admin";
import { getCurrentUserAction } from "@/actions/auth";
import { AdminConfig } from "@/lib/admin";

export default function AdminPage() {
  const toast = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  // Admin access protection passkey state
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState(false);

  // Payment keys form state
  const [paymentKeys, setPaymentKeys] = useState({
    razorpayKeyId: "",
    razorpayKeySecret: "",
    stripePublishableKey: "",
    stripeSecretKey: "",
    paypalClientId: "",
    paypalSecret: "",
  });

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      const [u, cfg, userList] = await Promise.all([
        getCurrentUserAction(),
        getAdminConfigAction(),
        getAllUsersAdminAction(),
      ]);
      setCurrentUser(u);
      setConfig(cfg);
      if (cfg?.paymentKeys) {
        setPaymentKeys({
          razorpayKeyId: cfg.paymentKeys.razorpayKeyId || "",
          razorpayKeySecret: cfg.paymentKeys.razorpayKeySecret || "",
          stripePublishableKey: cfg.paymentKeys.stripePublishableKey || "",
          stripeSecretKey: cfg.paymentKeys.stripeSecretKey || "",
          paypalClientId: cfg.paymentKeys.paypalClientId || "",
          paypalSecret: cfg.paymentKeys.paypalSecret || "",
        });
      }
      setUsers(userList);

      // Super admin check: explicit role from DB or super admin email
      const isSessionAdmin =
        u?.role === "admin" ||
        u?.email?.toLowerCase() === "javedkhan7786king@gmail.com";
      const localAdmin =
        typeof window !== "undefined" &&
        localStorage.getItem("ai_reviewer_admin_unlocked") === "true";
      if (isSessionAdmin || localAdmin) {
        setIsUnlocked(true);
      }
      setIsLoading(false);
    }
    init();
  }, []);

  const handleUnlockAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    // Issue #3: Verify passcode via server action (reads ADMIN_PASSCODE env var)
    const result = await verifyAdminPasscodeAction(passcode.trim());
    if (result.success) {
      setIsUnlocked(true);
      setPasscodeError(null);
      if (typeof window !== "undefined") {
        localStorage.setItem("ai_reviewer_admin_unlocked", "true");
      }
      toast.success("Admin security clearance granted!", "Access Granted");
    } else {
      setPasscodeError(result.error || "Invalid admin passcode.");
      toast.error("Incorrect administrator passcode.");
    }
  };

  const handleToggle = async (key: keyof AdminConfig, value: any) => {
    if (!config) return;
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);

    setIsSaving(true);
    const res = await updateAdminConfigAction({ [key]: value });
    setIsSaving(false);

    if (res.success) {
      toast.success(`Admin setting "${key}" updated.`);
    } else {
      toast.error("Failed to update setting.");
    }
  };

  const handleSavePaymentKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    setIsSaving(true);
    const res = await updateAdminConfigAction({
      paymentKeys,
    });
    setIsSaving(false);

    if (res.success) {
      toast.success("Payment gateway credentials saved successfully.", "Keys Updated");
    } else {
      toast.error("Failed to save payment keys.");
    }
  };

  const handleSaveRateLimits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    setIsSaving(true);
    const res = await updateAdminConfigAction({ rateLimits: config.rateLimits });
    setIsSaving(false);

    if (res.success) {
      toast.success("Rate limits and validation rules updated.", "Limits Saved");
    } else {
      toast.error("Failed to update rate limits.");
    }
  };

  const handleSaveAiConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    setIsSaving(true);
    const res = await updateAdminConfigAction({
      geminiApiKey: config.geminiApiKey,
      aiProvider: config.aiProvider || "gemini",
    });
    setIsSaving(false);

    if (res.success) {
      toast.success("Google Gemini AI configuration saved successfully!", "AI Config Updated");
    } else {
      toast.error("Failed to save AI configuration.");
    }
  };

  if (isLoading || !config) {
    return (
      <DashboardShell>
        <div className="py-20 text-center text-xs text-slate-500">
          Loading Admin Control Console...
        </div>
      </DashboardShell>
    );
  }

  // Admin Protection Shield (If not unlocked)
  if (!isUnlocked) {
    return (
      <DashboardShell>
        <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-md bg-white border border-rose-200 shadow-xl rounded-2xl p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-1">
              Admin Protected Zone
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              This section is restricted to administrators. Enter your admin security key to unlock master controls.
            </p>

            <form onSubmit={handleUnlockAdmin} className="space-y-4 text-left">
              {passcodeError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  {passcodeError}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Administrator Passcode
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="Enter admin passcode (e.g. admin123)"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-900 font-medium"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Default developer test key: <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-600 font-bold">admin123</code>
                </span>
              </div>

              <Button
                type="submit"
                className="w-full justify-center text-xs h-10 bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs"
              >
                <ShieldCheck className="w-4 h-4 mr-1.5" />
                <span>Verify Admin Access</span>
              </Button>
            </form>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const handleCleanupGuests = async () => {
    if (
      !confirm(
        "Are you sure you want to permanently purge all guest accounts and uploaded files older than 7 days?"
      )
    ) {
      return;
    }
    setIsCleaning(true);
    try {
      const res = await cleanupExpiredGuestsAdminAction(7);
      if (res.success) {
        toast.success(
          `Purged ${res.deletedUsersCount} inactive guests, ${res.deletedDocumentsCount} documents, and freed storage!`,
          "Cleanup Successful"
        );
        const userList = await getAllUsersAdminAction();
        setUsers(userList);
      } else {
        toast.error(res.error || "Failed to purge guest data.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Cleanup failed.");
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <DashboardShell>
      {/* ... previous content ... */}
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold mb-2 border border-rose-200">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Protected Master Console</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Admin & System Governance
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Global toggles for free app mode, authentication requirements,
              payment gateways, and Joi/Zod rate limiting.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Admin Active ({currentUser?.name || "Admin"})</span>
            </span>
          </div>
        </div>

        {/* 1. MASTER APP TOGGLES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Toggle 1: Make Full App Free */}
          <Card className={config.fullAppFree ? "border-emerald-400 ring-2 ring-emerald-500/20 bg-emerald-50/20" : ""}>
            <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                  <Gift className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  Full App 100% Free Mode
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Bypasses all paywalls and limits. Grants every user unlimited
                  reviews and Pro features at zero cost.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-700">
                  {config.fullAppFree ? "Enabled (Free For All)" : "Disabled (Standard)"}
                </span>
                <input
                  type="checkbox"
                  checked={config.fullAppFree}
                  onChange={(e) => handleToggle("fullAppFree", e.target.checked)}
                  className="w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
              </div>
            </CardContent>
          </Card>

          {/* Toggle 2: Require User Login */}
          <Card>
            <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
                  <Lock className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  Authentication Requirement
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  When enabled, visitors must sign in to upload files. When
                  disabled, guests can upload directly.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-700">
                  {config.requireLogin ? "Login Required" : "Guest Uploads Allowed"}
                </span>
                <input
                  type="checkbox"
                  checked={config.requireLogin}
                  onChange={(e) => handleToggle("requireLogin", e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
              </div>
            </CardContent>
          </Card>

          {/* Toggle 3: Subscriptions System */}
          <Card>
            <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  Subscription Upgrades
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Controls whether users can see and purchase subscriptions on
                  the pricing page.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-700">
                  {config.subscriptionsEnabled ? "Subscriptions Active" : "Purchases Disabled"}
                </span>
                <input
                  type="checkbox"
                  checked={config.subscriptionsEnabled}
                  onChange={(e) => handleToggle("subscriptionsEnabled", e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 2. PAYMENT GATEWAY INTEGRATION & API KEYS */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span>Payment Gateway Integration & API Keys</span>
            </CardTitle>
            <CardDescription>
              Select the active payment processor and configure live API keys or test simulation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Gateway Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {[
                { id: "razorpay", name: "Razorpay", desc: "UPI, Cards, NetBanking (INR & International)" },
                { id: "stripe", name: "Stripe", desc: "Credit/Debit Cards, Apple Pay, Google Pay" },
                { id: "paypal", name: "PayPal", desc: "PayPal Wallet & Worldwide debit" },
                { id: "demo", name: "Demo Checkout", desc: "Simulated 1-click test checkout" },
              ].map((gw) => (
                <div
                  key={gw.id}
                  onClick={() => handleToggle("activePaymentGateway", gw.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    config.activePaymentGateway === gw.id
                      ? "border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-500/20"
                      : "border-slate-200 bg-slate-50 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">{gw.name}</span>
                    {config.activePaymentGateway === gw.id && (
                      <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">{gw.desc}</p>
                </div>
              ))}
            </div>

            {/* API Credentials Editor */}
            <form onSubmit={handleSavePaymentKeys} className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-slate-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Payment Gateway Credentials ({config.activePaymentGateway.toUpperCase()})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowKeys(!showKeys)}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                >
                  {showKeys ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showKeys ? "Hide Secrets" : "Reveal Keys"}</span>
                </button>
              </div>

              {/* Razorpay Inputs */}
              {config.activePaymentGateway === "razorpay" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Razorpay Key ID (rzp_test_...)
                    </label>
                    <input
                      type={showKeys ? "text" : "password"}
                      value={paymentKeys.razorpayKeyId}
                      onChange={(e) => setPaymentKeys({ ...paymentKeys, razorpayKeyId: e.target.value })}
                      placeholder="rzp_test_123456789"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Razorpay Key Secret
                    </label>
                    <input
                      type={showKeys ? "text" : "password"}
                      value={paymentKeys.razorpayKeySecret}
                      onChange={(e) => setPaymentKeys({ ...paymentKeys, razorpayKeySecret: e.target.value })}
                      placeholder="••••••••••••••••"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 font-medium"
                    />
                  </div>
                </div>
              )}

              {/* Stripe Inputs */}
              {config.activePaymentGateway === "stripe" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Stripe Publishable Key (pk_test_...)
                    </label>
                    <input
                      type={showKeys ? "text" : "password"}
                      value={paymentKeys.stripePublishableKey}
                      onChange={(e) => setPaymentKeys({ ...paymentKeys, stripePublishableKey: e.target.value })}
                      placeholder="pk_test_123456789"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Stripe Secret Key (sk_test_...)
                    </label>
                    <input
                      type={showKeys ? "text" : "password"}
                      value={paymentKeys.stripeSecretKey}
                      onChange={(e) => setPaymentKeys({ ...paymentKeys, stripeSecretKey: e.target.value })}
                      placeholder="••••••••••••••••"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 font-medium"
                    />
                  </div>
                </div>
              )}

              {/* PayPal Inputs */}
              {config.activePaymentGateway === "paypal" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      PayPal Client ID
                    </label>
                    <input
                      type={showKeys ? "text" : "password"}
                      value={paymentKeys.paypalClientId}
                      onChange={(e) => setPaymentKeys({ ...paymentKeys, paypalClientId: e.target.value })}
                      placeholder="client_id_here"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      PayPal Secret Key
                    </label>
                    <input
                      type={showKeys ? "text" : "password"}
                      value={paymentKeys.paypalSecret}
                      onChange={(e) => setPaymentKeys({ ...paymentKeys, paypalSecret: e.target.value })}
                      placeholder="••••••••••••••••"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 font-medium"
                    />
                  </div>
                </div>
              )}

              {config.activePaymentGateway === "demo" && (
                <p className="text-xs text-slate-500 italic">
                  Demo Checkout uses instant mock payment approvals. No external API keys required.
                </p>
              )}

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="testMode"
                    checked={config.paymentTestMode}
                    onChange={(e) => handleToggle("paymentTestMode", e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="testMode" className="text-xs font-medium text-slate-700 cursor-pointer">
                    Sandbox / Test Mode (dummy payments)
                  </label>
                </div>

                <Button type="submit" size="sm" isLoading={isSaving} className="cursor-pointer">
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  <span>Save Gateway Credentials</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* 3. RATE LIMITING & VALIDATION (Joi / Formik / Zod) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>Rate Limiting & Upload Validation Rules</span>
            </CardTitle>
            <CardDescription>
              Enforced server-side using schema validators against spam and API abuse.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveRateLimits} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Max Uploads Per Minute
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={config.rateLimits.maxUploadsPerMinute}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        rateLimits: {
                          ...config.rateLimits,
                          maxUploadsPerMinute: parseInt(e.target.value) || 10,
                        },
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Max Document Size (MB)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={config.rateLimits.maxFileSizeMB}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        rateLimits: {
                          ...config.rateLimits,
                          maxFileSizeMB: parseInt(e.target.value) || 10,
                        },
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Daily Uploads (Free Tier)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={config.rateLimits.maxDailyUploadsFree}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        rateLimits: {
                          ...config.rateLimits,
                          maxDailyUploadsFree: parseInt(e.target.value) || 5,
                        },
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Daily Uploads (Pro Tier)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="1000"
                    value={config.rateLimits.maxDailyUploadsPro || 100}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        rateLimits: {
                          ...config.rateLimits,
                          maxDailyUploadsPro: parseInt(e.target.value) || 100,
                        },
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Daily AI Rewrites (Free Tier)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="200"
                    value={config.rateLimits.maxDailyRewritesFree}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        rateLimits: {
                          ...config.rateLimits,
                          maxDailyRewritesFree: parseInt(e.target.value) || 25,
                        },
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Daily AI Rewrites (Pro Tier)
                  </label>
                  <input
                    type="number"
                    min="20"
                    max="5000"
                    value={config.rateLimits.maxDailyRewritesPro || 500}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        rateLimits: {
                          ...config.rateLimits,
                          maxDailyRewritesPro: parseInt(e.target.value) || 500,
                        },
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <Button type="submit" size="sm" isLoading={isSaving} className="cursor-pointer">
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  <span>Save Rate Limiting Rules</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* 4. REAL DYNAMIC USER DIRECTORY */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Registered Accounts & Roles (From Database)</span>
            </CardTitle>
            <CardDescription>
              Real database users and their active membership tier.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="py-2.5 px-3">User</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Plan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="py-3 px-3 text-slate-900 font-bold">{u.name}</td>
                      <td className="py-3 px-3 text-slate-500">{u.email}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.role === "admin"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}>
                          {u.role || "user"}
                        </span>
                      </td>
                      <td className="py-3 px-3 capitalize">
                        {config.fullAppFree ? "Pro (Free Mode)" : u.plan}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* 5. GUEST DATA RETENTION & STORAGE OPTIMIZATION (7-DAY AUTO PURGE) */}
        <Card className="border-amber-200/80 bg-linear-to-br from-white to-amber-50/20">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-amber-600" />
                  <span>Storage & Inactive Guest Retention (7-Day Purge)</span>
                </CardTitle>
                <CardDescription className="mt-1">
                  Permanently cleans up temporary guest accounts, orphan records, and uploaded files older than 7 days from both MongoDB Atlas and Vercel Blob storage.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCleanupGuests}
                disabled={isCleaning}
                className="border-amber-300 text-amber-900 hover:bg-amber-100/60 font-semibold cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isCleaning ? "animate-spin" : ""}`} />
                <span>{isCleaning ? "Purging Old Guests..." : "Purge Expired Guests (>7 Days)"}</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-white rounded-xl border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600">
              <div className="space-y-1">
                <span className="font-semibold text-slate-900 block">Automated Background Cron</span>
                <p className="text-[11px] text-slate-500">
                  Configured via <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">vercel.json</code> to run daily at midnight (<code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">/api/cron/cleanup</code>).
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[11px] border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active (7-Day Policy)
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
