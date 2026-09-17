"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  syncGuestUserAction,
  resetGuestUserAction,
  getCurrentUserAction,
} from "@/actions/auth";

export const USER_STORAGE_KEY = "ai_reviewer_user";
export const USER_CHANGED_EVENT = "ai-reviewer-user-changed";

export function generateDummyGuestUser() {
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const uuid =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 9);
  const randId = `usr_guest_${uuid}`;

  return {
    id: randId,
    name: `Guest User #${randNum}`,
    email: `guest${randNum}@aireviewer.local`,
    plan: "free" as const,
    role: "user" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function triggerGuestUserReset(router?: any) {
  if (typeof window === "undefined") return;

  await resetGuestUserAction();
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem("ai_reviewer_jwt");

  const newGuest = generateDummyGuestUser();
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newGuest));

  const res = await syncGuestUserAction(newGuest);
  if (res.token) {
    localStorage.setItem("ai_reviewer_jwt", res.token);
  }

  window.dispatchEvent(
    new CustomEvent(USER_CHANGED_EVENT, { detail: newGuest })
  );

  if (router?.refresh) {
    router.refresh();
  } else {
    window.location.reload();
  }
}

export function LocalStorageUserSync() {
  const router = useRouter();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    async function initUserSession() {
      try {
        // 1. Check if the server already has an active, real authenticated user
        const serverUser = await getCurrentUserAction();
        const isRealServerUser =
          serverUser &&
          serverUser.id &&
          !serverUser.email.toLowerCase().includes("@aireviewer.local") &&
          serverUser.id !== "usr_guest_pending";

        if (isRealServerUser) {
          // Keep localStorage strictly synced with the active real authenticated user
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(serverUser));
          window.dispatchEvent(
            new CustomEvent(USER_CHANGED_EVENT, { detail: serverUser })
          );
          return; // Real user is active — NEVER run guest generation or overwrite!
        }

        // 2. If no real server session, check localStorage
        const rawUser = localStorage.getItem(USER_STORAGE_KEY);
        let user: any = null;

        if (rawUser) {
          try {
            user = JSON.parse(rawUser);
          } catch {
            user = null;
          }
        }

        const isRealLocalUser =
          user &&
          user.id &&
          !user.email?.toLowerCase().includes("@aireviewer.local") &&
          user.id !== "usr_guest_pending";

        if (isRealLocalUser) {
          // LocalStorage holds a real user session
          window.dispatchEvent(
            new CustomEvent(USER_CHANGED_EVENT, { detail: user })
          );
          return;
        }

        // 3. True guest visitor: if no guest exists, generate one
        if (!user || !user.id) {
          const newDummyUser = generateDummyGuestUser();
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newDummyUser));

          const res = await syncGuestUserAction(newDummyUser);
          if (res.token) {
            localStorage.setItem("ai_reviewer_jwt", res.token);
          }

          window.dispatchEvent(
            new CustomEvent(USER_CHANGED_EVENT, { detail: newDummyUser })
          );

          router.refresh();
        } else {
          // Sync existing guest session
          const res = await syncGuestUserAction(user);
          if (res.token) {
            localStorage.setItem("ai_reviewer_jwt", res.token);
          }
          window.dispatchEvent(
            new CustomEvent(USER_CHANGED_EVENT, { detail: user })
          );
        }
      } catch (err) {
        console.error("LocalStorageUserSync error:", err);
      }
    }

    initUserSession();

    // Listen for manual reset events
    const handleReset = () => {
      triggerGuestUserReset(router);
    };

    window.addEventListener("ai-reviewer-reset-guest", handleReset);
    return () => {
      window.removeEventListener("ai-reviewer-reset-guest", handleReset);
    };
  }, [router]);

  return null;
}
