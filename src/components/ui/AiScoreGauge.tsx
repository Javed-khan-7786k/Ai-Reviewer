"use client";

import React from "react";
import { getAiScoreTier } from "@/lib/utils";
import { Info } from "lucide-react";

interface AiScoreGaugeProps {
  score: number | null | undefined;
  size?: number;
  strokeWidth?: number;
  showDisclaimer?: boolean;
}

export function AiScoreGauge({
  score,
  size = 200,
  strokeWidth = 14,
  showDisclaimer = true,
}: AiScoreGaugeProps) {
  const safeScore = score !== null && score !== undefined ? Math.round(score) : null;
  const tier = getAiScoreTier(safeScore);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    safeScore !== null
      ? circumference - (safeScore / 100) * circumference
      : circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative inline-flex items-center justify-center">
        <svg
          width={size}
          height={size}
          className="transform -rotate-90 transition-all duration-700 ease-out"
        >
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle stroke */}
          {safeScore !== null && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={tier.color}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              style={{
                transition: "stroke-dashoffset 1s ease-in-out, stroke 0.5s ease",
              }}
            />
          )}
        </svg>

        {/* Center score details */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          {safeScore !== null ? (
            <>
              <span className="text-4xl font-bold tracking-tight text-slate-900">
                {safeScore}%
              </span>
              <span
                className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 mt-1 rounded-full"
                style={{
                  backgroundColor: `${tier.color}15`,
                  color: tier.color,
                }}
              >
                {tier.label}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5">
                AI Likelihood
              </span>
            </>
          ) : (
            <>
              <span className="text-2xl font-bold text-slate-400">--%</span>
              <span className="text-xs text-slate-400 mt-1">Analyzing...</span>
            </>
          )}
        </div>
      </div>

      {showDisclaimer && (
        <div className="mt-4 max-w-sm rounded-lg border border-slate-200/80 bg-slate-50/80 p-3 text-xs text-slate-500 leading-relaxed flex items-start gap-2">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p>
            <strong className="text-slate-700 font-medium">Disclaimer:</strong>{" "}
            This score is an estimate based on syntactic burstiness and linguistic
            patterns. It is not definitive proof of authorship.
          </p>
        </div>
      )}
    </div>
  );
}
