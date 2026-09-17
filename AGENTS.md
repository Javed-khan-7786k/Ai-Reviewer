<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# AI Reviewer App - Project Rules and Architecture

## Project Overview
AI Reviewer is a production-grade Next.js 16.3.5 application for AI-powered document & resume analysis. It provides:
- AI document review with paragraph-level analysis & readability scoring
- Paragraph rewrite suggestions with multiple styles & tones
- Role-based Admin panel (`/admin`) for rate limits, gateways, and AI provider toggles
- JWT session authentication with PBKDF2 password hashing & secure guest generation
- Cloud-native architecture ready for Vercel Serverless deployment

## Tech Stack
- **Framework:** Next.js 16.3.5 (App Router, Server Components, Server Actions)
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS 4 with `@tailwindcss/postcss`
- **Database:** MongoDB Atlas via Prisma ORM (`@prisma/client` 5.x)
- **Object Storage:** Vercel Blob (`@vercel/blob`) with Cloudflare R2 alternative
- **AI Engine:** Google Gemini API (with built-in linguistic heuristics fallback)
- **Auth:** Custom JWT (HMAC-SHA256) with httpOnly cookies + route middleware (`src/middleware.ts`)
- **Background Jobs:** Inngest (`/api/inngest`) with direct fallback
- **Icons:** Lucide React
- **Validation:** Zod

## Architecture Guidelines

### 1. File Structure
```
src/
  actions/     # Server Actions ("use server") - business logic & mutations
  app/         # Next.js App Router pages, layouts, and API routes
  components/  # UI components (auth, layout, analysis, documents, upload, ui)
  lib/         # Core libraries (db, jwt, admin, ai, parsers, storage, utils)
  types/       # TypeScript type definitions
  inngest/     # Background job client & functions
  middleware.ts # Server-side route protection
prisma/
  schema.prisma # MongoDB Atlas schema (User, Document, AnalysisJob, AnalysisResult, SiteConfig)
```

### 2. Authentication & Authorization
- **Super Admin:** Exclusively restricted to `Javedkhan7786king@gmail.com`. Passcode bypasses are removed.
- **Passwords:** Hashed with PBKDF2 (100,000 iterations, 32-byte salt) via Node.js `crypto`.
- **Roles:** Explicitly stored in MongoDB (`role: "user" | "admin"`).
- **Auto-Login:** Users with active session credentials in `localStorage` (`ai_reviewer_user` and `ai_reviewer_jwt`) are automatically restored via `restoreSessionFromTokenAction` and redirected away from `/login` or `/signup` to `/dashboard`.
- **Middleware:** `src/middleware.ts` guards protected routes and performs server-side 307 redirects for already-authenticated users trying to access login/signup.
- **Session Isolation:** Real authenticated sessions are never overwritten by guest session generators.

### 3. Database & Storage Layer (Vercel-Ready)
- **Zero Local Filesystem Writes:** All filesystem dependencies have been eliminated to prevent serverless read-only container errors on Vercel.
- **Database:** MongoDB Atlas via Prisma. Site configuration (`fullAppFree`, `geminiModel`, `paymentKeys`, `rateLimits`) is stored in the `SiteConfig` collection.
- **Storage:** Vercel Blob (`@vercel/blob`) via `BLOB_READ_WRITE_TOKEN`, with Cloudflare R2 support.
- **Hex ObjectID Validation:** Always validate 24-character hexadecimal MongoDB ObjectIDs (`/^[0-9a-fA-F]{24}$/`) before performing Prisma operations on users or documents to avoid runtime crashes from `usr_guest_` strings.

### 4. Dynamic Features & Payment Gateways
- **Payment Keys:** Managed 100% dynamically via the `/admin` UI and stored in MongoDB `SiteConfig`. No hardcoded dummy test keys in source code.
- **AI Engine:** Configurable AI model (`gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-flash`, `gemini-1.5-pro`) stored in DB and loaded dynamically at runtime.
- **Full Free Mode:** When `fullAppFree` is true, all payment notices, test mode banners, and subscription upgrade buttons are automatically hidden across the application.

### 5. Coding Conventions
- Use `"use server"` directive for all server actions.
- Use `"use client"` directive for interactive client components.
- Keep file uploads and sensitive secrets out of git.
- Verify production builds with `npx next build` or `npm run build`.

