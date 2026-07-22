#!/bin/bash
# Install the Keynote/Pages -> PDF watch-folder as a launchd LaunchAgent.
# Run this from a PERMANENT clone of the repo (e.g. ~/Documents/SchilderenInArnhem),
# not a temporary worktree — the agent points at this folder's location.
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$DIR/../.." && pwd)"
LABEL="com.jellevanderidder.keynote-to-pdf"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"

INBOX="${KP_INBOX:-$HOME/CourseInbox}"
PROCESSED="${KP_PROCESSED:-$HOME/CourseInbox Processed}"
FAILED="${KP_FAILED:-$HOME/CourseInbox Failed}"
LOG_DIR="$HOME/Library/Logs/keynote-to-pdf"

mkdir -p "$INBOX" "$PROCESSED" "$FAILED" "$LOG_DIR" "$HOME/Library/LaunchAgents"
chmod +x "$DIR/run.sh"

# Warn early if credentials are not reachable.
if [ ! -f "$REPO_ROOT/.env.local" ] && [ -z "${KP_ENV_FILE:-}" ]; then
  echo "WARNING: $REPO_ROOT/.env.local not found."
  echo "         The worker needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY."
  echo "         Either add that file, or re-run with KP_ENV_FILE=/path/to/env"
fi

# Optional: bake an explicit env-file path into the agent.
ENV_ENTRY=""
if [ -n "${KP_ENV_FILE:-}" ]; then
  ENV_ENTRY="    <key>KP_ENV_FILE</key><string>${KP_ENV_FILE}</string>"
fi

cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${DIR}/run.sh</string>
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
${ENV_ENTRY}
  </dict>
</dict>
</plist>
EOF

# Validate the generated plist, then (re)load it.
plutil -lint "$PLIST"
launchctl unload "$PLIST" 2>/dev/null || true
launchctl load "$PLIST"

echo ""
echo "✅ Installed LaunchAgent: $LABEL"
echo "   Drop .key / .pages files into:  $INBOX"
echo "   Converted originals archived to: $PROCESSED"
echo "   Failures land in:                $FAILED"
echo "   Logs:                            $LOG_DIR/convert.log"
echo ""
echo "First run will trigger a macOS prompt to allow automation of"
echo "Keynote/Pages — click OK. Then drop a test file into the inbox."
