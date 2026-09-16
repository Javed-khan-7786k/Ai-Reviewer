"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  FileText,
  CheckCircle2,
  Tag,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { AiScoreGauge } from "@/components/ui/AiScoreGauge";

export function InteractiveProductPreview() {
  const [selectedParagraph, setSelectedParagraph] = useState(1);
  const [animatedScore, setAnimatedScore] = useState(18);

  const sampleParagraphs = [
    {
      id: 0,
      score: 12,
      tier: "Human",
      color: "#10b981",
      bgClass: "bg-emerald-50/70 border-emerald-500",
      text: "Led architectural migration of microservices from on-premise infrastructure to Cloudflare and AWS, reducing latency by 42% across 1.2M monthly active users.",
      explanation:
        "High sentence burstiness with specific quantifiable operational metrics. Indicative of genuine authentic human experience.",
    },
    {
      id: 1,
      score: 74,
      tier: "High AI",
      color: "#f97316",
      bgClass: "bg-orange-50/70 border-orange-500",
      text: "Furthermore, it is crucial to recognize that leveraging advanced digital transformation strategies fosters an indispensable environment of holistic operational excellence across cross-functional verticals.",
      explanation:
        "Uniform sentence cadence with formulaic connective adverbs ('Furthermore', 'crucial to recognize') and low lexical burstiness.",
    },
    {
      id: 2,
      score: 38,
      tier: "Mixed",
      color: "#f59e0b",
      bgClass: "bg-amber-50/70 border-amber-500",
      text: "Collaborated closely with design and QA teams to deploy bi-weekly sprint releases, conducting code reviews and standardizing TypeScript linting configurations.",
      explanation:
        "Balanced sentence length with common software engineering phrasing. Mixed stylistic markers.",
    },
  ];

  const current = sampleParagraphs[selectedParagraph];

  return (
    <div className="w-full max-w-xl mx-auto lg:max-w-none bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden">
      {/* Window Mock Titlebar */}
      <div className="bg-slate-100/80 border-b border-slate-200/80 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-rose-400" />
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <div className="w-3 h-3 rounded-full bg-emerald-400" />
          <span className="text-[11px] font-medium text-slate-500 ml-2">
            Senior_Software_Engineer_Resume.pdf
          </span>
        </div>
        <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
          Live Analysis Demo
        </span>
      </div>

      <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-12 gap-5">
        {/* Document view snippet (7 cols) */}
        <div className="sm:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-medium">
            <span>Extracted Paragraphs</span>
            <span>Click to inspect</span>
          </div>

          {sampleParagraphs.map((p, idx) => (
            <div
              key={p.id}
              onClick={() => {
                setSelectedParagraph(idx);
                setAnimatedScore(p.score);
              }}
              className={`p-3 rounded-xl border-l-4 text-xs transition-all cursor-pointer leading-relaxed ${
                p.bgClass
              } ${
                selectedParagraph === idx
                  ? "ring-2 ring-blue-600 ring-offset-1 shadow-xs scale-[1.01]"
                  : "opacity-85 hover:opacity-100"
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  Paragraph #{idx + 1}
                </span>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.2 rounded"
                  style={{
                    backgroundColor: `${p.color}20`,
                    color: p.color,
                  }}
                >
                  {p.score}% {p.tier}
                </span>
              </div>
              <p className="text-slate-800">{p.text}</p>
            </div>
          ))}

          {/* Keywords tags preview */}
          <div className="pt-2">
            <span className="text-[11px] font-medium text-slate-400 block mb-1.5">
              Extracted Keywords
            </span>
            <div className="flex flex-wrap gap-1.5">
              {["TypeScript", "AWS", "Microservices", "Latency -42%"].map(
                (kw) => (
                  <span
                    key={kw}
                    className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-medium rounded-md border border-slate-200"
                  >
                    {kw}
                  </span>
                )
              )}
            </div>
          </div>
        </div>

        {/* Live Inspector Preview (5 cols) */}
        <div className="sm:col-span-5 flex flex-col justify-between bg-slate-50/70 p-4 rounded-xl border border-slate-100">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2 text-center">
              Paragraph Likelihood
            </span>
            <div className="flex justify-center scale-90 -my-3">
              <AiScoreGauge
                score={current.score}
                size={140}
                strokeWidth={10}
                showDisclaimer={false}
              />
            </div>

            <div className="mt-4 bg-white p-3 rounded-lg border border-slate-200/80 text-[11px] text-slate-600 leading-relaxed shadow-2xs">
              <p className="font-semibold text-slate-800 mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-600" />
                Linguistic Assessment
              </p>
              <p className="text-[11px] text-slate-600">{current.explanation}</p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/70">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Readability</span>
              <span className="font-bold text-slate-800">76/100 (Standard)</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1.5">
              <span className="text-slate-500 font-medium">Resume Verbs</span>
              <span className="font-bold text-emerald-600">8 Identified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
