"use server";

import { getAdminConfig, getAdminConfigAsync, updateAdminConfig, AdminConfig } from "@/lib/admin";
import { getCurrentUserAction } from "@/actions/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getAdminConfigAction(): Promise<AdminConfig> {
  return getAdminConfigAsync();
}

export async function updateAdminConfigAction(
  updates: Partial<AdminConfig>
): Promise<{ success: boolean; config: AdminConfig }> {
  const config = await updateAdminConfig(updates);
  revalidatePath("/admin");
  revalidatePath("/subscription");
  revalidatePath("/dashboard");
  return { success: true, config };
}

// Issue #2: Role from DB, not email
export async function getAllUsersAdminAction() {
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

// Issue #3: Admin passcode from env var
export async function verifyAdminPasscodeAction(passcode: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const envPasscode = process.env.ADMIN_PASSCODE || "admin123";
  if (passcode.trim() === envPasscode) {
    return { success: true };
  }
  return { success: false, error: "Invalid admin passcode." };
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
  try {
    await db.updateUser(userId, { role });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update role." };
  }
}
