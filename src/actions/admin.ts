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

// Issue #2: Role from DB, not email
export async function getAllUsersAdminAction() {
  await assertAdmin();
  const users = await db.listUsers();
  return users.map((u) => ({
    id: u.id,
    name: u.name || u.email.split("@")[0],
    email: u.email,
    role: u.role || "user",
    plan: u.plan,
    createdAt: u.createdAt,
  }));
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
    fullAppFree: config.fullAppFree,
    requireLogin: config.requireLogin,
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
