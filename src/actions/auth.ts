"use server";

import { cookies } from "next/headers";
import crypto from "crypto";
import { db } from "@/lib/db";
import { signJwt, verifyJwt } from "@/lib/jwt";
import { User } from "@/types";
import { loginValidationSchema, signupValidationSchema } from "@/lib/validation";

const SESSION_COOKIE = "ai_reviewer_jwt";

// --- Password Hashing (Issue #1) ---
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const testHash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return hash === testHash;
}

// --- Rate Limiting (Issue #17) ---
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(key: string, maxAttempts = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxAttempts) return false;
  entry.count++;
  return true;
}

export async function getCurrentUserAction(): Promise<User & { role?: string; authProvider?: string }> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    const payload = verifyJwt(token);
    if (payload && payload.userId) {
      const user = await db.getUser(payload.userId);
      if (user) {
        return {
          ...user,
          role: user.role || payload.role || "user",
          authProvider: (payload as any).authProvider || (user.email.includes("@aireviewer.local") ? "guest" : "email"),
        };
      }
      return {
        id: payload.userId,
        email: payload.email,
        name: payload.name || payload.email.split("@")[0],
        plan: (payload as any).plan || "free",
        role: payload.role || "user",
        passwordHash: null,
        authProvider: (payload as any).authProvider || "email",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  }

  const guestId = cookieStore.get("ai_reviewer_guest_id")?.value;
  if (guestId) {
    const user = await db.getUser(guestId);
    if (user) {
      return { ...user, role: user.role || "user", authProvider: "guest" };
    }
  }

  return {
    id: "usr_guest_pending",
    email: "guest@aireviewer.local",
    name: "Guest User",
    plan: "free",
    role: "user",
    passwordHash: null,
    authProvider: "guest",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function loginUserAction(formData: FormData): Promise<{
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}> {
  try {
    const rawEmail = (formData.get("email") as string) || "";
    const rawPassword = (formData.get("password") as string) || "";

    // Rate limiting
    if (!checkRateLimit(`login:${rawEmail.trim().toLowerCase()}`)) {
      return { success: false, error: "Too many login attempts. Please try again in a minute." };
    }

    const parsed = loginValidationSchema.safeParse({
      email: rawEmail.trim(),
      password: rawPassword,
    });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid credentials." };
    }

    const { email, password } = parsed.data;
    const user = await db.findUserByEmail(email);

    if (!user) {
      return { success: false, error: "No account found with this email. Please sign up first." };
    }

    // Verify password if user has one stored
    if (user.passwordHash) {
      if (!verifyPassword(password, user.passwordHash)) {
        return { success: false, error: "Incorrect password. Please try again." };
      }
    }

    // Issue #2: Role from DB, not email
    const token = signJwt({
      userId: user.id,
      email: user.email,
      name: user.name || "",
      role: user.role || "user",
      plan: user.plan,
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return { success: true, user, token };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to sign in." };
  }
}

export async function googleLoginAction(profile?: {
  email?: string;
  name?: string;
  googleId?: string;
}): Promise<{
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}> {
  try {
    const email = profile?.email?.trim().toLowerCase() || "user.google@gmail.com";
    const name = profile?.name?.trim() || "Google Verified User";

    let user = await db.findUserByEmail(email);
    if (!user) {
      user = await db.createUser({ name, email, plan: "free" });
    }

    // Issue #2: Role from DB
    const token = signJwt({
      userId: user.id,
      email: user.email,
      name: user.name || name,
      role: user.role || "user",
      plan: user.plan,
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return { success: true, user, token };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to sign in with Google." };
  }
}

// Issue #13: demoLoginAction generates unique guest instead of getDefaultUser()
export async function demoLoginAction(options?: {
  id?: string;
  name?: string;
  email?: string;
  role?: "user" | "admin";
}): Promise<{
  success: boolean;
  user?: User;
  token?: string;
}> {
  let user: User | null = null;
  if (options?.id) {
    user = await db.getUser(options.id);
  }
  if (!user && options?.email) {
    user = await db.findUserByEmail(options.email);
  }
  if (!user) {
    // Always create a UNIQUE guest user
    const demoNum = Math.floor(1000 + Math.random() * 9000);
    user = await db.createUser({
      id: options?.id,
      name: options?.name || `Demo User #${demoNum}`,
      email: options?.email || `demo_${Date.now()}_${demoNum}@aireviewer.local`,
      plan: "free",
      role: options?.role || "user",
    });
  }

  const token = signJwt({
    userId: user.id,
    email: user.email,
    name: user.name || "Demo User",
    role: options?.role || user.role || "user",
    plan: user.plan,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  cookieStore.set("ai_reviewer_guest_id", user.id, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return { success: true, user, token };
}

export async function registerUserAction(formData: FormData): Promise<{
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}> {
  try {
    const rawName = (formData.get("name") as string) || "";
    const rawEmail = (formData.get("email") as string) || "";
    const rawPassword = (formData.get("password") as string) || "";

    // Rate limiting
    if (!checkRateLimit(`signup:${rawEmail.trim().toLowerCase()}`)) {
      return { success: false, error: "Too many signup attempts. Please try again in a minute." };
    }

    const parsed = signupValidationSchema.safeParse({
      name: rawName.trim(),
      email: rawEmail.trim(),
      password: rawPassword,
    });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Validation failed." };
    }

    const { name, email, password } = parsed.data;
    const existing = await db.findUserByEmail(email);
    if (existing) {
      return { success: false, error: "An account with this email already exists. Please sign in." };
    }

    // Issue #1: Hash password before storing
    const passwordHash = hashPassword(password);
    const newUser = await db.createUser({
      name,
      email,
      plan: "free",
      role: "user",
      passwordHash,
    });

    const token = signJwt({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name || "",
      role: newUser.role || "user",
      plan: newUser.plan,
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return { success: true, user: newUser, token };
  } catch (err: any) {
    return { success: false, error: err.message || "Registration failed." };
  }
}

export async function syncGuestUserAction(guestData: {
  id: string;
  name: string;
  email: string;
  plan?: "free" | "pro";
}): Promise<{ success: boolean; user?: User; token?: string; error?: string }> {
  try {
    let user = await db.getUser(guestData.id);
    if (!user) {
      user = await db.createUser({
        name: guestData.name || "Guest User",
        email: guestData.email || `${guestData.id}@aireviewer.local`,
        plan: guestData.plan || "free",
      });
    }

    const token = signJwt({
      userId: user.id,
      email: user.email,
      name: user.name || "",
      role: user.role || "user",
      plan: user.plan,
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    cookieStore.set("ai_reviewer_guest_id", user.id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return { success: true, user, token };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to sync guest session." };
  }
}

// Issue #14: resetGuestUserAction now cleans up DB
export async function resetGuestUserAction(): Promise<{ success: boolean }> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    const payload = verifyJwt(token);
    if (payload?.userId && payload.email?.includes("@aireviewer.local")) {
      // Soft-delete the guest user's documents (don't delete user — usage records may be useful)
      try {
        const docs = await db.listDocuments(payload.userId);
        for (const doc of docs) {
          await db.deleteDocument(doc.id);
        }
      } catch {
        // ignore cleanup errors
      }
    }
  }
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete("ai_reviewer_guest_id");
  return { success: true };
}

export async function logoutUserAction(): Promise<{ success: boolean }> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete("ai_reviewer_guest_id");
  return { success: true };
}
