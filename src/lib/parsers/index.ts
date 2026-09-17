import mammoth from "mammoth";

// Polyfill browser DOM globals that pdf-parse / pdfjs-dist might touch in Node/Next.js environments
function initPolyfills() {
  const targets = [
    typeof globalThis !== "undefined" ? globalThis : null,
    typeof global !== "undefined" ? global : null,
  ].filter(Boolean) as any[];

  class PolyfillDOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    m11 = 1; m12 = 0; m13 = 0; m14 = 0;
    m21 = 0; m22 = 1; m23 = 0; m24 = 0;
    m31 = 0; m32 = 0; m33 = 1; m34 = 0;
    m41 = 0; m42 = 0; m43 = 0; m44 = 1;
    is2D = true;
    isIdentity = true;
    constructor(init?: any) {
      if (Array.isArray(init) && init.length >= 6) {
        this.a = init[0]; this.b = init[1]; this.c = init[2];
        this.d = init[3]; this.e = init[4]; this.f = init[5];
        this.m11 = init[0]; this.m12 = init[1]; this.m21 = init[2]; this.m22 = init[3];
        this.m41 = init[4]; this.m42 = init[5];
      }
    }
    inverse() { return this; }
    multiply() { return this; }
    preMultiplySelf() { return this; }
    scale() { return this; }
    translate() { return this; }
    rotate() { return this; }
    transformPoint(p: any) { return p || { x: 0, y: 0, z: 0, w: 1 }; }
    toFloat32Array() { return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]); }
    toFloat64Array() { return new Float64Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]); }
    toString() { return "matrix(1, 0, 0, 1, 0, 0)"; }
  }

  class PolyfillPath2D {
    addPath() {}
    closePath() {}
    moveTo() {}
    lineTo() {}
    bezierCurveTo() {}
    quadraticCurveTo() {}
    arc() {}
    arcTo() {}
    ellipse() {}
    rect() {}
  }

  class PolyfillImageData {
    width = 0;
    height = 0;
    data: Uint8ClampedArray;
    constructor(w = 1, h = 1) {
      this.width = w;
      this.height = h;
      this.data = new Uint8ClampedArray(w * h * 4);
    }
  }

  for (const t of targets) {
    if (typeof t.DOMMatrix === "undefined") t.DOMMatrix = PolyfillDOMMatrix;
    if (typeof t.Path2D === "undefined") t.Path2D = PolyfillPath2D;
    if (typeof t.ImageData === "undefined") t.ImageData = PolyfillImageData;
  }
}
initPolyfills();

// Common English stop words
const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
  "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being",
  "below", "between", "both", "but", "by", "can", "cannot", "could", "did", "do",
  "does", "doing", "don't", "down", "during", "each", "few", "for", "from", "further",
  "had", "has", "have", "having", "he", "her", "here", "hers", "herself", "him",
  "himself", "his", "how", "i", "if", "in", "into", "is", "isn't", "it", "its",
  "itself", "just", "me", "more", "most", "my", "myself", "no", "nor", "not",
  "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours",
  "ourselves", "out", "over", "own", "same", "she", "should", "so", "some", "such",
  "than", "that", "the", "their", "theirs", "them", "themselves", "then", "there",
  "these", "they", "this", "those", "through", "to", "too", "under", "until", "up",
  "very", "was", "wasn't", "we", "were", "what", "when", "where", "which", "while",
  "who", "whom", "why", "with", "would", "you", "your", "yours", "yourself",
]);

export interface ExtractedDocument {
  fullText: string;
  paragraphs: string[];
  wordCount: number;
  sentenceCount: number;
  readabilityScore: number; // 0 - 100
  keywords: string[];
  isResume: boolean;
}

function countSyllablesInWord(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]|ed|es|e)$/, "");
  word = word.replace(/^y/, "");
  const syl = word.match(/[aeiouy]{1,2}/g);
  return syl ? Math.max(1, syl.length) : 1;
}

function calculateFleschReadingEase(words: string[], sentences: number): number {
  if (words.length === 0 || sentences === 0) return 70;
  const totalSyllables = words.reduce(
    (acc, w) => acc + countSyllablesInWord(w),
    0
  );
  const score =
    206.835 -
    1.015 * (words.length / sentences) -
    84.6 * (totalSyllables / words.length);
  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)));
}

function extractTopKeywords(text: string, limit = 12): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9+#.-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w) && !/^\d+$/.test(w));

  const frequencyMap = new Map<string, number>();
  for (const word of words) {
    frequencyMap.set(word, (frequencyMap.get(word) || 0) + 1);
  }

  return Array.from(frequencyMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([w]) => w.charAt(0).toUpperCase() + w.slice(1));
}

function detectIfResume(text: string): boolean {
  const lower = text.toLowerCase();
  const resumeSignals = [
    "experience",
    "education",
    "skills",
    "curriculum vitae",
    "work history",
    "employment",
    "projects",
    "certifications",
    "summary of qualifications",
    "bachelor",
    "master",
    "university",
    "linkedin",
    "github",
  ];
  let matches = 0;
  for (const signal of resumeSignals) {
    if (lower.includes(signal)) matches++;
  }
  return matches >= 2;
}

function extractTextFromPdfStreamFallback(buffer: Buffer): string {
  try {
    const raw = buffer.toString("latin1");
    const extractedParts: string[] = [];

    // Extract text from PDF Tj operators: (some text) Tj
    const tjRegex = /\(([^()]*)\)\s*Tj/g;
    let match: RegExpExecArray | null;
    while ((match = tjRegex.exec(raw)) !== null) {
      if (match[1] && match[1].trim().length > 0) {
        extractedParts.push(match[1]);
      }
    }

    // Extract text from PDF TJ operators: [(part1) -10 (part2)] TJ
    const tjArrayRegex = /\[((?:[^[\]]|\(.*?\))*)\]\s*TJ/g;
    while ((match = tjArrayRegex.exec(raw)) !== null) {
      const inner = match[1];
      const stringMatches = inner.match(/\(([^()]*)\)/g);
      if (stringMatches) {
        const combined = stringMatches.map((s) => s.slice(1, -1)).join("");
        if (combined.trim().length > 0) {
          extractedParts.push(combined);
        }
      }
    }

    if (extractedParts.length > 0) {
      return extractedParts.join(" ").replace(/\\([()\\])/g, "$1");
    }
  } catch {
    // ignore fallback errors
  }
  return "";
}

export async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  initPolyfills();

  let pdfParseError: any = null;
  try {
    // Dynamic import to avoid Node/bundler runtime issues with pdf-parse
    const pdf = require("pdf-parse");
    const data = await pdf(buffer);
    if (data && typeof data.text === "string" && data.text.trim().length > 0) {
      return data.text;
    }
  } catch (err: any) {
    pdfParseError = err;
    console.warn("pdf-parse library error, falling back to stream parsing:", err?.message || err);
  }

  // Attempt stream fallback
  const fallback = extractTextFromPdfStreamFallback(buffer);
  if (fallback && fallback.trim().length >= 20) {
    return fallback;
  }

  if (pdfParseError) {
    throw new Error(
      `Failed to parse PDF document: ${pdfParseError.message || "Unknown error"}`
    );
  }

  return fallback || "";
}

export async function parseDocxBuffer(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  } catch (err: any) {
    throw new Error(
      `Failed to parse DOCX document: ${err.message || "Unknown error"}`
    );
  }
}

export async function extractAndNormalizeDocument(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<ExtractedDocument> {
  let rawText = "";

  const isPdf =
    mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
  const isDocx =
    mimeType.includes("wordprocessingml") ||
    mimeType.includes("docx") ||
    fileName.toLowerCase().endsWith(".docx");

  if (isPdf) {
    rawText = await parsePdfBuffer(buffer);
  } else if (isDocx) {
    rawText = await parseDocxBuffer(buffer);
  } else {
    // Attempt plain text or fallback
    rawText = buffer.toString("utf-8");
  }

  const cleanText = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();

  if (!cleanText || cleanText.length < 20) {
    throw new Error(
      "The document appears to be empty or contains only unscanned images without a text layer."
    );
  }

  // Split into coherent paragraphs (double newline or structural blocks)
  const rawParagraphs = cleanText
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 0);

  // Group very short lines or bullet items into coherent chunks if needed
  const normalizedParagraphs: string[] = [];
  let currentGroup = "";

  for (const p of rawParagraphs) {
    if (p.length < 60 && currentGroup.length < 200) {
      currentGroup = currentGroup ? `${currentGroup} ${p}` : p;
    } else {
      if (currentGroup) {
        normalizedParagraphs.push(currentGroup);
        currentGroup = "";
      }
      normalizedParagraphs.push(p);
    }
  }
  if (currentGroup) {
    normalizedParagraphs.push(currentGroup);
  }

  const finalParagraphs =
    normalizedParagraphs.length > 0 ? normalizedParagraphs : [cleanText];

  const words = cleanText.split(/\s+/).filter(Boolean);

  try {
    const { getAdminConfig } = require("@/lib/admin");
    const adminConfig = getAdminConfig();
    const maxWords = adminConfig?.rateLimits?.maxWordsPerDocument || 10000;
    if (words.length > maxWords) {
      throw new Error(
        `Document exceeds the maximum limit of ${maxWords.toLocaleString()} words (current length: ${words.length.toLocaleString()} words).`
      );
    }
  } catch (err: any) {
    if (err.message && err.message.includes("Document exceeds")) {
      throw err;
    }
  }

  const sentences = cleanText
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 0);

  const readabilityScore = calculateFleschReadingEase(
    words,
    Math.max(1, sentences.length)
  );
  const keywords = extractTopKeywords(cleanText, 14);
  const isResume = detectIfResume(cleanText);

  return {
    fullText: cleanText,
    paragraphs: finalParagraphs,
    wordCount: words.length,
    sentenceCount: Math.max(1, sentences.length),
    readabilityScore,
    keywords,
    isResume,
  };
}
