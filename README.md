# Schilderen in Arnhem

A conversion-focused course platform for painting courses in Arnhem, built to
match the minimalist look of [jellevanderidder.com](https://www.jellevanderidder.com).

It has three parts:

- **Public site** — a landing page and an enrollment flow with an availability
  calendar.
- **Participant area** — sign in to view your enrollment, cancel it, and view
  protected course materials (PDFs/slides) that cannot be downloaded directly.
- **Admin area** — manage course dates and capacity, confirm paid enrollments
  (which creates the participant's account), and upload course materials.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4** (no UI framework)
- **Supabase** — Postgres, Auth, and private Storage
- Fonts: **Avenir Light** (titles) + **Fraunces** (body), self-hosted
- Deploys to **Vercel**

## Getting started

### 1. Install

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in the values from your Supabase
project (Project Settings → API):

```bash
cp .env.example .env.local
```

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret.** Server-only. Never commit or expose to the client. |
| `SUPABASE_MATERIALS_BUCKET` | Storage bucket name (default `course-materials`) |

### 3. Apply the database migration

Open the Supabase **SQL editor** and run the contents of
[`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql). This
creates the tables, RLS policies, the `reserve_spot()` function, the
availability view, the auth trigger, and the private `course-materials` bucket.

### 4. Create the admin account

1. Create a user (Supabase → Authentication → Add user, or sign up via the app).
2. Promote it to admin in the SQL editor:

   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```

### 5. Run

```bash
npm run dev      # http://localhost:3000
npm run build    # production build
npm run typecheck
```

## How it works

### Enrollment & availability

- The public calendar reads `course_dates_availability`, a view that exposes
  only aggregate counts — never enrollment PII.
- Submitting the form calls the `reserve_spot()` Postgres function, which locks
  the date row, checks capacity, and inserts a `pending` enrollment in one
  transaction — so a date can never be overbooked.
- Cancelling sets the enrollment to `cancelled`, which frees the spot
  automatically (the view counts only `pending`/`confirmed`).

### Accounts kept in your control

There is no public self-service signup. A visitor's enrollment stays `pending`
until you (admin) confirm it on the **Deelnemers** page — typically once payment
has arrived. Confirming creates the participant's Supabase account and shows a
one-time temporary password to share. Only confirmed participants can see
materials.

### Protected materials

- Files live in a **private** Storage bucket — no public URLs.
- `GET /api/materials/[id]/stream` authorizes the request with the user's own
  session (RLS only returns a material to an admin or a confirmed participant of
  the relevant date), then proxies the bytes from a short-lived signed URL
  (never exposed to the browser) with `Content-Disposition: inline` and Range
  support.
- PDFs render to canvas via `pdf.js`; there are no download or print buttons.

> **Note on protection:** controlled, authorized, in-app viewing strongly
> discourages casual downloading and sharing, but anything rendered in a browser
> can ultimately be captured client-side. This is not hard DRM.

## Deploy to Vercel

1. Import the repo in Vercel.
2. Add the four environment variables (above) in Project Settings → Environment
   Variables. Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only.
3. Deploy. Route handlers run as serverless functions automatically.

## Project structure

```
src/
  app/
    (public)/        landing, inschrijven, bedankt
    (participant)/   dashboard, materiaal/[id]
    (admin)/         admin: data, deelnemers, materiaal
    login/
    api/             enrollments, admin/*, materials/[id]/stream
  components/        UI primitives, calendar, viewers, managers
  lib/               supabase clients, auth, availability, formatting
  proxy.ts           session refresh + role-based route protection
supabase/migrations/ 0001_init.sql
```

## Future extensions

The seams are in place for **payments** (a webhook can auto-confirm an
enrollment and create the account — the same step the admin does manually) and
**email notifications** (e.g. sending credentials instead of showing a temporary
password). Neither requires schema changes.
