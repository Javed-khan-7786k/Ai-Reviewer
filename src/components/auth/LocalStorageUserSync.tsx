"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { syncGuestUserAction, resetGuestUserAction } from "@/actions/auth";

export const USER_STORAGE_KEY = "ai_reviewer_user";
export const USER_CHANGED_EVENT = "ai-reviewer-user-changed";

export function generateDummyGuestUser() {
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const randId =
    "usr_guest_" +
    Date.now().toString(36) +
    "_" +
    Math.random().toString(36).substring(2, 7);

  return {
    id: randId,
    name: `Guest User #${randNum}`,
    email: `guest${randNum}@aireviewer.local`,
    plan: "free" as const,
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
        const rawUser = localStorage.getItem(USER_STORAGE_KEY);
        let user: any = null;

        if (rawUser) {
          try {
            user = JSON.parse(rawUser);
          } catch {
            user = null;
          }
        }

        // Case 1: User data is NOT found in localStorage
        // Generate new dummy user, save to localStorage, and sync with server
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

          // Refresh server components to immediately reflect this brand new user's 0-used limits
          router.refresh();
        } else {
          // Case 2: User data IS found in localStorage
          // Ensure server session cookie matches the user stored in localStorage
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
