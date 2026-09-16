import React from "react";
import Link from "next/link";
import {
  FileText,
  Sparkles,
  ShieldCheck,
  Zap,
  BarChart3,
  CheckCircle2,
  Lock,
  Trash2,
  ArrowRight,
  UploadCloud,
  FileCheck2,
  RefreshCw,
  Search,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { InteractiveProductPreview } from "@/components/landing/InteractiveProductPreview";
import { UploadDropzone } from "@/components/upload/UploadDropzone";

export default function LandingPage() {
  const features = [
    {
      icon: FileCheck2,
      title: "Structured Resume Feedback",
      description:
        "Extract key sections, verify action verb density, detect quantifiable metrics, and spot missing elements before recruiters review your CV.",
    },
    {
      icon: Sparkles,
      title: "AI Likelihood Estimation",
      description:
        "Transparent probability estimates based on linguistic burstiness, sentence uniformity, and lexical diversity. Grounded in research—not guesswork.",
    },
    {
      icon: BarChart3,
      title: "Readability & Cadence",
      description:
        "Instant Flesch Reading Ease calculations and sentence-length analysis to ensure your prose is clear, impactful, and accessible.",
    },
    {
      icon: Search,
      title: "Keyword & Skill Extraction",
      description:
        "Automatically identifies high-frequency professional keywords and industry competencies to enhance ATS discovery and relevance.",
    },
    {
      icon: RefreshCw,
      title: "Contextual AI Rewriting",
      description:
        "Select any paragraph to generate on-demand suggestions with 5 targeted tones: Professional, Concise, Clearer, Natural, and Grammar Fix.",
    },
    {
      icon: Lock,
      title: "Zero-Training Privacy",
      description:
        "Files are kept in private Cloudflare R2 object storage, never used for training models, and fully deletable with one click.",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Upload Your Document",
      description:
        "Drag and drop any PDF or DOCX file up to 10MB. Files are securely validated and processed privately.",
    },
    {
      number: "02",
      title: "Automated Deep Analysis",
      description:
        "Our pipeline parses structured paragraphs, checks syntactic variance, measures readability, and evaluates resume sections.",
    },
    {
      number: "03",
      title: "Explore Interactive Insights",
      description:
        "Review your document in our reader with color-coded paragraph markers, circular probability gauges, and keyword breakdowns.",
    },
    {
      number: "04",
      title: "Refine & Polish",
      description:
        "Click on any paragraph with high uniformity to explore humanizing rewrites and actionable improvements.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-50/70 via-indigo-50/30 to-transparent pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Hero Copy (7 cols) */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen Document Intelligence</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
                Understand Your Documents.{" "}
                <span className="text-blue-600 block sm:inline">
                  Improve Your Writing.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Upload resumes, short documents, or essays to receive structured
                feedback, readability insights, keyword analysis, and estimated
                AI-writing likelihood.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <Link href="/dashboard">
                  <Button size="lg" className="w-full sm:w-auto shadow-md">
                    <span>Upload a Document</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
                <Link href="#how-it-works">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Explore How It Works
                  </Button>
                </Link>
              </div>

              {/* Guarantees */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Free 5 docs/day
                </span>
                <span className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-blue-600" /> Private cloud storage
                </span>
                <span className="flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4 text-slate-400" /> User deletion rights
                </span>
              </div>
            </div>

            {/* Hero Interactive Product Preview Widget (5-6 cols) */}
            <div className="lg:col-span-6">
              <InteractiveProductPreview />
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Quick Dropzone on Landing Page */}
      <section className="py-12 bg-white border-y border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Try It Immediately
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Upload a resume or document to start your live analysis right now.
            </p>
          </div>
          <UploadDropzone />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-2">
              Comprehensive Review Suite
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Everything Needed to Perfect Your Content
            </h3>
            <p className="text-sm text-slate-600 mt-3">
              Purpose-built tools for job seekers, recruiters, students, and
              content creators seeking objective writing clarity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-slate-200/90 p-7 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all group"
                >
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mb-2">
                    {f.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {f.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Timeline */}
      <section id="how-it-works" className="py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-2">
              Workflow
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              From Raw File to Actionable Polish
            </h3>
            <p className="text-sm text-slate-600 mt-3">
              A durable background processing pipeline that never times out.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {steps.map((s, idx) => (
              <div key={idx} className="relative flex flex-col items-start">
                <span className="text-3xl font-extrabold text-blue-100 font-mono mb-2">
                  {s.number}
                </span>
                <h4 className="text-sm font-bold text-slate-900 mb-2">
                  {s.title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy and Trust Section */}
      <section id="privacy" className="py-20 md:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl overflow-hidden relative">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-blue-400 text-xs font-semibold mb-6 border border-slate-700">
                <ShieldCheck className="w-4 h-4" />
                <span>Security & Data Sovereignty</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
                Your Documents Remain Strictly Yours
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-8">
                We believe in genuine transparency. We do not use deceptive trust badges
                or unverified 99.9% claims. Here is what we actually do:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs text-slate-300">
                <div className="flex items-start gap-3">
                  <Lock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-medium">Private Object Storage</strong>
                    Original files are stored privately in Cloudflare R2 with access tokens.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Trash2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-medium">User-Controlled Deletion</strong>
                    Deleting a document removes both storage objects and analysis data immediately.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-medium">Zero-Training Guarantee</strong>
                    Documents are not shared with public datasets or used to train third-party LLMs.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-medium">Probabilistic Estimates</strong>
                    AI likelihood is clearly labeled as an estimate based on linguistic variance.
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800 flex items-center gap-4">
                <Link href="/dashboard">
                  <Button className="bg-blue-600 hover:bg-blue-500 text-white border-none shadow-sm">
                    Enter Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
