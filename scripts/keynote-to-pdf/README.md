# Keynote / Pages → PDF auto-upload

A local macOS watch-folder. Drop a `.key` (Keynote) or `.pages` (Pages)
document into an inbox folder and it is automatically:

1. converted to PDF by the **real Keynote/Pages apps** (highest fidelity), then
2. uploaded straight into the course platform — it appears under **Materiaal**
   as general material for all participants, exactly as if you'd used the admin
   upload form.

It talks to Supabase directly with the service-role key, mirroring
`POST /api/admin/materials`. **No changes to the deployed (Vercel) app are
needed** — Vercel can't run Apple software, so conversion happens here on your
Mac.

## Why local

Keynote and Pages are Apple-only formats. Reliable, high-fidelity conversion
needs the actual apps, which are installed on your Mac. The trade-off: your Mac
must be on (and logged in) when you drop files in. Nothing leaves your machine
except the finished PDF going to your own Supabase.

## Requirements

- macOS with **Keynote** and **Pages** installed
- **Node.js** (already used by this project)
- The repo's `.env.local` present with `NEXT_PUBLIC_SUPABASE_URL` and
  `SUPABASE_SERVICE_ROLE_KEY` (same values the app uses)

## Install

Run from a **permanent** clone of the repo (e.g.
`~/Documents/SchilderenInArnhem`), not a throwaway worktree — the background
agent points at wherever you run this from:

```bash
cd ~/Documents/SchilderenInArnhem
npm install                       # ensures node_modules is present
./scripts/keynote-to-pdf/install.sh
```

This creates the folders, installs a launchd LaunchAgent, and starts watching.

- **Inbox** (drop files here): `~/CourseInbox`
- **Processed** (original + a copy of the PDF): `~/CourseInbox Processed`
- **Failed** (original + `.error.txt`): `~/CourseInbox Failed`
- **Logs**: `~/Library/Logs/keynote-to-pdf/convert.log`

### One-time macOS permission

The first conversion triggers a prompt: *"…wants to control Keynote/Pages."*
Click **OK**. If you miss it, approve it later under **System Settings →
Privacy & Security → Automation**. Without this, exports fail and files land in
the Failed folder.

## Use

Just drag a `.key` or `.pages` file into `~/CourseInbox`. Within a few seconds
it converts, uploads, and the original is moved to the Processed folder. Watch
it happen:

```bash
tail -f ~/Library/Logs/keynote-to-pdf/convert.log
```

## Custom folders

Override the defaults at install time:

```bash
KP_INBOX="$HOME/Desktop/Lesmateriaal" ./scripts/keynote-to-pdf/install.sh
```

If your credentials live somewhere other than the repo's `.env.local`:

```bash
KP_ENV_FILE="$HOME/secrets/schilderen.env" ./scripts/keynote-to-pdf/install.sh
```

## Uninstall

```bash
./scripts/keynote-to-pdf/uninstall.sh
```

Your folders and any files in them are left untouched.

## Notes & limits

- **All uploads are "algemeen"** (visible to every participant). Targeting a
  specific course date isn't supported from the folder; use the admin web form
  for that. (Easy to extend later via per-course-date subfolders.)
- **Title** = the file name without extension (e.g. `Lesbrief week 1.key` →
  "Lesbrief week 1").
- The worker is single-instance (lock file) and only picks up files that have
  finished copying (size/mtime settled), so partial copies aren't uploaded.
- Conversion uses Keynote/Pages' default PDF export. To tune image quality,
  edit `export-keynote.applescript` / `export-pages.applescript`.
