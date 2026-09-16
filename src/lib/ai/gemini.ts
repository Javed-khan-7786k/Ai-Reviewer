import { getAdminConfig } from "@/lib/admin";
import { ResumeSections, RewriteTone, RewriteResponse } from "@/types";
import { DocumentAiAnalysisOutput, ParagraphAnalysis } from "./index";

export function getEffectiveGeminiApiKey(): string {
  try {
    const config = getAdminConfig();
    if (config.geminiApiKey && config.geminiApiKey.trim().length > 0) {
      return config.geminiApiKey.trim();
    }
  } catch {
    // ignore
  }
  return (process.env.GEMINI_API_KEY || "").trim();
}

export function isGeminiConfigured(): boolean {
  const key = getEffectiveGeminiApiKey();
  return key.length > 5;
}

// Available stable flash models in order of priority
const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

async function callGeminiApi(
  prompt: string,
  systemInstruction?: string,
  jsonMode: boolean = false
): Promise<string> {
  const apiKey = getEffectiveGeminiApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  let lastError: any = null;

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const payload: any = {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2500,
        },
      };

      if (systemInstruction) {
        payload.systemInstruction = {
          parts: [{ text: systemInstruction }],
        };
      }

      if (jsonMode) {
        payload.generationConfig.responseMimeType = "application/json";
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const candidate = data.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error("Gemini returned an empty response.");
      }

      return text;
    } catch (err: any) {
      lastError = err;
      // If model not found (404), try next model in list
      if (err.message && err.message.includes("404")) {
        continue;
      }
      // Otherwise rethrow or break
      break;
    }
  }

  throw lastError || new Error("Failed to call Google Gemini API.");
}

export async function geminiAnalyzeDocument(
  fullText: string,
  paragraphs: string[],
  isResume: boolean
): Promise<DocumentAiAnalysisOutput> {
  const systemPrompt = `You are a world-class AI content reviewer and ATS resume diagnostics expert.
Analyze the provided document text for:
1. overallAiScore (0 to 100 integer indicating probability of AI generation: 0-20=Human, 21-50=Mixed/Assisted, 51-80=High AI, 81-100=Very Likely AI)
2. summary: A professional 2-3 sentence executive diagnostic summary.
3. resumeSections (if isResume is true): Object with present (array of strings), missing (array of strings), atsScore (0-100), suggestions (array of strings). If not resume, set to null.
4. paragraphs: Array of objects for each of the top paragraphs: { paragraphIndex: number, text: string, aiScore: number (0-100), explanation: string, rewriteSuggestion: string | null }

Output strictly valid JSON with no markdown backticks.`;

  const sampleParagraphs = paragraphs.slice(0, 15).map((p, idx) => ({
    index: idx,
    text: p.slice(0, 500),
  }));

  const userPrompt = `Document Type: ${isResume ? "Resume / CV" : "General Document"}
Paragraphs Count: ${paragraphs.length}

Sample Paragraphs:
${JSON.stringify(sampleParagraphs, null, 2)}

Full Document Excerpt (first 3000 chars):
${fullText.slice(0, 3000)}

Return JSON adhering to schema:
{
  "overallAiScore": number,
  "summary": string,
  "resumeSections": ${isResume ? `{"present": string[], "missing": string[], "atsScore": number, "suggestions": string[]}` : "null"},
  "paragraphs": [
    {
      "paragraphIndex": number,
      "text": string,
      "aiScore": number,
      "explanation": string,
      "rewriteSuggestion": string
    }
  ]
}`;

  const jsonText = await callGeminiApi(userPrompt, systemPrompt, true);
  const parsed = JSON.parse(jsonText);

  const parsedParagraphs: ParagraphAnalysis[] = (parsed.paragraphs || []).map(
    (p: any, idx: number) => ({
      paragraphIndex: typeof p.paragraphIndex === "number" ? p.paragraphIndex : idx,
      text: p.text || paragraphs[idx] || "",
      aiScore: Math.min(100, Math.max(0, Math.round(p.aiScore || 25))),
      explanation: p.explanation || "Linguistic structure analyzed by Google Gemini.",
      rewriteSuggestion: p.rewriteSuggestion || null,
    })
  );

  return {
    overallAiScore: Math.min(100, Math.max(0, Math.round(parsed.overallAiScore || 20))),
    detectorProvider: "google-gemini",
    detectorVersion: "2.5-flash",
    summary: parsed.summary || "Document parsed and evaluated by Google Gemini AI engine.",
    resumeSections: parsed.resumeSections || null,
    paragraphs: parsedParagraphs,
  };
}

export async function geminiRewriteParagraph(
  paragraphText: string,
  tone: RewriteTone
): Promise<RewriteResponse> {
  const systemPrompt = `You are an elite editorial writer and document transformation expert.
Your goal is to rewrite the input paragraph to match the requested tone:
- "professional": High-impact executive language, decisive verbs, metric-focused, polished.
- "natural": Conversational, highly organic cadence, varied sentence lengths, sounds authentically human.
- "clearer": Simple, straightforward, eliminates jargon, concise and punchy.
- "grammar": Preserves exact original voice but corrects all syntax, punctuation, flow, and terminology.

Output strictly valid JSON with keys:
{
  "rewrittenText": string,
  "explanation": string
}`;

  const userPrompt = `Tone requested: "${tone}"
Original text:
"""
${paragraphText}
"""`;

  const jsonText = await callGeminiApi(userPrompt, systemPrompt, true);
  const parsed = JSON.parse(jsonText);

  return {
    originalText: paragraphText,
    rewrittenText: parsed.rewrittenText || paragraphText,
    tone,
    explanation: parsed.explanation || `Rewritten in ${tone} tone powered by Google Gemini AI.`,
  };
}
