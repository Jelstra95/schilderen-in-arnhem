#!/bin/bash
# Remove the Keynote/Pages -> PDF LaunchAgent. Leaves your inbox folders alone.
set -euo pipefail

LABEL="com.jellevanderidder.keynote-to-pdf"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"

if [ -f "$PLIST" ]; then
  launchctl unload "$PLIST" 2>/dev/null || true
  rm -f "$PLIST"
  echo "Removed LaunchAgent: $LABEL"
else
  echo "Not installed (no plist at $PLIST)"
fi
