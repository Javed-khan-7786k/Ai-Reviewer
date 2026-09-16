import React from "react";
import Link from "next/link";
import { Sparkles, ShieldCheck, Lock, Trash2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200/80 py-12 text-sm text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-bold text-base text-slate-900">
                AI Reviewer
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Fast, secure, and private document intelligence. Understand document
              quality, detect AI linguistic patterns, and refine writing with confidence.
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-blue-600" /> Private R2 Storage
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Trash2 className="w-3.5 h-3.5 text-slate-500" /> User Deletion
              </span>
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-3 text-xs uppercase tracking-wider">
              Product
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/dashboard" className="hover:text-slate-900 transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-slate-900 transition-colors">
                  Resume Analysis
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-slate-900 transition-colors">
                  AI Likelihood Detection
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-slate-900 transition-colors">
                  Readability Scoring
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-3 text-xs uppercase tracking-wider">
              Architecture
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <span className="text-slate-600">Next.js 14+ App Router</span>
              </li>
              <li>
                <span className="text-slate-600">Prisma ORM & MongoDB</span>
              </li>
              <li>
                <span className="text-slate-600">Inngest Durable Workflows</span>
              </li>
              <li>
                <span className="text-slate-600">Cloudflare R2 Object Storage</span>
              </li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-3 text-xs uppercase tracking-wider">
              Privacy & Trust
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              We never use uploaded documents to train public AI models. Documents are
              stored in private buckets and can be permanently deleted at any time.
            </p>
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/80 w-fit">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Zero-training guarantee</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} AI Reviewer SaaS MVP. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-600">Privacy Policy</span>
            <span className="hover:text-slate-600">Terms of Service</span>
            <span className="hover:text-slate-600">Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
