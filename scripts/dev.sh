#!/bin/bash
# One-command dev launcher for arxify.io
#
# Starts: FastAPI (port 8000) + Next.js (port 3000) in parallel.
# Requires: ANTHROPIC_API_KEY (and optional ANTHROPIC_BASE_URL).
#
# Usage:  bash scripts/dev.sh
# Stop:   Ctrl-C kills both

set -e
cd "$(dirname "$0")/.."
ROOT="$PWD"

if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
  if [ -f "$ROOT/api/.env" ]; then
    export $(grep -v '^#' "$ROOT/api/.env" | xargs -0 2>/dev/null || true)
  fi
fi
if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
  echo "❌ ANTHROPIC_API_KEY not set. Put it in api/.env or export it."
  exit 1
fi

# Default to local dev origin if not set
export WEB_ORIGIN="${WEB_ORIGIN:-http://localhost:3000}"
export ARXIFY_DEV_USER="${ARXIFY_DEV_USER:-hunter@arxify.io}"
export ARXIFY_INLINE_JOBS="${ARXIFY_INLINE_JOBS:-1}"

echo "Starting FastAPI (port 8000)..."
"$ROOT/api/venv/bin/uvicorn" api.main:app --reload --port 8000 --host 127.0.0.1 &
API_PID=$!
echo "  api pid: $API_PID"

echo "Starting Next.js (port 3000)..."
(cd "$ROOT/web" && NEXT_PUBLIC_API_URL=http://127.0.0.1:8000 bun run dev) &
WEB_PID=$!
echo "  web pid: $WEB_PID"

trap 'kill $API_PID $WEB_PID 2>/dev/null; exit' INT TERM

echo ""
echo "▶ http://127.0.0.1:3000           landing"
echo "▶ http://127.0.0.1:3000/try        live ideation demo"
echo "▶ http://127.0.0.1:3000/showcase   marketing showcase (filled state)"
echo "▶ http://127.0.0.1:3000/pricing    pricing"
echo "▶ http://127.0.0.1:3000/signup     waitlist"
echo "▶ http://127.0.0.1:8000/docs       API swagger"
echo ""
echo "Ctrl-C to stop both."
wait
