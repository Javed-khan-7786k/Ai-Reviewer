<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# AI Reviewer App - Project Rules and Architecture

## Project Overview
AI Reviewer is a Next.js 16.3.5 application for document analysis (resume/general). It provides:
- AI-powered document review with paragraph-level analysis
- Readability scoring, keyword extraction, resume section parsing
- Paragraph rewrite suggestions with multiple tones
- Admin panel for global configuration (rate limits, payment gateways, AI provider)
- JWT-based authentication with guest user auto-generation
- Local file-based DB (`.storage/db.json`) with optional MongoDB Atlas

## Tech Stack
- **Framework:** Next.js 16.3.5 (App Router, Server Components, Server Actions)
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS 4 with `@tailwindcss/postcss`
- **Database:** Local JSON file-based DB (default) or MongoDB Atlas via Prisma
- **Storage:** Local filesystem (`.storage/uploads/`) or Cloudflare R2
- **AI:** Google Gemini API or built-in linguistic heuristics analyzer
- **Auth:** Custom JWT (HMAC-SHA256) with httpOnly cookies + localStorage sync
- **Icons:** Lucide React
- **Validation:** Zod
- **Background Jobs:** Inngest (optional, falls back to `setTimeout`)

## Architecture Rules

### 1. File Structure
```
src/
  actions/     # Server Actions ("use server") - business logic
  app/         # Next.js App Router pages and layouts
  components/  # Reusable UI components (organized by domain)
  lib/         # Core libraries (db, jwt, admin, ai, parsers, storage, validation)
  types/       # TypeScript type definitions
  inngest/     # Background job definitions
```

### 2. Authentication Flow
- Guest users: Auto-generated via `LocalStorageUserSync` component on first visit
- Each new browser session without localStorage data generates a unique dummy user
- Server-side auth: JWT token in httpOnly cookie (`ai_reviewer_jwt`)
- Client-side state: User object in localStorage (`ai_reviewer_user`)
- Login methods: Email/password, Google (simulated), Demo 1-click
- Admin role: Currently email-based (contains "admin") - needs migration to DB field

### 3. Admin Configuration
- Admin config stored in `.storage/admin_config.json`
- Controls: `fullAppFree`, `requireLogin`, `subscriptionsEnabled`, rate limits, payment gateways, AI provider
- Rate limits are defined per plan (free/pro) for uploads and rewrites
- Admin panel accessible at `/admin` (protected by passcode)

### 4. Database Dual-Mode Pattern
Every `db.*` function checks `if (prisma)` for MongoDB operations, otherwise uses local JSON file. Always maintain both paths when modifying database functions.

### 5. Usage Tracking
- Usage records track daily `documentsProcessed` and `rewriteRequests` per user
- Rate limits checked against `admin_config.json` values
- `fullAppFree` mode bypasses all limits

### 6. Environment Variables
Required in `.env.local`:
- `GEMINI_API_KEY` - For AI analysis (optional, falls back to heuristics)
- `AI_PROVIDER` - "gemini" or "heuristics"
- `DATABASE_URL` - MongoDB connection string (optional, uses local DB)
- `JWT_SECRET` - Custom JWT signing key (has insecure default fallback)

### 7. Key Type Definitions
- `User`: id, email, name, plan (free/pro), timestamps
- `Document`: id, userId, fileName, status, documentType, aiScore, keywords
- `AnalysisResult`: aiScore, readabilityScore, keywords, resumeSections, paragraphs
- `AdminConfig`: fullAppFree, requireLogin, rateLimits, paymentKeys, aiProvider

### 8. Known Issues
See `ISSUES.md` for 26 documented bugs and improvement areas organized by severity.

## Coding Conventions
- Use `"use server"` directive for all server actions
- Use `"use client"` directive for interactive components
- Server Components are default (no directive needed)
- Use `getCurrentUserAction()` to get the authenticated user in server actions
- Use `getAdminConfig()` to read admin settings
- Toast notifications via `useToast()` hook
- Keep file DB writes atomic - always call `saveLocalDb()` after mutations
- Use `export const dynamic = "force-dynamic"` for pages that need fresh data
