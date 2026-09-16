"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/Button";
import {
  Check,
  Zap,
  Sparkles,
  Shield,
  CreditCard,
  X,
  Globe,
  Gift,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { upgradeUserPlanAction } from "@/actions/subscription";
import { getAdminConfigAction } from "@/actions/admin";
import { AdminConfig } from "@/lib/admin";
import confetti from "canvas-confetti";

type CurrencyCode = "USD" | "INR" | "EUR" | "GBP" | "CAD" | "AUD";

interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  flag: string;
  name: string;
  proMonthly: number;
  proAnnual: number;
  teamMonthly: number;
}

const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  USD: {
    code: "USD",
    symbol: "$",
    flag: "🇺🇸",
    name: "US Dollar",
    proMonthly: 19,
    proAnnual: 15,
    teamMonthly: 49,
  },
  INR: {
    code: "INR",
    symbol: "₹",
    flag: "🇮🇳",
    name: "Indian Rupee",
    proMonthly: 1499,
    proAnnual: 1199,
    teamMonthly: 3999,
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    flag: "🇪🇺",
    name: "Euro",
    proMonthly: 18,
    proAnnual: 14,
    teamMonthly: 45,
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    flag: "🇬🇧",
    name: "British Pound",
    proMonthly: 15,
    proAnnual: 12,
    teamMonthly: 39,
  },
  CAD: {
    code: "CAD",
    symbol: "C$",
    flag: "🇨🇦",
    name: "Canadian Dollar",
    proMonthly: 25,
    proAnnual: 20,
    teamMonthly: 65,
  },
  AUD: {
    code: "AUD",
    symbol: "A$",
    flag: "🇦🇺",
    name: "Australian Dollar",
    proMonthly: 29,
    proAnnual: 22,
    teamMonthly: 75,
  },
};

export default function SubscriptionPage() {
  const toast = useToast();
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [isAnnual, setIsAnnual] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<"free" | "pro">("free");
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedPlanToUpgrade, setSelectedPlanToUpgrade] = useState<"free" | "pro">("pro");
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [adminConfig, setAdminConfig] = useState<AdminConfig | null>(null);

  useEffect(() => {
    // Auto-detect country/currency preference from locale or timezone
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz.includes("Calcutta") || tz.includes("Kolkata") || tz.includes("India")) {
        setCurrency("INR");
      } else if (tz.includes("London") || tz.includes("Europe/London")) {
        setCurrency("GBP");
      } else if (tz.includes("Europe")) {
        setCurrency("EUR");
      } else if (tz.includes("Toronto") || tz.includes("Vancouver")) {
        setCurrency("CAD");
      } else if (tz.includes("Sydney") || tz.includes("Melbourne")) {
        setCurrency("AUD");
      }
    } catch {
      // fallback to USD
    }

    // Load admin configuration
    async function loadConfig() {
      const cfg = await getAdminConfigAction();
      setAdminConfig(cfg);
    }
    loadConfig();
  }, []);

  const curr = CURRENCIES[currency];

  const handleOpenCheckout = (plan: "free" | "pro") => {
    setSelectedPlanToUpgrade(plan);
    setCheckoutModalOpen(true);
  };

  const handleConfirmUpgrade = async () => {
    setIsUpgrading(true);
    const res = await upgradeUserPlanAction(selectedPlanToUpgrade);
    setIsUpgrading(false);

    if (res.success) {
      setCurrentPlan(selectedPlanToUpgrade);
      setCheckoutModalOpen(false);

      if (selectedPlanToUpgrade === "pro") {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }
        toast.success("Successfully upgraded to Pro Plan! Enjoy unlimited reviews.", "Plan Activated");
      } else {
        toast.info("Plan changed to Free Plan.", "Subscription Updated");
      }
    } else {
      toast.error(res.error || "Failed to update subscription.");
    }
  };

  const isFullAppFree = Boolean(adminConfig?.fullAppFree);
  const isSubsDisabled = Boolean(adminConfig && !adminConfig.subscriptionsEnabled && !isFullAppFree);

  const proPrice = isFullAppFree
    ? "FREE"
    : `${curr.symbol}${isAnnual ? curr.proAnnual : curr.proMonthly}`;

  const teamPrice = isFullAppFree
    ? "FREE"
    : `${curr.symbol}${curr.teamMonthly}`;

  return (
    <DashboardShell>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Admin Announcement Banner if Full App is Free */}
        {isFullAppFree && (
          <div className="p-4 bg-emerald-50 border-2 border-emerald-500/50 rounded-2xl flex items-center justify-between gap-4 text-emerald-900 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold">
                  Administrator Notice: Full App Free Mode Is Active!
                </h4>
                <p className="text-xs text-emerald-700">
                  All subscriptions are waived. Every user currently enjoys
                  unlimited document reviews, deep ATS analysis, and instant AI rewrites for free.
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-block px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg uppercase tracking-wider">
              100% Unlocked
            </span>
          </div>
        )}

        {isSubsDisabled && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3 text-blue-900">
            <Sparkles className="w-5 h-5 text-blue-600 shrink-0" />
            <p className="text-xs">
              Subscription billing is currently disabled by the administrator. Free starter quotas are active for all documents.
            </p>
          </div>
        )}

        {/* Header with Currency Selector */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-3 border border-blue-200/80">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Transparent Multi-Currency Pricing</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Elevate Your Writing With Zero Limits
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Select your currency and preferred billing cadence below.
            </p>
          </div>

          {/* Currency Dropdown & Billing Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Currency Selector */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
              >
                {Object.values(CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Monthly / Annual Toggle */}
            <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  !isAnnual
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  isAnnual
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Annual</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.2 rounded-full">
                  -20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Plan 1: Free Starter */}
          <div className="rounded-2xl p-7 flex flex-col justify-between bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-slate-900">Free Starter</h3>
                {currentPlan === "free" && !isFullAppFree && (
                  <span className="text-[10px] font-semibold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                Essential review tools for casual job seekers and students.
              </p>

              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-extrabold text-slate-900">
                  {curr.symbol}0
                </span>
                <span className="text-xs text-slate-500 font-medium">/forever</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-6">No credit card required</p>

              <div className="border-t border-slate-100 pt-5 space-y-3 mb-8">
                {[
                  "5 document reviews per day",
                  "25 AI paragraph rewrites daily",
                  "Flesch-Kincaid readability scoring",
                  "Basic keyword extraction",
                  "10MB file size limit (PDF & DOCX)",
                  "Private Cloudflare R2 storage",
                ].map((feat, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-slate-600">
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Button
                variant="outline"
                className="w-full justify-center text-xs h-10 border-slate-300"
                disabled
              >
                {currentPlan === "free" && !isFullAppFree ? "Current Plan" : "Included Free"}
              </Button>
            </div>
          </div>

          {/* Plan 2: Pro Analyst */}
          <div className="rounded-2xl p-7 flex flex-col justify-between bg-white border-2 border-blue-600 shadow-lg relative ring-4 ring-blue-600/10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs">
              Most Popular
            </div>

            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-slate-900">Pro Analyst</h3>
                {(currentPlan === "pro" || isFullAppFree) && (
                  <span className="text-[10px] font-bold uppercase bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                    {isFullAppFree ? "Unlocked Free" : "Active"}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                Uncapped document intelligence for serious career advancement.
              </p>

              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-extrabold text-slate-900">
                  {proPrice}
                </span>
                {!isFullAppFree && (
                  <span className="text-xs text-slate-500 font-medium">
                    /month
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mb-6">
                {isFullAppFree
                  ? "Bypassed by admin free mode"
                  : isAnnual
                  ? `Billed annually (${curr.symbol}${curr.proAnnual * 12}/yr)`
                  : "Billed monthly, cancel anytime"}
              </p>

              <div className="border-t border-slate-100 pt-5 space-y-3 mb-8">
                {[
                  "Unlimited document reviews",
                  "Unlimited AI paragraph rewrites",
                  "Deep Resume ATS section scoring",
                  "Action verbs & quantifiable metrics audit",
                  "GPT-4o structured career feedback",
                  "Highest priority processing queue",
                  "Export downloadable report summaries",
                  "Zero data retention guarantees",
                ].map((feat, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              {currentPlan === "pro" || isFullAppFree ? (
                <Button
                  variant="outline"
                  className="w-full justify-center text-xs h-10 border-blue-300 text-blue-700 bg-blue-50/50"
                  disabled
                >
                  Active Plan
                </Button>
              ) : (
                <Button
                  className="w-full justify-center text-xs h-10 shadow-sm"
                  onClick={() => handleOpenCheckout("pro")}
                  disabled={isSubsDisabled}
                >
                  Upgrade to Pro Plan ({curr.symbol}{isAnnual ? curr.proAnnual : curr.proMonthly}/mo)
                </Button>
              )}
            </div>
          </div>

          {/* Plan 3: Team / Enterprise */}
          <div className="rounded-2xl p-7 flex flex-col justify-between bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-slate-900">Team & Enterprise</h3>
              </div>
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                Centralized document governance for recruiting and HR teams.
              </p>

              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-extrabold text-slate-900">
                  {teamPrice}
                </span>
                {!isFullAppFree && (
                  <span className="text-xs text-slate-500 font-medium">
                    /user/mo
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mb-6">Custom team contracts</p>

              <div className="border-t border-slate-100 pt-5 space-y-3 mb-8">
                {[
                  "Everything in Pro Analyst",
                  "Up to 10 team seats included",
                  "Custom ATS rubric builder",
                  "Team analytics dashboard",
                  "Custom branding & reports",
                  "Dedicated account manager",
                ].map((feat, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-slate-600">
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Button
                variant="outline"
                className="w-full justify-center text-xs h-10"
                onClick={() => handleOpenCheckout("free")}
              >
                Contact Enterprise
              </Button>
            </div>
          </div>
        </div>

        {/* Security & Payment Gateway info */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">
                Payment Security & Gateway
              </h4>
              <p className="text-slate-500">
                Powered by{" "}
                <strong className="text-slate-700 capitalize">
                  {adminConfig?.activePaymentGateway || "Stripe"}
                </strong>{" "}
                with 256-bit SSL encryption.
              </p>
            </div>
          </div>
          <span className="font-medium text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shrink-0">
            {curr.name} ({curr.code}) Accepted
          </span>
        </div>
      </div>

      {/* Checkout Modal */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedPlanToUpgrade === "pro"
                      ? "Activate Pro Analyst"
                      : "Switch Plan"}
                  </h3>
                </div>
                <button
                  onClick={() => setCheckoutModalOpen(false)}
                  disabled={isUpgrading}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-5 space-y-4">
                <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-blue-900 block">
                      Pro Analyst Plan
                    </span>
                    <span className="text-[11px] text-blue-700">
                      Currency: {curr.name} ({curr.code})
                    </span>
                  </div>
                  <span className="text-xl font-extrabold text-blue-700">
                    {curr.symbol}{isAnnual ? curr.proAnnual * 12 : curr.proMonthly}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Instant unlimited document review quota</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Deep Resume ATS checks with action verbs analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Zero egress fee Cloudflare private storage</span>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1.5 flex items-center justify-between">
                    <span>Active Gateway: <strong className="text-blue-600 uppercase">{adminConfig?.activePaymentGateway || "razorpay"}</strong></span>
                    {adminConfig?.paymentTestMode && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                        Sandbox Mode
                      </span>
                    )}
                  </label>

                  {adminConfig?.activePaymentGateway === "razorpay" && (
                    <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 text-xs space-y-2">
                      <div className="flex items-center justify-between text-blue-900 font-bold">
                        <span>Razorpay Smart Checkout</span>
                        <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded">UPI / Cards</span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Supports Google Pay, PhonePe, Paytm, NetBanking, and all international credit cards in {curr.code}.
                      </p>
                    </div>
                  )}

                  {adminConfig?.activePaymentGateway === "stripe" && (
                    <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      <span>Stripe Checkout •••• 4242 (Instant Approval)</span>
                    </div>
                  )}

                  {adminConfig?.activePaymentGateway === "paypal" && (
                    <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200 text-xs space-y-1">
                      <div className="flex items-center justify-between text-amber-900 font-bold">
                        <span>PayPal Express Checkout</span>
                        <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded font-bold">PayPal</span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Fast and safe global checkout in {curr.code}.
                      </p>
                    </div>
                  )}

                  {adminConfig?.activePaymentGateway === "demo" && (
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
                      1-Click Sandbox upgrade simulation. No external payment charges.
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCheckoutModalOpen(false)}
                  disabled={isUpgrading}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmUpgrade}
                  isLoading={isUpgrading}
                  className="cursor-pointer"
                >
                  {adminConfig?.activePaymentGateway === "razorpay"
                    ? `Pay with Razorpay (${curr.symbol}${isAnnual ? curr.proAnnual * 12 : curr.proMonthly})`
                    : adminConfig?.activePaymentGateway === "stripe"
                    ? `Pay with Stripe (${curr.symbol}${isAnnual ? curr.proAnnual * 12 : curr.proMonthly})`
                    : adminConfig?.activePaymentGateway === "paypal"
                    ? `Pay with PayPal (${curr.symbol}${isAnnual ? curr.proAnnual * 12 : curr.proMonthly})`
                    : "Confirm & Activate"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
