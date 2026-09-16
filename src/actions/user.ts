"use server";

import { db } from "@/lib/db";
import { User } from "@/types";
import { getCurrentUserAction as getAuthUser } from "@/actions/auth";

export async function getCurrentUserAction(): Promise<User> {
  return getAuthUser();
}

export async function getDashboardStatsAction() {
  const user = await getAuthUser();
  return db.getDashboardStats(user.id);
}
