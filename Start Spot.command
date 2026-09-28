#!/bin/bash
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo "Install Node.js 22.16.0 or newer from nodejs.org, then open this file again."
  read -r -p "Press Return to close."; exit 1
fi
node scripts/start.mjs
status=$?
if [ "$status" -ne 0 ]; then read -r -p "Setup stopped. Press Return to close."; fi
exit "$status"
