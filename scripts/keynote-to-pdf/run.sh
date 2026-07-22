#!/bin/bash
# launchd entry point: locate a Node runtime, then run the worker.
# launchd starts with a minimal PATH, so we probe common install locations.
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"

NODE=""
for candidate in \
  "$HOME/.nvm/versions/node/"*/bin/node \
  "/opt/homebrew/bin/node" \
  "/usr/local/bin/node" \
  "$(command -v node 2>/dev/null || true)"; do
  if [ -n "$candidate" ] && [ -x "$candidate" ]; then
    NODE="$candidate"
    break
  fi
done

if [ -z "$NODE" ]; then
  echo "keynote-to-pdf: could not find a node executable" >&2
  exit 127
fi

exec "$NODE" "$DIR/convert-and-upload.mjs" "$@"
