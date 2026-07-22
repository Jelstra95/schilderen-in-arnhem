#!/bin/bash
# Remove the Keynote/Pages -> PDF LaunchAgent and its staged runtime + creds.
# Leaves your inbox / processed / failed folders alone.
set -euo pipefail

LABEL="com.jellevanderidder.keynote-to-pdf"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
APP_DIR="$HOME/Library/Application Support/keynote-to-pdf"

if [ -f "$PLIST" ]; then
  launchctl unload "$PLIST" 2>/dev/null || true
  rm -f "$PLIST"
  echo "Removed LaunchAgent: $LABEL"
else
  echo "No LaunchAgent at $PLIST"
fi

if [ -d "$APP_DIR" ]; then
  rm -rf "$APP_DIR"
  echo "Removed staged runtime + credentials: $APP_DIR"
fi
