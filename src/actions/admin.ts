"use server";

import { getAdminConfig, getAdminConfigAsync, updateAdminConfig, AdminConfig } from "@/lib/admin";
import { getCurrentUserAction } from "@/actions/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function assertAdmin(): Promise<void> {
  const user = await getCurrentUserAction();
  const isAuthorized =
    user &&
    (user.role === "admin" ||
      user.email?.toLowerCase() === "javedkhan7786king@gmail.com");
  if (!isAuthorized) {
    throw new Error("Unauthorized: Super Admin access required.");
  }
}

export async function getAdminConfigAction(): Promise<AdminConfig> {
  await assertAdmin();
  return getAdminConfigAsync();
}

export async function updateAdminConfigAction(
  updates: Partial<AdminConfig>
): Promise<{ success: boolean; config: AdminConfig }> {
  await assertAdmin();
  const config = await updateAdminConfig(updates);
  revalidatePath("/admin");
  revalidatePath("/subscription");
  revalidatePath("/dashboard");
  return { success: true, config };
}

// Issue #2: Role from DB, not email + Real vs Guest user distinction
export async function getAllUsersAdminAction() {
  await assertAdmin();
  const users = await db.listUsers();
  const mapped = users.map((u) => {
    const isGuest =
      u.email.toLowerCase().includes("@aireviewer.local") ||
      u.id.startsWith("usr_guest_");
    return {
      id: u.id,
      name: u.name || (isGuest ? "Guest User" : u.email.split("@")[0]),
      email: u.email,
      role: u.role || "user",
      plan: u.plan,
      isGuest,
      authProvider: isGuest ? "guest" : (u.passwordHash ? "email" : "google"),
      createdAt: u.createdAt,
    };
  });

  // Sort real registered users first, then by createdAt desc
  return mapped.sort((a, b) => {
    if (a.isGuest !== b.isGuest) {
      return a.isGuest ? 1 : -1;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

// Public passcode elevation is strictly disabled. Only Javedkhan7786king@gmail.com is Super Admin.
export async function verifyAdminPasscodeAction(_passcode: string): Promise<{
  success: boolean;
  error?: string;
}> {
  return {
    success: false,
    error: "Passcode elevation is disabled. Admin access is strictly restricted to Javedkhan7786king@gmail.com.",
  };
}

// 7-day expired guest user data cleanup (MongoDB + Storage)
export async function cleanupExpiredGuestsAdminAction(days = 7) {
  await assertAdmin();
  const { cleanupExpiredGuestData } = await import("@/lib/cleanup");
  const result = await cleanupExpiredGuestData(days);
  revalidatePath("/admin");
  return result;
}

export async function getAdminPublicLimitsAction() {
  const config = await getAdminConfigAsync();
  return {
    maxFileSizeMB: config.rateLimits.maxFileSizeMB,
    maxDailyUploadsFree: config.rateLimits.maxDailyUploadsFree,
    maxDailyUploadsPro: config.rateLimits.maxDailyUploadsPro,
    maxDailyRewritesFree: config.rateLimits.maxDailyRewritesFree,
    maxDailyRewritesPro: config.rateLimits.maxDailyRewritesPro,
    maxWordsPerDocument: config.rateLimits.maxWordsPerDocument || 10000,
    maxWordsPerRewrite: config.rateLimits.maxWordsPerRewrite || 800,
    fullAppFree: config.fullAppFree,
    requireLogin: config.requireLogin,
    subscriptionsEnabled: config.subscriptionsEnabled,
    geminiModel: config.geminiModel || "gemini-2.5-flash",
  };
}

// Admin can change user roles
export async function setUserRoleAction(
  userId: string,
  role: "user" | "admin"
): Promise<{ success: boolean; error?: string }> {
  await assertAdmin();
  try {
    await db.updateUser(userId, { role });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update role." };
  }
}
