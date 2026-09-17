# AI Reviewer App - Resolution Status & Architecture Report

> **Status:** All 26 Identified Issues Resolved  
> **Build Status:** Compiles Successfully with Zero TypeScript/Lint Errors (`next build` with Turbopack)  
> **Target Deployment:** Vercel (App Router Serverless)  
> **Database:** MongoDB Atlas (Prisma Client)  
> **File Storage:** Vercel Blob (`@vercel/blob`) with Cloudflare R2 alternative  
> **Background Processing:** Inngest (`/api/inngest`) with direct fallback  

---

## Summary of Fixed Issues (All 26 Resolved)

| # | Issue | Severity | Status | Resolution Detail |
|---|-------|----------|--------|-------------------|
| **1** | No real password hashing | Critical | Fixed | PBKDF2 with unique salts & 100k iterations via Node crypto. `passwordHash` stored in MongoDB. |
| **2** | Email-based admin role (`includes("admin")`) | Critical | Fixed | Migrated to explicit `role` field in DB (`user` \| `admin`). Role elevated only via admin actions. |
| **3** | Admin passcode hardcoded as `admin123` | Critical | Fixed | Verified via `verifyAdminPasscodeAction` comparing with `ADMIN_PASSCODE` env var. Hint removed. |
| **4** | Missing server-side route protection | Critical | Fixed | Next.js `middleware.ts` guards `/dashboard`, `/admin`, `/settings`, etc. Non-admins blocked from `/admin`. |
| **5** | `.env` files missing production docs | Major | Fixed | Updated `.env.example` with `BLOB_READ_WRITE_TOKEN`, `DATABASE_URL`, `JWT_SECRET`, `ADMIN_PASSCODE`. |
| **6** | Gemini API key precedence ambiguity | Major | Fixed | Clear priority: Admin Config (`SiteConfig`) > `process.env.GEMINI_API_KEY`. |
| **7** | `aiProvider` toggle disconnected | Major | Fixed | `ai/index.ts` reads `getAdminConfig().aiProvider`. Respects heuristics vs Gemini configuration. |
| **8** | Settings preferences lost on reload | Major | Fixed | Preferences (detection mode, sensitivity, auto-purge) persisted and restored from localStorage. |
| **9** | Profile name update not saving to DB | Major | Fixed | `updateProfileNameAction` calls `db.updateUser()` with MongoDB persistence. |
| **10** | Sidebar plan quota hardcoded | Major | Fixed | `DashboardShell` queries admin public rate limits dynamically on mount. |
| **11** | Google Sign-in demo ambiguity | Minor | Fixed | Explicitly labeled as "Continue with Google (Demo)" in Login & Signup pages. |
| **12** | Guest User ID collision risk | Minor | Fixed | Uses `crypto.randomUUID()` with secure timestamp fallback. |
| **13** | Demo login shared identity | Minor | Fixed | `demoLoginAction` creates isolated, unique guest user per session. |
| **14** | Guest reset cookie-only (orphaned DB) | Minor | Fixed | `resetGuestUserAction` soft-deletes previous guest record in MongoDB. |
| **15** | Server Actions CSRF protection | Minor | Fixed | Protected by Next.js Server Actions origin validation & header verification. |
| **16** | JWT secret insecure fallback in prod | Major | Fixed | Logs critical production warning if `JWT_SECRET` is unset; enforces secure signing. |
| **17** | Auth endpoints brute-force rate limit | Major | Fixed | Added IP-based sliding window rate limiter to login/register actions. |
| **18** | Admin config missing defaults | Minor | Fixed | Schema & `DEFAULT_CONFIG` fully merged before returning or saving in DB. |
| **19** | Landing page upload dropzone auth | Minor | Fixed | Authenticated upload redirects to `/login` if `requireLogin` is active. |
| **20** | Analytics page empty state | Minor | Fixed | Added empty state card with CTA when user has 0 completed documents. |
| **21** | Signup form missing inline feedback | Minor | Fixed | Added dynamic password strength bar and inline email validation feedback. |
| **22** | Mobile drawer overlay click-to-close | Minor | Fixed | Added `onClick` backdrop dismiss handler to mobile nav overlay. |
| **23** | Subscription demo mode transparency | Minor | Fixed | Added conspicuous "Sandbox / Demo Mode" banner to `/subscription`. |
| **24** | `.storage/` sensitive data leak | Major | Fixed | Added `.storage/` and scratch directories to `.gitignore`. Removed filesystem dependencies on Vercel. |
| **25** | Missing Prisma schema role field | Critical | Fixed | Added `role`, `passwordHash`, and `SiteConfig` model to `prisma/schema.prisma`. |
| **26** | Vercel `/var/task/.storage` ENOENT bug | Critical | Fixed | Replaced all local filesystem storage with MongoDB Atlas + Vercel Blob (`@vercel/blob`). |

---

## Vercel Deployment Guide

### 1. Environment Variables to Configure in Vercel
Add the following in your Vercel Project Settings -> **Environment Variables**:
- `DATABASE_URL`: MongoDB Atlas connection string (e.g. `mongodb+srv://user:pass@cluster.mongodb.net/ai-reviewer?retryWrites=true&w=majority`)
- `BLOB_READ_WRITE_TOKEN`: Automatically generated when adding Vercel Blob from the Storage tab!
- `JWT_SECRET`: Random 32+ character string for HMAC-SHA256 signing
- `ADMIN_PASSCODE`: Secret passcode to unlock `/admin` settings
- `GEMINI_API_KEY`: Google Gemini API key (optional; falls back to linguistic heuristics)
- `AI_PROVIDER`: `gemini` or `heuristics`
- `INNGEST_EVENT_KEY` & `INNGEST_SIGNING_KEY`: (Optional) for serverless background queues

### 2. Vercel Storage Setup
1. In the Vercel dashboard, navigate to **Storage**.
2. Click **Create Database** -> **Blob**.
3. Link the Blob store to this project. The `BLOB_READ_WRITE_TOKEN` will be attached automatically.

### 3. Build Command
The build script automatically runs `prisma generate && next build`:
```bash
npm run build
```
