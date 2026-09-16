"use server";

import { getAdminConfig, updateAdminConfig, AdminConfig } from "@/lib/admin";
import { getCurrentUserAction } from "@/actions/auth";
import { db, prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getAdminConfigAction(): Promise<AdminConfig> {
  return getAdminConfig();
}

export async function updateAdminConfigAction(
  updates: Partial<AdminConfig>
): Promise<{ success: boolean; config: AdminConfig }> {
  const config = updateAdminConfig(updates);
  revalidatePath("/admin");
  revalidatePath("/subscription");
  revalidatePath("/dashboard");
  return { success: true, config };
}

export async function getAllUsersAdminAction() {
  const users = await db.listUsers();
  return users.map((u) => ({
    id: u.id,
    name: u.name || u.email.split("@")[0],
    email: u.email,
    role: u.email.toLowerCase().includes("admin") || u.id === "usr_demo_default" ? "admin" : "user",
    plan: u.plan,
    createdAt: u.createdAt,
  }));
}

export async function getAdminPublicLimitsAction() {
  const config = getAdminConfig();
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
