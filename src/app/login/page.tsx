"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Lock, Mail, AlertCircle, CheckCircle2, UserCheck, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { loginUserAction, demoLoginAction, googleLoginAction } from "@/actions/auth";
import { useToast } from "@/components/ui/Toast";

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storedGuestUser, setStoredGuestUser] = useState<any>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("ai_reviewer_user");
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.name) {
            setStoredGuestUser(parsed);
          }
        } catch {}
      }
    }
  }, []);

  const saveSessionToStorage = (token?: string, user?: any) => {
    if (typeof window !== "undefined") {
      if (token) localStorage.setItem("ai_reviewer_jwt", token);
      if (user) localStorage.setItem("ai_reviewer_user", JSON.stringify(user));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    const res = await loginUserAction(formData);
    setIsLoading(false);

    if (res.success) {
      saveSessionToStorage(res.token, res.user);
      toast.success(`Welcome back, ${res.user?.name || "User"}!`, "Authentication Successful");
      router.push("/dashboard");
    } else {
      setError(res.error || "Invalid email or password.");
      toast.error(res.error || "Sign in failed.");
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError(null);

    const googleEmail =
      email.trim() && email.includes("@")
        ? email.trim().toLowerCase()
        : storedGuestUser?.email?.includes("@")
        ? storedGuestUser.email
        : "guest.google@example.com";

    const derivedName = googleEmail.split("@")[0].replace(/[._]/g, " ");
    const googleName =
      storedGuestUser?.name ||
      (derivedName.charAt(0).toUpperCase() + derivedName.slice(1));

    const googleUser = {
      email: googleEmail,
      name: googleName,
    };

    const res = await googleLoginAction(googleUser);
    setIsGoogleLoading(false);

    if (res.success) {
      saveSessionToStorage(res.token, res.user);
      toast.success(`Signed in with Google as ${res.user?.name}!`, "Google Authentication");
      router.push("/dashboard");
    } else {
      setError(res.error || "Google authentication failed.");
      toast.error(res.error || "Google sign in error.");
    }
  };

  const handleDemoLogin = async () => {
    setIsDemoLoading(true);
    setError(null);

    const res = await demoLoginAction(
      storedGuestUser
        ? {
            id: storedGuestUser.id,
            name: storedGuestUser.name,
            email: storedGuestUser.email,
          }
        : undefined
    );
    setIsDemoLoading(false);

    if (res.success) {
      saveSessionToStorage(res.token, res.user);
      toast.success(`Signed in as ${res.user?.name || "Demo User"}!`, "Access Active");
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs group-hover:bg-blue-700 transition-colors">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl text-slate-900 tracking-tight">
            AI Reviewer
          </span>
        </Link>
        <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
          Sign in to your account
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Access your documents, AI analysis reports, and rewrite studio
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200/80 sm:px-10">
          {/* 1. Google One-Click Login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading || isLoading || isDemoLoading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-2xs cursor-pointer mb-3"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>
              {isGoogleLoading ? "Connecting with Google..." : "Continue with Google (Demo)"}
            </span>
          </button>

          {/* 2. Demo 1-Click Login Button */}
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={isDemoLoading || isLoading || isGoogleLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-blue-700 text-xs font-semibold transition-all shadow-2xs cursor-pointer mb-6"
          >
            <UserCheck className="w-4 h-4" />
            <span>
              {isDemoLoading
                ? "Signing in..."
                : storedGuestUser?.name
                ? `1-Click Continue as ${storedGuestUser.name}`
                : "Instant 1-Click Demo Sign In"}
            </span>
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-slate-400 font-medium">
                Or sign in with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <span className="text-[11px] text-blue-600 hover:underline cursor-pointer">
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 font-medium"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full justify-center text-xs h-10 mt-2 shadow-xs cursor-pointer"
            >
              {isLoading ? "Signing in..." : "Sign in with Email"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-semibold text-blue-600 hover:underline"
              >
                Sign up free
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-slate-400" />
          <span>Protected with 256-bit JWT encryption and local session state.</span>
        </div>
      </div>
    </div>
  );
}
