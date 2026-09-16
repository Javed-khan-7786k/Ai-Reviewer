"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { signJwt, verifyJwt } from "@/lib/jwt";
import { User } from "@/types";
import { loginValidationSchema, signupValidationSchema } from "@/lib/validation";

const SESSION_COOKIE = "ai_reviewer_jwt";

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
          role: payload.role || "user",
          authProvider: (payload as any).authProvider || (user.email.includes("@aireviewer.local") ? "guest" : "email"),
        };
      }
      return {
        id: payload.userId,
        email: payload.email,
        name: payload.name || payload.email.split("@")[0],
        plan: (payload as any).plan || "free",
        role: payload.role || "user",
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
      return {
        ...user,
        role: "user",
        authProvider: "guest",
      };
    }
  }

  // Isolated guest placeholder for brand new browsers before client syncs localStorage
  return {
    id: "usr_guest_pending",
    email: "guest@aireviewer.local",
    name: "Guest User",
    plan: "free",
    role: "user",
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

    const parsed = loginValidationSchema.safeParse({
      email: rawEmail.trim(),
      password: rawPassword,
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid credentials provided.",
      };
    }

    const { email } = parsed.data;

    // Check if user exists in database
    let user = await db.findUserByEmail(email);

    if (!user) {
      // Create user automatically on first login if not registered yet
      const derivedName = email.split("@")[0].replace(/[._]/g, " ");
      user = await db.createUser({
        name: derivedName.charAt(0).toUpperCase() + derivedName.slice(1),
        email,
        plan: "free",
      });
    }

    const role = email.toLowerCase().includes("admin") ? "admin" : "user";
    const token = signJwt({
      userId: user.id,
      email: user.email,
      name: user.name || "",
      role,
      plan: user.plan,
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
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
      user = await db.createUser({
        name,
        email,
        plan: "free",
      });
    }

    const role = email.includes("admin") ? "admin" : "user";
    const token = signJwt({
      userId: user.id,
      email: user.email,
      name: user.name || name,
      role,
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
  if (!user && (options?.name || options?.email)) {
    user = await db.createUser({
      id: options.id,
      name: options.name || "Demo User",
      email: options.email || `demo_${Date.now()}@aireviewer.local`,
      plan: "free",
    });
  }
  if (!user) {
    user = await db.getDefaultUser();
  }

  const role = options?.role || (user.email.toLowerCase().includes("admin") || user.id === "usr_demo_default" ? "admin" : "user");
  const token = signJwt({
    userId: user.id,
    email: user.email,
    name: user.name || "Demo User",
    role,
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

    const parsed = signupValidationSchema.safeParse({
      name: rawName.trim(),
      email: rawEmail.trim(),
      password: rawPassword,
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Validation failed.",
      };
    }

    const { name, email } = parsed.data;

    // Check if user already exists
    const existing = await db.findUserByEmail(email);
    if (existing) {
      return {
        success: false,
        error: "An account with this email address already exists. Please sign in instead.",
      };
    }

    const newUser = await db.createUser({
      name,
      email,
      plan: "free",
    });

    const role = email.toLowerCase().includes("admin") ? "admin" : "user";
    const token = signJwt({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name || "",
      role,
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
        id: guestData.id,
        name: guestData.name || "Guest User",
        email: guestData.email || `${guestData.id}@aireviewer.local`,
        plan: guestData.plan || "free",
      });
    }

    const role = "user";
    const token = signJwt({
      userId: user.id,
      email: user.email,
      name: user.name || "",
      role,
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

export async function resetGuestUserAction(): Promise<{ success: boolean }> {
  const cookieStore = await cookies();
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
