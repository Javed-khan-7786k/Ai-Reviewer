# AI Reviewer App - Known Issues and Bugs

> Last Updated: 2026-09-16
> Build Status: Compiles successfully (Next.js 16.3.5 + Turbopack)

---

## CRITICAL Issues

### 1. No Real Password Hashing or Verification
- **File:** `src/actions/auth.ts` - `loginUserAction()`
- **Problem:** The login form accepts email + password but the password is never stored or verified. Any password >= 6 chars will pass validation. A new user is auto-created on first login attempt if the email doesn't exist.
- **Impact:** Zero authentication security - anyone can impersonate any email address.
- **Fix:** Implement bcrypt/argon2 password hashing. Store hashed password in the User model. Compare on login. Reject unregistered emails during login (separate from signup).

### 2. Admin Role Determination is Email-Based (Hardcoded)
- **File:** `src/actions/auth.ts` lines 101, 148, 201, 270 + `src/actions/admin.ts` line 28
- **Problem:** Admin role is granted if `email.includes("admin")` - anyone registering with "admin" in their email gets admin access to the entire system.
- **Impact:** Any user can elevate to admin by registering `myadmin@gmail.com`.
- **Fix:** Store `role` field explicitly in the User model/DB. Only allow role assignment from the admin panel or a secure seeder.

### 3. Admin Passcode Hardcoded and Visible in Source
- **File:** `src/app/admin/page.tsx` lines 97-108
- **Problem:** Admin passcode is hardcoded as `"admin123"` and even shown in the UI placeholder text. The passcode check happens client-side only.
- **Impact:** Anyone can access admin panel by typing `admin123`.
- **Fix:** Move admin verification to a server action. Use a configurable env var (`ADMIN_PASSCODE`) or proper role-based middleware.

### 4. No Server-Side Route Protection / Middleware
- **Problem:** There is no Next.js middleware to protect `/admin`, `/dashboard`, `/settings` etc. Any unauthenticated user can navigate directly to these URLs.
- **Impact:** Protected pages are not actually protected.
- **Fix:** Add `middleware.ts` with JWT verification that redirects unauthenticated users to `/login` and non-admin users away from `/admin`.

---

## MAJOR Issues

### 5. `.env` Files Excluded from Git but Needed for Deployment
- **File:** `.gitignore` line 34 (`".env*"`)
- **Problem:** `.env.local` is gitignored (correct for secrets), but there is no mechanism to set env vars during deployment. The `.env.example` file exists but key values like `GEMINI_API_KEY` and `AI_PROVIDER` are empty.
- **Fix:** Ensure deployment documentation mentions setting env vars. Consider adding a `JWT_SECRET` env var requirement.

### 6. `geminiApiKey` in `admin_config.json` vs `.env.local`
- **File:** `src/lib/admin.ts` line 49 vs `.env.local` line 15
- **Problem:** The Gemini API key can be set in TWO places - `admin_config.json` and `.env.local`. The admin panel UI lets you set `geminiApiKey` but the AI module (`src/lib/ai/gemini.ts`) may read from `process.env.GEMINI_API_KEY`. There's no clear precedence.
- **Impact:** Confusion about which key is actually used.
- **Fix:** Establish clear precedence: admin config > env var. Document this.

### 7. `aiProvider` Field Not Fully Connected
- **File:** `src/lib/admin.ts` defines `aiProvider: "gemini" | "heuristics"` but the admin panel saves it
- **Problem:** The admin config allows setting `aiProvider` and `geminiApiKey`, but it's unclear if the actual AI processing pipeline reads from admin config or only from env vars.
- **Fix:** Ensure `src/lib/ai/index.ts` reads `getAdminConfig().aiProvider` to decide which analyzer to use.

### 8. Settings Page Preferences Not Persisted
- **File:** `src/app/settings/page.tsx`
- **Problem:** "Default Document Detection", "AI Pattern Sensitivity", "Processing Completion Alerts", and "Auto-Purge" settings are local React state only - they reset on every page reload. Toast says "updated" but nothing is actually saved.
- **Impact:** User thinks settings are saved but they revert.
- **Fix:** Persist these to the user's profile in the database or at minimum to localStorage.

### 9. `updateProfileNameAction` Doesn't Persist to Local DB Properly
- **File:** `src/actions/settings.ts` lines 22-25
- **Problem:** The function calls `db.getUser()` and mutates the returned object directly (`local.name = newName.trim()`) but never calls `saveLocalDb()`. The mutation is on a copy, not the stored record.
- **Impact:** Profile name updates silently fail in local file DB mode.
- **Fix:** Use `db.updateUser(user.id, { name: newName.trim() })` instead.

### 10. Sidebar Free Plan Widget Shows Hardcoded "5 reviews per day"
- **File:** `src/components/layout/DashboardShell.tsx` line 248
- **Problem:** The sidebar says "5 reviews per day with paragraph rewrites" as a hardcoded string. But the actual limit is dynamic from `admin_config.json` (`maxDailyUploadsFree`).
- **Impact:** If admin changes limits to 10, the sidebar still says 5.
- **Fix:** Fetch admin config limits and display dynamically.

---

## MODERATE Issues

### 11. Google OAuth is Simulated (Not Real)
- **File:** `src/actions/auth.ts` - `googleLoginAction()`
- **Problem:** The "Continue with Google" button doesn't use real Google OAuth. It creates a user from whatever email is typed or generates a dummy `guest.google@example.com`.
- **Impact:** Users expect real Google login but it's a simulation.
- **Fix:** Either implement real Google OAuth (NextAuth.js) or clearly label as "Demo Mode".

### 12. Guest User ID Collision Unlikely but Possible
- **File:** `src/components/auth/LocalStorageUserSync.tsx` line 12
- **Problem:** Guest user IDs use `Date.now().toString(36) + random` which is very unlikely to collide but not cryptographically unique.
- **Minor impact.** Acceptable for demo but not production.

### 13. `demoLoginAction` Falls Back to `getDefaultUser()` (Shared Identity)
- **File:** `src/actions/auth.ts` line 198
- **Problem:** If no options provided and no stored guest, `demoLoginAction` calls `db.getDefaultUser()` which always returns the same hardcoded "Alex Taylor" user. Multiple people could share the same user account.
- **Fix:** Always generate a unique guest user when no identity is provided.

### 14. `resetGuestUserAction` Cookie-Only (No DB Cleanup)
- **File:** `src/actions/auth.ts` lines 342-347
- **Problem:** Reset only deletes cookies but doesn't clean up the orphaned user record in the database. Over time, the DB accumulates abandoned guest users.
- **Fix:** Optionally mark old guest users as inactive or schedule cleanup.

### 15. No CSRF Protection on Server Actions
- **Problem:** Next.js server actions have some built-in CSRF protection, but there's no explicit verification of the origin or anti-CSRF tokens.
- **Impact:** Potential cross-site request forgery attacks.

### 16. JWT Secret is Hardcoded as Fallback
- **File:** `src/lib/jwt.ts` line 3
- **Problem:** `JWT_SECRET` falls back to `"ai-reviewer-super-secret-jwt-key-2026"` if `process.env.JWT_SECRET` is not set. This is a known, public secret.
- **Impact:** Anyone can forge JWT tokens in production if JWT_SECRET env var is not set.
- **Fix:** Require `JWT_SECRET` in production, throw error if missing.

### 17. No Rate Limiting on Login/Signup Attempts
- **Problem:** No brute-force protection on the login or signup forms. An attacker could spam login attempts infinitely.
- **Fix:** Add rate limiting middleware or use a counter per IP.

### 18. `admin_config.json` Missing `aiProvider` and `geminiApiKey` Fields
- **File:** `.storage/admin_config.json`
- **Problem:** The saved config file is missing `aiProvider` and `geminiApiKey` fields, even though `AdminConfig` type defines them. They only appear after an admin saves AI settings.
- **Impact:** First-time admin users see empty AI config fields.
- **Fix:** Include defaults in the JSON file or ensure `getAdminConfig()` merges defaults properly.

---

## MINOR / UX Issues

### 19. Landing Page Upload Dropzone May Submit Without Auth
- **File:** `src/app/page.tsx` - imports `<UploadDropzone />`
- **Problem:** The landing page includes an upload dropzone but users may not be authenticated. If `requireLogin` is true in admin config, uploads will fail silently.
- **Fix:** Show a login prompt instead of the upload dropzone on the landing page for unauthenticated users.

### 20. Analytics Page May Show Empty State Poorly
- **File:** `src/app/analytics/page.tsx`
- **Problem:** If a new user has no documents, the analytics page may show empty charts or errors.
- **Fix:** Add proper empty state UI with a call-to-action to upload first document.

### 21. No Form Validation Feedback on Signup Page
- **Problem:** While Zod validation exists server-side, the client-side forms could benefit from inline field-level validation feedback.

### 22. Mobile Drawer Doesn't Close on Overlay Click
- **File:** `src/components/layout/DashboardShell.tsx` lines 287-340
- **Problem:** The mobile drawer closes on nav item click, but clicking outside (on the overlay) doesn't close it.
- **Fix:** Add `onClick` to the overlay background div.

### 23. Subscription Page Payment is Demo-Only
- **Problem:** All payment gateways (Stripe, Razorpay, PayPal) are demo/test mode. No real payment processing is implemented.
- **Impact:** Users see "Subscribe" buttons but actual payment flow is simulated.

### 24. `.storage/` Directory Contains Sensitive Data
- **Problem:** `.storage/db.json` contains all user data, and `.storage/admin_config.json` contains API keys. Neither is encrypted.
- **Fix:** Add `.storage/` to `.gitignore` and warn in docs.

### 25. No Prisma Schema for Role Field
- **File:** `prisma/` directory
- **Problem:** The User model in Prisma schema likely doesn't have a `role` field - role is derived from email content at runtime.
- **Fix:** Add `role` field to Prisma schema.

### 26. `pdf-parse` Library Known Security Issues
- **File:** `package.json` line 21
- **Problem:** `pdf-parse@1.1.1` has known vulnerabilities and hasn't been updated in years.
- **Fix:** Consider switching to `pdf2json` or `pdfjs-dist`.

---

## What Works Well

- Build compiles successfully with zero TypeScript errors
- LocalStorage guest user generation and sync works correctly
- Admin config read/write works for toggles and rate limits
- File upload with proper MIME type and size validation
- Document processing pipeline (text extraction to AI analysis to results)
- JWT sign/verify with HMAC-SHA256
- Dashboard stats with dynamic quota display from admin config
- Mobile-responsive sidebar with drawer navigation
- Rewrite paragraph with usage tracking and rate limiting
- Beautiful, polished UI with consistent design system

---

## Priority Fix Order

1. **[CRITICAL]** Add proper password hashing and verification
2. **[CRITICAL]** Move admin role to database field (not email-based)
3. **[CRITICAL]** Add Next.js middleware for route protection
4. **[CRITICAL]** Remove hardcoded admin passcode, use env var
5. **[MAJOR]** Fix settings persistence (currently lost on reload)
6. **[MAJOR]** Fix `updateProfileNameAction` local DB save
7. **[MAJOR]** Make sidebar plan description dynamic from admin config
8. **[MAJOR]** Clarify AI provider config precedence
9. **[MODERATE]** Add `.storage/` to .gitignore
10. **[MODERATE]** Add rate limiting to auth endpoints
