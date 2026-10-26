"use client";

import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Activity,
  Play,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Clock,
  Terminal,
  Settings,
  Globe,
  Radio,
  Save,
  Check,
  Copy,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import {
  updateWakeupSchedulerAdminAction,
  testWakeupSchedulerNowAdminAction,
} from "@/actions/admin";
import { WakeupSchedulerConfig, WakeupResult } from "@/lib/wakeup";

interface Props {
  initialConfig: WakeupSchedulerConfig;
}

export function WakeupSchedulerCard({ initialConfig }: Props) {
  const toast = useToast();
  const [config, setConfig] = useState<WakeupSchedulerConfig>(initialConfig);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastResult, setLastResult] = useState<WakeupResult | null>(null);

  // Form states
  const [targetUrl, setTargetUrl] = useState(initialConfig.targetUrl || "https://youtubeautomationbot.onrender.com/");
  const [delaySeconds, setDelaySeconds] = useState(
    Math.round((initialConfig.delayMs || 5000) / 1000)
  );
  const [maxAttempts, setMaxAttempts] = useState(initialConfig.maxAttempts || 24);

  const handleToggleEnabled = async (enabled: boolean) => {
    setIsSaving(true);
    const res = await updateWakeupSchedulerAdminAction({ enabled });
    setIsSaving(false);
    if (res.success) {
      setConfig(res.config);
      toast.success(
        enabled ? "Wakeup Scheduler activated (5:00 AM IST daily)." : "Wakeup Scheduler paused."
      );
    } else {
      toast.error("Failed to update scheduler status.");
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const res = await updateWakeupSchedulerAdminAction({
      targetUrl: targetUrl.trim(),
      delayMs: Math.max(1, delaySeconds) * 1000,
      maxAttempts: Math.max(1, maxAttempts),
    });
    setIsSaving(false);
    if (res.success) {
      setConfig(res.config);
      setShowSettings(false);
      toast.success("Wakeup engine settings saved successfully!");
    } else {
      toast.error(res.error || "Failed to save settings.");
    }
  };

  const handleRunLiveTest = async () => {
    setIsRunningTest(true);
    toast.info("Triggering live wake-up sequence to Render engine...");
    try {
      const res = await testWakeupSchedulerNowAdminAction();
      setLastResult(res.result);
      if (res.success) {
        toast.success(
          `Render responded with HTTP 200 OK! (Took ${(res.result.totalDurationMs / 1000).toFixed(1)}s, ${res.result.attempts} ${res.result.attempts === 1 ? "attempt" : "attempts"})`,
          "Wakeup Confirmed"
        );
        setConfig((prev) => ({
          ...prev,
          lastRunAt: res.result.timestamp,
          lastStatus: res.result.finalStatus,
          lastDurationMs: res.result.totalDurationMs,
          lastAttempts: res.result.attempts,
          lastSuccess: true,
          lastLogs: res.result.logs,
          lastError: null,
        }));
      } else {
        toast.error(
          `Service returned status ${res.result.finalStatus ?? "ERROR"} after ${res.result.attempts} attempts.`,
          "Wakeup Pending"
        );
        setConfig((prev) => ({
          ...prev,
          lastRunAt: res.result.timestamp,
          lastStatus: res.result.finalStatus,
          lastDurationMs: res.result.totalDurationMs,
          lastAttempts: res.result.attempts,
          lastSuccess: false,
          lastLogs: res.result.logs,
          lastError: res.result.error || null,
        }));
      }
    } catch (err: any) {
      toast.error(err?.message || "Test run failed to execute.");
    } finally {
      setIsRunningTest(false);
    }
  };

  const activeLogs = lastResult?.logs || config.lastLogs || [];

  const handleCopyLogs = () => {
    if (activeLogs.length === 0) return;
    navigator.clipboard.writeText(activeLogs.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Execution logs copied to clipboard!");
  };

  return (
    <Card className="border-indigo-200/80 shadow-md bg-linear-to-br from-white via-indigo-50/20 to-slate-50 overflow-hidden">
      <CardHeader className="border-b border-indigo-100/60 bg-linear-to-r from-indigo-50/50 via-white to-transparent pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold border border-indigo-200">
              <Radio className="w-3 h-3 text-indigo-600 animate-pulse" />
              <span>Service Keep-Alive & Wakeup Engine</span>
            </div>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-slate-900 font-extrabold">
              <span>Video Automation Studio Wakeup Scheduler</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 max-w-2xl">
              Continuously hits Render web service every 5 seconds until HTTP 200 OK is received. Scheduled daily at morning 5:00 AM IST.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="text-xs border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 mr-1.5" />
              <span>{showSettings ? "Close Config" : "Configure"}</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleRunLiveTest}
              disabled={isRunningTest}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-sm"
            >
              <Play className={`w-3.5 h-3.5 mr-1.5 ${isRunningTest ? "animate-spin" : ""}`} />
              <span>{isRunningTest ? "Pinging Render Engine..." : "Test Wakeup Now"}</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 space-y-6">
        {/* Settings Form Drawer */}
        {showSettings && (
          <form
            onSubmit={handleSaveSettings}
            className="p-4 sm:p-5 bg-white rounded-xl border border-indigo-200 shadow-xs space-y-4 transition-all"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-indigo-600" />
                <span>Wakeup Engine Target Parameters</span>
              </span>
              <span className="text-[11px] text-slate-500">Configured in MongoDB Atlas</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Service Endpoint URL
                </label>
                <div className="relative">
                  <Globe className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="url"
                    required
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    placeholder="https://youtubeautomationbot.onrender.com/"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Retry Interval (Seconds)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={delaySeconds}
                  onChange={(e) => setDelaySeconds(parseInt(e.target.value) || 5)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Max Attempts Threshold
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(parseInt(e.target.value) || 24)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2 flex items-end justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  isLoading={isSaving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs cursor-pointer font-semibold"
                >
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  <span>Save Wakeup Settings</span>
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* 3 Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Target Endpoint */}
          <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-600" />
                <span>Target Service</span>
              </span>
              <a
                href={config.targetUrl || "https://youtubeautomationbot.onrender.com/"}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-[11px] font-semibold"
              >
                <span>Visit</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900 block truncate" title={config.targetName}>
                Video Automation Studio
              </span>
              <span className="text-[11px] font-mono text-slate-500 block truncate" title={config.targetUrl}>
                {config.targetUrl || "https://youtubeautomationbot.onrender.com/"}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Platform</span>
              <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">Render.com</span>
            </div>
          </div>

          {/* Card 2: Schedule & Loop Rule */}
          <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Schedule & Rule</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Daily Active
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900 block">
                Morning 5:00 AM IST
              </span>
              <span className="text-[11px] text-slate-500 block">
                (23:30 UTC / Every 24 hours)
              </span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Condition</span>
              <span className="font-semibold text-slate-800">5s interval &rarr; until 200 OK</span>
            </div>
          </div>

          {/* Card 3: Last Ping State */}
          <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-600" />
                <span>Last Execution</span>
              </span>
              {config.lastStatus === 200 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>200 OK</span>
                </span>
              ) : config.lastStatus ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  <span>Status {config.lastStatus}</span>
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 font-medium">Ready for Ping</span>
              )}
            </div>

            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900 block">
                {config.lastRunAt
                  ? new Date(config.lastRunAt).toLocaleDateString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    }) + " IST"
                  : "Never triggered yet"}
              </span>
              <span className="text-[11px] text-slate-500 block">
                {config.lastDurationMs
                  ? `Completed in ${(config.lastDurationMs / 1000).toFixed(1)}s (${config.lastAttempts || 1} attempt${(config.lastAttempts || 1) > 1 ? "s" : ""})`
                  : "Waiting for scheduled trigger or test"}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Auto-Wakeup Switch</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-700">
                  {config.enabled ? "Active" : "Paused"}
                </span>
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => handleToggleEnabled(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Terminal Execution Log Console */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 text-slate-200 shadow-inner overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-bold">Wakeup Ping Execution Console & Diagnostic Logs</span>
              {isRunningTest && (
                <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 animate-pulse font-mono">
                  <RotateCw className="w-3 h-3 animate-spin" />
                  <span>Executing ping loop...</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLogs}
                disabled={activeLogs.length === 0}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied" : "Copy Logs"}</span>
              </button>
            </div>
          </div>

          <div className="p-4 font-mono text-[11px] leading-relaxed max-h-56 overflow-y-auto space-y-1 text-slate-300 selection:bg-indigo-500 selection:text-white">
            {activeLogs.length === 0 ? (
              <div className="text-slate-500 italic py-2">
                No logs recorded yet. Click &quot;Test Wakeup Now&quot; above to trigger a live ping sequence or wait for the 5:00 AM IST scheduled run.
              </div>
            ) : (
              activeLogs.map((log, index) => {
                const isSuccess = log.includes("SUCCESS") || log.includes("200 OK");
                const isError = log.includes("Notice:") || log.includes("Status 5") || log.includes("Status 4");
                const isAttempt = log.includes("Sending GET request");
                const isWait = log.includes("Waiting");

                return (
                  <div
                    key={index}
                    className={`flex items-start gap-2 ${
                      isSuccess
                        ? "text-emerald-400 font-semibold"
                        : isError
                        ? "text-amber-400"
                        : isAttempt
                        ? "text-blue-300"
                        : isWait
                        ? "text-slate-400"
                        : "text-slate-300"
                    }`}
                  >
                    <span className="text-slate-600 select-none">&gt;</span>
                    <span>{log}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Integration details footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-slate-500 pt-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Cron Endpoints:</span>
            <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
              /api/cron/wakeup
            </code>
            <span>(Vercel Cron: 30 23 * * *)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Inngest Job: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">daily-service-wakeup</code></span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
