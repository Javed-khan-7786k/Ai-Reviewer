"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, FileText, Menu, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);

    const checkUser = () => {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem("ai_reviewer_user");
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (
              parsed &&
              parsed.id &&
              parsed.email &&
              !parsed.email.toLowerCase().includes("@aireviewer.local") &&
              parsed.id !== "usr_guest_pending"
            ) {
              setCurrentUser(parsed);
              return;
            }
          } catch {}
        }
        setCurrentUser(null);
      }
    };

    checkUser();
    window.addEventListener("ai-reviewer-user-changed", checkUser);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("ai-reviewer-user-changed", checkUser);
    };
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        isScrolled
          ? "bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs"
          : "bg-white border-b border-slate-100"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs group-hover:bg-blue-700 transition-colors">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-slate-900 tracking-tight leading-none">
              AI Reviewer
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase mt-0.5">
              Document Intelligence
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/#features"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Features
          </Link>
          <Link
            href="/#how-it-works"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            How It Works
          </Link>
          <Link
            href="/subscription"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/#privacy"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Privacy & Trust
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Dashboard
          </Link>
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-3">
          {currentUser ? (
            <Link href="/dashboard">
              <Button size="sm" className="shadow-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="shadow-xs">
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <Link
            href="/#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Features
          </Link>
          <Link
            href="/#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            How It Works
          </Link>
          <Link
            href="/#privacy"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Privacy & Security
          </Link>
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full justify-center">Open Dashboard</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
