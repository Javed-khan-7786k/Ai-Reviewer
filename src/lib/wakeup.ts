import { PrismaClient } from "@prisma/client";

export interface WakeupSchedulerConfig {
  enabled: boolean;
  targetUrl: string;
  targetName: string;
  delayMs: number;
  maxAttempts: number;
  timeoutMs: number;
  scheduleCron: string;
  scheduleDescription: string;
  lastRunAt?: string | null;
  lastStatus?: number | null;
  lastDurationMs?: number | null;
  lastAttempts?: number | null;
  lastSuccess?: boolean | null;
  lastLogs?: string[];
  lastError?: string | null;
}

export interface WakeupResult {
  success: boolean;
  finalStatus: number | null;
  attempts: number;
  totalDurationMs: number;
  logs: string[];
  error?: string | null;
  timestamp: string;
  targetUrl: string;
}

export const DEFAULT_WAKEUP_CONFIG: WakeupSchedulerConfig = {
  enabled: true,
  targetName: "Video Automation Studio - Multi-Platform & Cron Engine",
  targetUrl: "https://youtubeautomationbot.onrender.com/",
  delayMs: 5000, // 5 seconds interval between retries
  maxAttempts: 24, // Up to 24 retries (~2 minutes total)
  timeoutMs: 20000, // 20s timeout per HTTP request
  scheduleCron: "30 23 * * *", // 5:00 AM IST daily (23:30 UTC previous day)
  scheduleDescription: "Daily at 5:00 AM IST (23:30 UTC)",
  lastRunAt: null,
  lastStatus: null,
  lastDurationMs: null,
  lastAttempts: null,
  lastSuccess: null,
  lastLogs: [],
  lastError: null,
};

// In-memory cache for fast lookups
let cachedConfig: WakeupSchedulerConfig | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000;

declare global {
  // eslint-disable-next-line no-var
  var __wakeupPrisma: PrismaClient | undefined;
}

function getWakeupPrisma(): PrismaClient | null {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || (!dbUrl.startsWith("mongodb://") && !dbUrl.startsWith("mongodb+srv://"))) {
    return null;
  }
  if (!global.__wakeupPrisma) {
    global.__wakeupPrisma = new PrismaClient();
  }
  return global.__wakeupPrisma;
}

function formatLogTimestamp(): string {
  const now = new Date();
  return now.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour12: true,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Retrieves the current Wakeup Scheduler config from DB or cache
 */
export async function getWakeupConfig(): Promise<WakeupSchedulerConfig> {
  if (cachedConfig && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cachedConfig;
  }

  const prisma = getWakeupPrisma();
  if (!prisma) {
    return cachedConfig || DEFAULT_WAKEUP_CONFIG;
  }

  try {
    const row = await (prisma as any).siteConfig.findFirst({
      where: { key: "global" },
    });

    if (row && (row as any).rateLimits?.wakeupScheduler) {
      const dbConfig = (row as any).rateLimits.wakeupScheduler;
      const merged: WakeupSchedulerConfig = {
        ...DEFAULT_WAKEUP_CONFIG,
        ...dbConfig,
      };
      cachedConfig = merged;
      cacheTimestamp = Date.now();
      return merged;
    }
  } catch (err) {
    console.warn("Failed to load wakeup scheduler config from DB:", err);
  }

  return cachedConfig || DEFAULT_WAKEUP_CONFIG;
}

/**
 * Updates and saves Wakeup Scheduler configuration
 */
export async function saveWakeupConfig(
  updates: Partial<WakeupSchedulerConfig>
): Promise<WakeupSchedulerConfig> {
  const current = await getWakeupConfig();
  const merged: WakeupSchedulerConfig = {
    ...current,
    ...updates,
  };

  const prisma = getWakeupPrisma();
  if (prisma) {
    try {
      const existing = await (prisma as any).siteConfig.findFirst({
        where: { key: "global" },
      });

      const existingLimits = existing?.rateLimits || {};
      const updatedLimits = {
        ...existingLimits,
        wakeupScheduler: merged,
      };

      await (prisma as any).siteConfig.upsert({
        where: { key: "global" },
        create: {
          key: "global",
          rateLimits: updatedLimits,
        },
        update: {
          rateLimits: updatedLimits,
        },
      });
    } catch (err) {
      console.error("Failed to save wakeup scheduler config to DB:", err);
    }
  }

  cachedConfig = merged;
  cacheTimestamp = Date.now();
  return merged;
}

/**
 * Executes continuous ping hits to the target URL with 5-second delays until status 200 OK is received
 */
export async function executeWakeupPing(
  overrideConfig?: Partial<WakeupSchedulerConfig>
): Promise<WakeupResult> {
  const config = await getWakeupConfig();
  const targetUrl = (overrideConfig?.targetUrl || config.targetUrl || DEFAULT_WAKEUP_CONFIG.targetUrl).trim();
  const delayMs = overrideConfig?.delayMs ?? config.delayMs ?? DEFAULT_WAKEUP_CONFIG.delayMs;
  const maxAttempts = overrideConfig?.maxAttempts ?? config.maxAttempts ?? DEFAULT_WAKEUP_CONFIG.maxAttempts;
  const timeoutMs = overrideConfig?.timeoutMs ?? config.timeoutMs ?? DEFAULT_WAKEUP_CONFIG.timeoutMs;

  const logs: string[] = [];
  const startTime = Date.now();
  let attempt = 0;
  let success = false;
  let finalStatus: number | null = null;
  let errorMessage: string | null = null;

  logs.push(
    `[${formatLogTimestamp()} IST] Initializing Wakeup Engine for: ${config.targetName}`
  );
  logs.push(
    `[${formatLogTimestamp()} IST] Target URL: ${targetUrl} | Retry Interval: ${delayMs / 1000}s | Max Attempts: ${maxAttempts}`
  );

  while (attempt < maxAttempts) {
    attempt++;
    const attemptStart = Date.now();
    logs.push(
      `[${formatLogTimestamp()} IST] Attempt ${attempt}/${maxAttempts}: Sending GET request...`
    );

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(targetUrl, {
        method: "GET",
        headers: {
          "User-Agent": "AiReviewer-WakeupScheduler/1.0 (Render Engine Keep-Alive)",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
        signal: controller.signal,
      });

      clearTimeout(timer);
      const attemptDuration = Date.now() - attemptStart;
      finalStatus = response.status;

      if (response.status === 200) {
        success = true;
        logs.push(
          `[${formatLogTimestamp()} IST] Attempt ${attempt} SUCCESS: Status 200 OK received in ${attemptDuration}ms!`
        );
        logs.push(
          `[${formatLogTimestamp()} IST] Target service is fully active and ready.`
        );
        break;
      } else {
        logs.push(
          `[${formatLogTimestamp()} IST] Attempt ${attempt} Status ${response.status} (${response.statusText || "Pending"}). Server is spinning up...`
        );
      }
    } catch (err: any) {
      const attemptDuration = Date.now() - attemptStart;
      const isAbort = err?.name === "AbortError";
      const errMsg = isAbort ? `Request timed out after ${timeoutMs}ms` : err?.message || "Connection failed";
      errorMessage = errMsg;
      logs.push(
        `[${formatLogTimestamp()} IST] Attempt ${attempt} Notice: ${errMsg} (${attemptDuration}ms). Render container spinning up.`
      );
    }

    // If not successful and more attempts remaining, wait delayMs (5 seconds)
    if (attempt < maxAttempts) {
      logs.push(
        `[${formatLogTimestamp()} IST] Waiting ${delayMs / 1000} seconds before attempt ${attempt + 1}...`
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  const totalDurationMs = Date.now() - startTime;

  if (!success) {
    logs.push(
      `[${formatLogTimestamp()} IST] Reached maximum allowed attempts (${maxAttempts}) without receiving HTTP 200.`
    );
  }

  const result: WakeupResult = {
    success,
    finalStatus,
    attempts: attempt,
    totalDurationMs,
    logs,
    error: success ? null : errorMessage || "Did not receive HTTP 200 within attempt limit.",
    timestamp: new Date().toISOString(),
    targetUrl,
  };

  // Persist execution result to DB
  try {
    await saveWakeupConfig({
      lastRunAt: result.timestamp,
      lastStatus: result.finalStatus,
      lastDurationMs: result.totalDurationMs,
      lastAttempts: result.attempts,
      lastSuccess: result.success,
      lastLogs: result.logs,
      lastError: result.error,
    });
  } catch (saveErr) {
    console.warn("Failed to persist wakeup execution result:", saveErr);
  }

  return result;
}
