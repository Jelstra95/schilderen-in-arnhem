#!/bin/bash
# Install the Keynote/Pages -> PDF watch-folder as a launchd LaunchAgent.
#
# The runtime is COPIED to a stable location under ~/Library/Application Support,
# together with a private copy of the Supabase credentials, so the background
# agent does not depend on this repo checkout (it can be a worktree, on any
# branch, or later removed).
#
# Credentials source (first that exists):
#   1. $KP_ENV_FILE                       (if you set it)
#   2. <this repo>/.env.local
# Override the inbox with KP_INBOX=/some/path ./install.sh
set -euo pipefail

SRC_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SRC_DIR/../.." && pwd)"
LABEL="com.jellevanderidder.keynote-to-pdf"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
APP_DIR="$HOME/Library/Application Support/keynote-to-pdf"

INBOX="${KP_INBOX:-$HOME/CourseInbox}"
PROCESSED="${KP_PROCESSED:-$HOME/CourseInbox Processed}"
FAILED="${KP_FAILED:-$HOME/CourseInbox Failed}"
LOG_DIR="$HOME/Library/Logs/keynote-to-pdf"

# ── Resolve credentials ─────────────────────────────────────────────────────
CRED_SRC=""
if [ -n "${KP_ENV_FILE:-}" ] && [ -f "${KP_ENV_FILE}" ]; then
  CRED_SRC="$KP_ENV_FILE"
elif [ -f "$REPO_ROOT/.env.local" ]; then
  CRED_SRC="$REPO_ROOT/.env.local"
fi

if [ -z "$CRED_SRC" ]; then
  echo "ERROR: could not find Supabase credentials."
  echo "  Looked for \$KP_ENV_FILE and $REPO_ROOT/.env.local"
  echo "  Re-run like: KP_ENV_FILE=/path/to/.env.local ./install.sh"
  exit 1
fi

if ! grep -q "SUPABASE_SERVICE_ROLE_KEY" "$CRED_SRC"; then
  echo "ERROR: $CRED_SRC has no SUPABASE_SERVICE_ROLE_KEY. Aborting."
  exit 1
fi

# ── Stage runtime + creds in the stable location ────────────────────────────
mkdir -p "$APP_DIR" "$INBOX" "$PROCESSED" "$FAILED" "$LOG_DIR" "$HOME/Library/LaunchAgents"
cp "$SRC_DIR/convert-and-upload.mjs" \
   "$SRC_DIR/export-keynote.applescript" \
   "$SRC_DIR/export-pages.applescript" \
   "$SRC_DIR/run.sh" \
   "$APP_DIR/"
chmod +x "$APP_DIR/run.sh"

# Private copy of the credentials the daemon reads (never in git).
cp "$CRED_SRC" "$APP_DIR/.env"
chmod 600 "$APP_DIR/.env"

# ── Write + load the LaunchAgent ────────────────────────────────────────────
cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${APP_DIR}/run.sh</string>
  </array>
  <key>WatchPaths</key>
  <array>
    <string>${INBOX}</string>
  </array>
  <key>StartInterval</key><integer>300</integer>
  <key>RunAtLoad</key><true/>
  <key>StandardOutPath</key><string>${LOG_DIR}/stdout.log</string>
  <key>StandardErrorPath</key><string>${LOG_DIR}/stderr.log</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>KP_INBOX</key><string>${INBOX}</string>
    <key>KP_PROCESSED</key><string>${PROCESSED}</string>
    <key>KP_FAILED</key><string>${FAILED}</string>
    <key>KP_ENV_FILE</key><string>${APP_DIR}/.env</string>
  </dict>
</dict>
</plist>
EOF

plutil -lint "$PLIST"
launchctl unload "$PLIST" 2>/dev/null || true
launchctl load "$PLIST"

echo ""
echo "✅ Installed LaunchAgent: $LABEL"
echo "   Runtime + credentials: $APP_DIR"
echo "   Drop .key / .pages into:         $INBOX"
echo "   Converted originals archived to: $PROCESSED"
echo "   Failures land in:                $FAILED"
echo "   Logs:                            $LOG_DIR/convert.log"
echo ""
echo "First conversion triggers a macOS prompt to allow automation of"
echo "Keynote/Pages — click OK. Then drop a test file into the inbox."
