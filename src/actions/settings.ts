"use server";

import { db } from "@/lib/db";
import { getCurrentUserAction } from "@/actions/auth";

// Issue #9: Use db.updateUser() instead of direct object mutation
export async function updateProfileNameAction(
  newName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUserAction();
    if (!newName.trim()) {
      return { success: false, error: "Name cannot be empty." };
    }
    await db.updateUser(user.id, { name: newName.trim() });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update profile." };
  }
}

export async function purgeAllUserDocumentsAction(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const user = await getCurrentUserAction();
    const docs = await db.listDocuments(user.id);
    for (const doc of docs) {
      await db.deleteDocument(doc.id);
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to purge documents." };
  }
}
