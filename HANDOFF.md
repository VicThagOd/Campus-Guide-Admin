# Campus Guide Admin: Handoff Brief

You are working on the **Campus Guide Admin** app at `C:\Users\ASUS\Devjects\Campus Guide Admin` (Vite + React + TypeScript + Supabase). This is the content/payments control panel for the Campus Guide UNIPORT ecosystem. The student-facing app lives at `C:\Users\ASUS\Devjects\Campus Guide PU` (read-only for you, but useful to check how content is rendered).

## Product context

Campus Guide is a private, auth-gated UNIPORT campus ecosystem: post-UTME practice, aspirant hub, freshers hub, accommodation, events, verified updates, important dates, and "Ask Campus Guide" questions. The student app only READS content; the admin app WRITES it. Content the student app displays comes from Supabase tables listed below. Admin development was intentionally deferred; this sprint builds the content management side.

## Existing admin functionality (keep working)

- `src/pages/AdminLogin.tsx` - admin auth entry
- `src/pages/DashboardPage.tsx` - main dashboard shell
- `src/pages/ReceiptCard.tsx`, `src/pages/ReceiptPreview.tsx` - payment receipt review flow: students upload Flutterwave payment receipts, admins approve/reject them, and approval grants `user_access` (cbt_access / pdf_access) plus unlock codes. Do not break this flow.

## Supabase tables you manage (all already migrated)

- `accommodations`: id, title, description, price (NUMERIC), location, distance_from_school, room_type, amenities (TEXT[]), contact_info, verified (BOOLEAN, feature is CUT, ignore it), image_urls (TEXT[] NOT NULL DEFAULT '{}'), video_url (TEXT), created_at. The student app renders `image_urls[0]` as a card photo and a gallery/video player on the detail page, so admin must be able to add photo/video URLs.
- `events`: id, title, description, event_date (TIMESTAMPTZ), location, ticket_url, created_at.
- `updates`: id, title, summary, body, category (default 'general'), audience (default 'everyone'), source, deadline (TIMESTAMPTZ), published_at (TIMESTAMPTZ), created_at. Student app chips: category colors per value and audience chip, plus deadline and source display. Keep values consistent with the student UI.
- `important_dates`: id, title, category (default 'other'), event_date (DATE, NOT NULL), note, created_at. Student app splits upcoming vs past, shows month/day blocks.
- `ask_questions`: id, user_id (uuid, may be null), name, email, category, question, status (default 'open'), answer, created_at. RLS: logged-in users insert and see only their own. Admin must list ALL questions and answer them (set status to 'answered' + fill answer).
- `profiles`: id, username, name, course, email, email_opt_in (BOOLEAN default false), last_login_at. `email_opt_in = true` means the user agreed to receive Campus Guide emails at signup.
- `newsletter_subscribers`: email (UNIQUE), created_at.
- `reviews`: id, user_id, name, course, rating (1-5), review, created_at. The student landing page no longer shows a reviews section (review form was removed from the practice hub), so leave this table alone for now.
- `processed_webhooks`: Flutterwave webhook dedupe, part of the existing payment flow, leave alone.

## RLS notes

All content tables have `FOR SELECT USING (true)` for the public, and `ask_questions` only allows `INSERT` for logged-in users. The admin app needs full write access: use the Supabase service-role key server-side or add an admin role/policies. Do not weaken the student app's public-read policies.

## What to build (priority order)

1. **Content dashboards** - one section per table with a list (latest first) and a create/edit/delete form:
   - Updates (category values seen in the app: post-utme, admission, clearance, general; audience: aspirants/freshers/students/everyone; fields: title, summary, body, category, audience, source, deadline, published_at)
   - Important dates (category values: jamb, post-utme, screening, admission, registration, other; fields: title, category, event_date, note)
   - Accommodations (fields: title, description, price, location, distance_from_school, room_type, amenities list, contact_info, image_urls list, video_url; paste an image URL to add to the list)
   - Events (fields: title, description, event_date, location, ticket_url)
2. **Ask Campus Guide moderation** - list all questions (open first), show name/email/category/question, answer form that sets `answer` and `status = 'answered'`.
3. **Email list** - a page showing users who opted in: profiles where `email_opt_in = true` (show username, name, email, course, created_at) plus newsletter_subscribers. Export to CSV. Note in the UI: actual email sending will go through SendByte later, admin only sees the list for now.
4. **Freshers hub content** - the student app's FreshersHub is a static config for now; make the stages/checklists editable from admin when convenient (no schema exists yet; propose one, e.g., a `fresher_stages` table, and add a migration in the STUDENT repo's `supabase/migrations` folder with a matching timestamp prefix like `20260819_...`).

## Design

Match the main site tokens (inline styles, no config colors): PRIMARY `#2F4EA2`, ACCENT `#F5B942` (badges/CTA only), INK `#111827`, MUTED `#6B7280`, BORDER `#BFC3C6`, SECTION_BG `#F7F8FA`, success `#16A34A`, error `#DC2626`. Sora font via @fontsource/sora if already installed, otherwise keep default. No animations beyond 150-200ms transitions. Keep the existing admin shell/navigation structure you already have.

## Rules

- Do not touch payment/receipt/unlock-code logic.
- Do not edit files in `C:\Users\ASUS\Devjects\Campus Guide PU\src` (student app). Any needed schema changes go in a new migration file there, and mention it in your summary.
- Verify with `npx tsc --noEmit` and `npm run build` at the end.
- Report: what you built, the migration file you added (if any), and anything you could not complete.
