import fs from "fs";
import path from "path";

export interface AdminPaymentKeys {
  stripePublishableKey?: string;
  stripeSecretKey?: string;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  paypalClientId?: string;
  paypalSecret?: string;
}

export interface AdminConfig {
  fullAppFree: boolean; // Makes the entire app completely free without any subscription
  requireLogin: boolean; // Whether users must log in to upload documents
  subscriptionsEnabled: boolean; // Enable or disable subscription purchases
  activePaymentGateway: "stripe" | "razorpay" | "paypal" | "demo";
  paymentTestMode: boolean;
  paymentKeys: AdminPaymentKeys;
  geminiApiKey?: string;
  aiProvider: "gemini" | "heuristics";
  rateLimits: {
    maxUploadsPerMinute: number;
    maxDailyUploadsFree: number;
    maxDailyUploadsPro: number;
    maxDailyRewritesFree: number;
    maxDailyRewritesPro: number;
    maxFileSizeMB: number;
  };
}

const CONFIG_PATH = path.join(process.cwd(), ".storage", "admin_config.json");

const DEFAULT_CONFIG: AdminConfig = {
  fullAppFree: false,
  requireLogin: true,
  subscriptionsEnabled: true,
  activePaymentGateway: "razorpay", // Default to Razorpay for Indian Rupee & International multi-currency
  paymentTestMode: true,
  paymentKeys: {
    razorpayKeyId: "rzp_test_AiReviewerDemo123",
    razorpayKeySecret: "sec_test_AiReviewerKey456",
    stripePublishableKey: "pk_test_51AiReviewerDemoStripeKey",
    stripeSecretKey: "sk_test_51AiReviewerSecretKey",
    paypalClientId: "sb-client-id-demo-test",
    paypalSecret: "sb-secret-key-demo-test",
  },
  aiProvider: "gemini",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  rateLimits: {
    maxUploadsPerMinute: 10,
    maxDailyUploadsFree: 5,
    maxDailyUploadsPro: 100,
    maxDailyRewritesFree: 25,
    maxDailyRewritesPro: 500,
    maxFileSizeMB: 15,
  },
};

export function getAdminConfig(): AdminConfig {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      const dir = path.dirname(CONFIG_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2), "utf-8");
      return DEFAULT_CONFIG;
    }
    const data = fs.readFileSync(CONFIG_PATH, "utf-8");
    const parsed = JSON.parse(data);
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      paymentKeys: {
        ...DEFAULT_CONFIG.paymentKeys,
        ...(parsed.paymentKeys || {}),
      },
      rateLimits: {
        ...DEFAULT_CONFIG.rateLimits,
        ...(parsed.rateLimits || {}),
      },
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function updateAdminConfig(updates: Partial<AdminConfig>): AdminConfig {
  const current = getAdminConfig();
  const updated: AdminConfig = {
    ...current,
    ...updates,
    paymentKeys: {
      ...current.paymentKeys,
      ...(updates.paymentKeys || {}),
    },
    rateLimits: {
      ...current.rateLimits,
      ...(updates.rateLimits || {}),
    },
  };

  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2), "utf-8");
  return updated;
}
