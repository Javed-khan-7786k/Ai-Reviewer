"use server";

import { PrismaClient } from "@prisma/client";

export interface AdminPaymentKeys {
  stripePublishableKey?: string;
  stripeSecretKey?: string;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  paypalClientId?: string;
  paypalSecret?: string;
}

export interface AdminConfig {
  fullAppFree: boolean;
  requireLogin: boolean;
  subscriptionsEnabled: boolean;
  activePaymentGateway: "stripe" | "razorpay" | "paypal" | "demo";
  paymentTestMode: boolean;
  paymentKeys: AdminPaymentKeys;
  geminiApiKey?: string;
  geminiModel?: string;
  aiProvider: "gemini" | "heuristics";
  rateLimits: {
    maxUploadsPerMinute: number;
    maxDailyUploadsFree: number;
    maxDailyUploadsPro: number;
    maxDailyRewritesFree: number;
    maxDailyRewritesPro: number;
    maxFileSizeMB: number;
    maxWordsPerDocument: number;
    maxWordsPerRewrite: number;
  };
}

const DEFAULT_CONFIG: AdminConfig = {
  fullAppFree: false,
  requireLogin: true,
  subscriptionsEnabled: true,
  activePaymentGateway: "razorpay",
  paymentTestMode: true,
  paymentKeys: {
    razorpayKeyId: "rzp_test_AiReviewerDemo123",
    razorpayKeySecret: "sec_test_AiReviewerKey456",
    stripePublishableKey: "pk_test_51AiReviewerDemoStripeKey",
    stripeSecretKey: "sk_test_51AiReviewerSecretKey",
    paypalClientId: "sb-client-id-demo-test",
    paypalSecret: "sb-secret-key-demo-test",
  },
  aiProvider: (process.env.AI_PROVIDER as "gemini" | "heuristics") || "gemini",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  rateLimits: {
    maxUploadsPerMinute: 10,
    maxDailyUploadsFree: 5,
    maxDailyUploadsPro: 100,
    maxDailyRewritesFree: 25,
    maxDailyRewritesPro: 500,
    maxFileSizeMB: 15,
    maxWordsPerDocument: 10000,
    maxWordsPerRewrite: 800,
  },
};

// In-memory cache to reduce DB reads (refreshes on update or every 60s)
let cachedConfig: AdminConfig | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000; // 1 minute

declare global {
  // eslint-disable-next-line no-var
  var __adminPrisma: PrismaClient | undefined;
}

function getAdminPrisma(): PrismaClient | null {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || (!dbUrl.startsWith("mongodb://") && !dbUrl.startsWith("mongodb+srv://"))) {
    return null;
  }
  if (!global.__adminPrisma) {
    global.__adminPrisma = new PrismaClient();
  }
  return global.__adminPrisma;
}

export function getAdminConfig(): AdminConfig {
  // Return cache if still fresh
  if (cachedConfig && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cachedConfig;
  }
  // Synchronous: return DEFAULT_CONFIG merged with env vars
  // The async version is used when we need fresh DB data
  const config = { ...DEFAULT_CONFIG };
  if (process.env.GEMINI_API_KEY) {
    config.geminiApiKey = process.env.GEMINI_API_KEY;
  }
  if (process.env.AI_PROVIDER === "heuristics" || process.env.AI_PROVIDER === "gemini") {
    config.aiProvider = process.env.AI_PROVIDER;
  }
  cachedConfig = config;
  cacheTimestamp = Date.now();
  return config;
}

export async function getAdminConfigAsync(): Promise<AdminConfig> {
  // Return cache if still fresh
  if (cachedConfig && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cachedConfig;
  }

  const prisma = getAdminPrisma();
  if (!prisma) {
    return getAdminConfig();
  }

  try {
    const row = await (prisma as any).siteConfig.findFirst({
      where: { key: "global" },
    });

    if (!row) {
      // No config in DB yet — return defaults
      const config = getAdminConfig();
      cachedConfig = config;
      cacheTimestamp = Date.now();
      return config;
    }

    const dbPaymentKeys = (row.paymentKeys as AdminPaymentKeys) || {};
    const dbRateLimits = (row.rateLimits as any) || {};

    const merged: AdminConfig = {
      fullAppFree: row.fullAppFree ?? DEFAULT_CONFIG.fullAppFree,
      requireLogin: row.requireLogin ?? DEFAULT_CONFIG.requireLogin,
      subscriptionsEnabled: row.subscriptionsEnabled ?? DEFAULT_CONFIG.subscriptionsEnabled,
      activePaymentGateway: (row.activePaymentGateway as any) || DEFAULT_CONFIG.activePaymentGateway,
      paymentTestMode: row.paymentTestMode ?? DEFAULT_CONFIG.paymentTestMode,
      paymentKeys: { ...DEFAULT_CONFIG.paymentKeys, ...dbPaymentKeys },
      geminiApiKey: row.geminiApiKey || process.env.GEMINI_API_KEY || "",
      aiProvider: (row.aiProvider as "gemini" | "heuristics") || DEFAULT_CONFIG.aiProvider,
      rateLimits: { ...DEFAULT_CONFIG.rateLimits, ...dbRateLimits },
    };

    cachedConfig = merged;
    cacheTimestamp = Date.now();
    return merged;
  } catch (err) {
    console.warn("Failed to read admin config from DB, using defaults:", err);
    return getAdminConfig();
  }
}

export async function updateAdminConfig(updates: Partial<AdminConfig>): Promise<AdminConfig> {
  const current = await getAdminConfigAsync();
  const merged: AdminConfig = {
    ...current,
    ...updates,
    paymentKeys: { ...current.paymentKeys, ...(updates.paymentKeys || {}) },
    rateLimits: { ...current.rateLimits, ...(updates.rateLimits || {}) },
  };

  const prisma = getAdminPrisma();
  if (prisma) {
    try {
      await (prisma as any).siteConfig.upsert({
        where: { key: "global" },
        create: {
          key: "global",
          fullAppFree: merged.fullAppFree,
          requireLogin: merged.requireLogin,
          subscriptionsEnabled: merged.subscriptionsEnabled,
          activePaymentGateway: merged.activePaymentGateway,
          paymentTestMode: merged.paymentTestMode,
          paymentKeys: merged.paymentKeys as any,
          geminiApiKey: merged.geminiApiKey || null,
          aiProvider: merged.aiProvider,
          rateLimits: merged.rateLimits as any,
        },
        update: {
          fullAppFree: merged.fullAppFree,
          requireLogin: merged.requireLogin,
          subscriptionsEnabled: merged.subscriptionsEnabled,
          activePaymentGateway: merged.activePaymentGateway,
          paymentTestMode: merged.paymentTestMode,
          paymentKeys: merged.paymentKeys as any,
          geminiApiKey: merged.geminiApiKey || null,
          aiProvider: merged.aiProvider,
          rateLimits: merged.rateLimits as any,
        },
      });
    } catch (err) {
      console.error("Failed to save admin config to DB:", err);
    }
  }

  // Update cache
  cachedConfig = merged;
  cacheTimestamp = Date.now();
  return merged;
}
