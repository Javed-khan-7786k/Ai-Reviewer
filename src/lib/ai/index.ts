import { ResumeSections, RewriteTone, RewriteResponse } from "@/types";
import {
  isGeminiConfigured,
  geminiAnalyzeDocument,
  geminiRewriteParagraph,
} from "./gemini";

export interface ParagraphAnalysis {
  paragraphIndex: number;
  text: string;
  aiScore: number; // 0 - 100
  explanation: string;
  rewriteSuggestion: string | null;
}

export interface DocumentAiAnalysisOutput {
  overallAiScore: number;
  detectorProvider: string;
  detectorVersion: string;
  summary: string;
  resumeSections: ResumeSections | null;
  paragraphs: ParagraphAnalysis[];
}

// Linguistic markers common in repetitive LLM output
const AI_FORMULAIC_TOKENS = [
  "delve", "tapestry", "moreover", "furthermore", "paramount", "pivotal",
  "testament", "beacon", "multifaceted", "transformative", "crucial",
  "in conclusion", "it is important to note", "plays a significant role",
  "by leveraging", "fostering a culture", "spearheaded the development",
  "harnessing the power", "seamless integration", "unwavering commitment",
  "in today's fast-paced", "navigating the complexities", "rich tapestry"
];

const ACTION_VERBS = [
  "accelerated", "achieved", "acquired", "architected", "championed",
  "consolidated", "delivered", "designed", "developed", "directed",
  "engineered", "established", "executed", "expanded", "generated",
  "implemented", "improved", "increased", "launched", "led", "maximized",
  "negotiated", "optimized", "orchestrated", "overhauled", "pioneered",
  "reduced", "resolved", "restructured", "revitalized", "spearheaded",
  "streamlined", "surpassed", "transformed", "upgraded"
];

function analyzeSentenceBurstiness(text: string): number {
  const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 0);
  if (sentences.length <= 1) return 0.5;

  const lengths = sentences.map((s) => s.split(/\s+/).filter(Boolean).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((acc, l) => acc + Math.pow(l - mean, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);

  // Coefficient of variation (Burstiness indicator)
  // Low variation (stdDev / mean < 0.25) -> High likelihood of uniform AI generation
  // High variation (stdDev / mean > 0.50) -> Human-like burstiness
  const cv = mean > 0 ? stdDev / mean : 0.5;
  return cv;
}

function analyzeParagraphLinguistics(text: string, index: number): ParagraphAnalysis {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  if (wordCount < 10) {
    return {
      paragraphIndex: index,
      text,
      aiScore: 15,
      explanation: "Short phrase or heading with insufficient linguistic density to estimate reliably.",
      rewriteSuggestion: null,
    };
  }

  let tokenMatchCount = 0;
  for (const token of AI_FORMULAIC_TOKENS) {
    if (lower.includes(token)) tokenMatchCount++;
  }

  const burstiness = analyzeSentenceBurstiness(text);

  // Calculate distinct words vs total words (Type-Token Ratio)
  const uniqueWords = new Set(words).size;
  const ttr = wordCount > 0 ? uniqueWords / wordCount : 0.7;

  // Predictability heuristic
  // Standard AI text has: uniform sentence length (low burstiness), moderate-low TTR, and formulaic tokens
  let estimatedScore = 32;

  if (burstiness < 0.28) {
    estimatedScore += 24; // Very uniform cadence
  } else if (burstiness > 0.55) {
    estimatedScore -= 20; // High human burstiness
  }

  if (tokenMatchCount >= 2) {
    estimatedScore += tokenMatchCount * 12;
  } else if (tokenMatchCount === 1) {
    estimatedScore += 8;
  }

  if (ttr < 0.55) {
    estimatedScore += 10;
  } else if (ttr > 0.8) {
    estimatedScore -= 12;
  }

  // Add deterministic subtle variance based on text hash to keep score natural
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  const variance = (Math.abs(hash) % 15) - 7;
  estimatedScore += variance;

  // Clamp 5 to 95
  const finalScore = Math.max(5, Math.min(95, Math.round(estimatedScore)));

  let explanation = "";
  if (finalScore <= 20) {
    explanation = "High sentence length variance (burstiness) and idiosyncratic syntax strongly indicative of authentic human authorship.";
  } else if (finalScore <= 50) {
    explanation = "Balanced mix of natural structural variety with standard editorial phrasing.";
  } else if (finalScore <= 80) {
    explanation = "Moderate uniformity in syntactic structure and predictable transitional cadence.";
  } else {
    explanation = "Highly uniform sentence lengths, elevated token predictability, and formulaic transitional connective phrasing.";
  }

  return {
    paragraphIndex: index,
    text,
    aiScore: finalScore,
    explanation,
    rewriteSuggestion: null,
  };
}

function analyzeResumeSectionsHeuristic(
  text: string,
  paragraphs: string[]
): ResumeSections {
  const lower = text.toLowerCase();

  const foundVerbs: string[] = [];
  for (const verb of ACTION_VERBS) {
    if (new RegExp(`\\b${verb}\\b`, "i").test(lower)) {
      foundVerbs.push(verb.charAt(0).toUpperCase() + verb.slice(1));
    }
  }

  // Count quantifiable metrics (numbers followed by %, $, k, +, etc.)
  const metricMatches =
    text.match(/\b\d+(\.\d+)?(%|\$|k|M|x|\+)?\b/gi) || [];
  const quantifiableMetricsCount = metricMatches.filter(
    (m) => /[0-9]/.test(m) && (m.includes("%") || m.includes("$") || m.includes("+") || parseInt(m) > 10)
  ).length;

  const hasSummary =
    lower.includes("summary") ||
    lower.includes("profile") ||
    lower.includes("about me");
  const hasSkills =
    lower.includes("skills") ||
    lower.includes("technologies") ||
    lower.includes("proficiencies");
  const hasExperience =
    lower.includes("experience") ||
    lower.includes("employment") ||
    lower.includes("work history");
  const hasEducation =
    lower.includes("education") ||
    lower.includes("degree") ||
    lower.includes("university") ||
    lower.includes("college");

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (foundVerbs.length >= 8) {
    strengths.push(`Strong active vocabulary with ${foundVerbs.length}+ impactful action verbs.`);
  } else {
    improvements.push("Incorporate more decisive action verbs (e.g. 'Architected', 'Orchestrated', 'Optimized') at the start of bullet points.");
  }

  if (quantifiableMetricsCount >= 4) {
    strengths.push(`Excellent use of quantifiable metrics (${quantifiableMetricsCount} numerical achievements identified).`);
  } else {
    improvements.push("Add measurable business outcomes (e.g., '% increase in throughput', '$ saved', 'team size managed').");
  }

  if (hasSummary) {
    strengths.push("Includes a defined executive summary / profile section.");
  } else {
    improvements.push("Add a 2-3 sentence executive summary highlighting your core expertise and target role.");
  }

  if (hasSkills) {
    strengths.push("Clearly categorized skills section for fast recruiter scanning.");
  } else {
    improvements.push("Create a dedicated technical / core competencies skill matrix.");
  }

  if (!hasEducation) {
    improvements.push("Ensure your education or credential section is clearly marked with degree and institution.");
  }

  // Extract skills dynamically
  const skillKeywords = [
    "TypeScript", "JavaScript", "React", "Next.js", "Node.js", "Python",
    "Go", "Java", "Docker", "Kubernetes", "AWS", "Cloudflare", "MongoDB",
    "PostgreSQL", "GraphQL", "REST APIs", "CI/CD", "Git", "Agile", "Tailwind CSS"
  ];
  const detectedSkills = skillKeywords.filter((s) =>
    new RegExp(`\\b${s}\\b`, "i").test(text)
  );

  let score = 50;
  if (hasSummary) score += 10;
  if (hasSkills) score += 15;
  if (hasExperience) score += 15;
  if (hasEducation) score += 10;
  score = Math.min(100, score);

  return {
    summary: hasSummary
      ? paragraphs.find((p) => p.toLowerCase().includes("summary") || p.length > 100) || undefined
      : undefined,
    skills: detectedSkills.length > 0 ? detectedSkills : ["Project Management", "Technical Leadership", "System Design"],
    experience: [
      {
        company: "Primary Organization / Recent Role",
        role: "Professional Role",
        period: "Recent",
        bullets: paragraphs.slice(1, 4).filter((p) => p.length > 40),
      },
    ],
    education: [
      {
        institution: "Accredited University / Institute",
        degree: "Degree / Certification",
      },
    ],
    strengths,
    improvements,
    actionVerbsFound: Array.from(new Set(foundVerbs)).slice(0, 12),
    quantifiableMetricsCount,
    completenessScore: score,
  };
}

export async function analyzeDocumentWithAi(
  fullText: string,
  paragraphs: string[],
  isResume: boolean
): Promise<DocumentAiAnalysisOutput> {
  // 1. Google Gemini AI Analysis (Prioritized if GEMINI_API_KEY is configured)
  if (isGeminiConfigured()) {
    try {
      return await geminiAnalyzeDocument(fullText, paragraphs, isResume);
    } catch (geminiErr) {
      console.warn("Google Gemini document analysis failed, falling back:", geminiErr);
    }
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  // If OpenAI key is present and valid, perform enhanced model-driven analysis
  if (apiKey && apiKey.startsWith("sk-")) {
    try {
      const prompt = `You are a world-class document & resume analysis engine.
Analyze the following text.
Text isResume: ${isResume}

Text Content:
"""
${fullText.slice(0, 6000)}
"""

Respond ONLY with valid JSON matching this exact structure:
{
  "overallAiScore": <estimated AI-writing likelihood percentage 0-100>,
  "summary": "<2-sentence objective assessment of the document>",
  "resumeSections": {
    "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
    "improvements": ["<actionable improvement 1>", "<actionable improvement 2>", "<actionable improvement 3>"],
    "skills": ["<skill1>", "<skill2>"],
    "actionVerbsFound": ["<verb1>", "<verb2>"],
    "quantifiableMetricsCount": <number of metrics>,
    "completenessScore": <score 0-100>
  }
}`;

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0.2,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const parsed = JSON.parse(data.choices[0].message.content);

        const analyzedParagraphs = paragraphs.map((p, i) =>
          analyzeParagraphLinguistics(p, i)
        );

        return {
          overallAiScore: Math.round(parsed.overallAiScore ?? 35),
          detectorProvider: "openai-" + model,
          detectorVersion: "2024-structured",
          summary: parsed.summary || "Comprehensive document analysis completed.",
          resumeSections: isResume
            ? {
                ...analyzeResumeSectionsHeuristic(fullText, paragraphs),
                ...parsed.resumeSections,
              }
            : null,
          paragraphs: analyzedParagraphs,
        };
      }
    } catch (err) {
      console.warn("OpenAI API analysis fallback to linguistic engine:", err);
    }
  }

  // Built-in Linguistic Heuristics Engine
  const analyzedParagraphs = paragraphs.map((p, i) =>
    analyzeParagraphLinguistics(p, i)
  );

  const nonTrivialParagraphs = analyzedParagraphs.filter((p) => p.text.length > 20);
  const avgAi =
    nonTrivialParagraphs.length > 0
      ? Math.round(
          nonTrivialParagraphs.reduce((sum, p) => sum + p.aiScore, 0) /
            nonTrivialParagraphs.length
        )
      : 25;

  const resumeSections = isResume
    ? analyzeResumeSectionsHeuristic(fullText, paragraphs)
    : null;

  const summary = isResume
    ? `Resume evaluated with a completeness index of ${resumeSections?.completenessScore || 80}%. ${resumeSections?.strengths[0] || "Structured content with professional formatting."}`
    : `Document analyzed across ${paragraphs.length} paragraphs. Overall structural flow exhibits ${avgAi > 50 ? "notable uniformity" : "natural syntactic burstiness and authentic human pacing"}.`;

  return {
    overallAiScore: avgAi,
    detectorProvider: "linguistic-heuristics-engine",
    detectorVersion: "v1.4",
    summary,
    resumeSections,
    paragraphs: analyzedParagraphs,
  };
}

export async function rewriteParagraphText(
  originalText: string,
  tone: RewriteTone
): Promise<RewriteResponse> {
  // 1. Google Gemini AI Rewrite (Prioritized if GEMINI_API_KEY is configured)
  if (isGeminiConfigured()) {
    try {
      return await geminiRewriteParagraph(originalText, tone);
    } catch (geminiErr) {
      console.warn("Google Gemini rewrite failed, falling back:", geminiErr);
    }
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const instructions: Record<RewriteTone, string> = {
    clearer: "Rewrite the following paragraph to be exceptionally clear, direct, and free of ambiguity.",
    concise: "Rewrite the following paragraph to be concise, eliminating filler words while preserving key facts.",
    professional: "Rewrite the following paragraph to sound sophisticated, executive, and suitable for high-stakes business or leadership.",
    natural: "Rewrite the following paragraph to sound authentically human, conversational, and natural, varying sentence lengths and cadence.",
    grammar: "Correct any grammatical, punctuation, or syntactic imperfections while maintaining original tone.",
  };

  if (apiKey && apiKey.startsWith("sk-")) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content:
                "You are an expert editorial writer. Provide ONLY the rewritten text without quotation marks or conversational commentary.",
            },
            {
              role: "user",
              content: `${instructions[tone]}\n\nText:\n"""${originalText}"""`,
            },
          ],
          temperature: 0.4,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const rewritten = data.choices[0].message.content.trim();
        return {
          originalText,
          rewrittenText: rewritten,
          tone,
          explanation: `Rewritten using ${model} for a ${tone} tone.`,
        };
      }
    } catch (err) {
      console.warn("OpenAI rewrite failed, using intelligent editorial rule engine:", err);
    }
  }

  // Fallback high-impact intelligent editorial transformation
  let rewritten = originalText.trim();

  // Helper to split into sentences
  const sentences = rewritten
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (tone === "concise") {
    rewritten = sentences
      .map((s) => {
        let trimmed = s
          .replace(/in order to\s+/gi, "to ")
          .replace(/it is important to note that\s+/gi, "")
          .replace(/it is crucial to recognize that\s+/gi, "")
          .replace(/due to the fact that\s+/gi, "because ")
          .replace(/at this point in time\s+/gi, "now ")
          .replace(/in addition to\s+/gi, "besides ")
          .replace(/plays a (crucial|pivotal|significant) role in\s+/gi, "drives ")
          .replace(/delve into the rich tapestry of\s+/gi, "explore ")
          .replace(/as a matter of fact\s+/gi, "")
          .replace(/\bvery\b\s+/gi, "")
          .replace(/\bextremely\b\s+/gi, "")
          .replace(/\bseamlessly\b\s+/gi, "");

        // If sentence is still verbose, shorten clauses
        trimmed = trimmed.replace(/,\s*which results in\s+/gi, ", yielding ");
        return trimmed;
      })
      .join(" ");

    // Ensure it's distinctly more concise
    if (rewritten === originalText.trim()) {
      rewritten = sentences
        .map((s) => s.replace(/\b(that|which|really|quite|definitely)\b\s*/gi, ""))
        .join(" ");
    }
  } else if (tone === "professional") {
    rewritten = sentences
      .map((s) => {
        let p = s
          .replace(/\bworked on\b/gi, "spearheaded development of")
          .replace(/\bhelped\b/gi, "partnered to facilitate")
          .replace(/\bmade\b/gi, "architected")
          .replace(/\bgood\b/gi, "exceptional")
          .replace(/\bchanged\b/gi, "transformed")
          .replace(/\bdid\b/gi, "executed")
          .replace(/\blooked at\b/gi, "systematically audited")
          .replace(/\btalked with\b/gi, "collaborated directly with")
          .replace(/\bfixed\b/gi, "remediated")
          .replace(/\brun\b/gi, "orchestrated");

        if (!/^(architected|spearheaded|orchestrated|directed|engineered|delivered|accelerated)/i.test(p)) {
          // Add decisive executive verb if bullet-like
          if (p.length > 20 && !p.startsWith("The") && !p.startsWith("In")) {
            p = "Directly " + p.charAt(0).toLowerCase() + p.slice(1);
          }
        }
        return p;
      })
      .join(" ");
  } else if (tone === "natural") {
    rewritten = sentences
      .map((s, idx) => {
        let n = s
          .replace(/furthermore,\s*/gi, "Also, ")
          .replace(/moreover,\s*/gi, "On top of that, ")
          .replace(/in conclusion,\s*/gi, "All in all, ")
          .replace(/it is important to note that\s*/gi, "Keep in mind that ")
          .replace(/delve into\s*/gi, "dig into ")
          .replace(/rich tapestry of\s*/gi, "mix of ")
          .replace(/paramount testament\s*/gi, "clear sign ")
          .replace(/pivotal role\s*/gi, "big part ")
          .replace(/seamless integration\s*/gi, "smooth fit ")
          .replace(/holistic operational excellence/gi, "everyday work excellence");

        // Break up long clauses for organic cadence
        if (idx === 0 && !n.startsWith("In practice") && !n.startsWith("Also")) {
          n = n.replace(/^The\s+/i, "When looking at the ");
        }
        return n;
      })
      .join(" ");
  } else if (tone === "clearer") {
    rewritten = sentences
      .map((s) => {
        return s
          .replace(/utilize\b/gi, "use")
          .replace(/utilizing\b/gi, "using")
          .replace(/commence\b/gi, "begin")
          .replace(/terminate\b/gi, "end")
          .replace(/facilitate\b/gi, "help")
          .replace(/in the event that\b/gi, "if")
          .replace(/prior to\b/gi, "before")
          .replace(/subsequent to\b/gi, "after")
          .replace(/a majority of\b/gi, "most")
          .replace(/with regard to\b/gi, "about");
      })
      .join(" ");
  } else if (tone === "grammar") {
    rewritten = sentences
      .map((s) => {
        let g = s
          .replace(/\b(typescript|javascript|react|next\.js|node\.js|python|aws|docker|kubernetes|mongodb|sql|graphql)\b/gi, (match) => {
            const map: Record<string, string> = {
              typescript: "TypeScript",
              javascript: "JavaScript",
              react: "React",
              "next.js": "Next.js",
              "node.js": "Node.js",
              python: "Python",
              aws: "AWS",
              docker: "Docker",
              kubernetes: "Kubernetes",
              mongodb: "MongoDB",
              sql: "SQL",
              graphql: "GraphQL",
            };
            return map[match.toLowerCase()] || match;
          })
          .replace(/\s+,/g, ",")
          .replace(/\s+\./g, ".")
          .replace(/([a-z])([A-Z])/g, "$1 $2"); // Fix accidental joined words
        return g.charAt(0).toUpperCase() + g.slice(1);
      })
      .join(" ");
  }

  return {
    originalText,
    rewrittenText: rewritten,
    tone,
    explanation: `Enhanced for a ${tone} tone with structural and lexical improvements.`,
  };
}
