"use server";

import { db } from "@/lib/db";
import { getCurrentUserAction } from "@/actions/auth";
import { UserPlan } from "@/types";

export async function upgradeUserPlanAction(
  newPlan: UserPlan
): Promise<{ success: boolean; plan?: UserPlan; error?: string }> {
  try {
    const user = await getCurrentUserAction();
    await db.updateUser(user.id, { plan: newPlan });
    return { success: true, plan: newPlan };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update plan" };
  }
}
