#!/usr/bin/env bash
# ── Legislative Check Script ─────────────────────────────────────────
# Calls the /api/legislative/check endpoint to compare gov.uk rates
# against constants.ts and log any discrepancies.
#
# Usage:
#   ./scripts/legislative-check.sh
#
# Requires:
#   - CRON_SECRET environment variable set (same as in .env.local)
#   - APP_URL environment variable (defaults to http://localhost:3000)
#
# Exit codes:
#   0 — Check ran successfully, no discrepancies found (or logged successfully)
#   1 — Check ran but discrepancies were found and logged
#   2 — Unauthorized (CRON_SECRET mismatch)
#   3 — Network or unexpected error
# ─────────────────────────────────────────────────────────────────────

set -euo pipefail

APP_URL="${APP_URL:-http://localhost:3000}"
CRON_SECRET="${CRON_SECRET:-}"

if [ -z "$CRON_SECRET" ]; then
  # Try loading from .env.local if available
  ENV_FILE="$(dirname "$0")/../.env.local"
  if [ -f "$ENV_FILE" ]; then
    CRON_SECRET=$(grep -E '^CRON_SECRET=' "$ENV_FILE" | cut -d= -f2-)
  fi
fi

if [ -z "$CRON_SECRET" ]; then
  echo "ERROR: CRON_SECRET is not set and not found in .env.local"
  exit 3
fi

echo "=== Legislative Check: $(date -u '+%Y-%m-%dT%H:%M:%SZ') ==="
echo "Target: ${APP_URL}/api/legislative/check"
echo ""

RESPONSE_FILE="/tmp/legislative-check-response.json"

# Make the request
HTTP_CODE=$(curl -s -o "$RESPONSE_FILE" -w "%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: ${CRON_SECRET}" \
  "${APP_URL}/api/legislative/check" \
  --max-time 30)

echo "HTTP Status: ${HTTP_CODE}"
echo ""

case "${HTTP_CODE}" in
  200)
    echo "Response:"
    if command -v python3 &>/dev/null; then
      python3 -m json.tool "$RESPONSE_FILE" 2>/dev/null || cat "$RESPONSE_FILE"
    else
      cat "$RESPONSE_FILE"
    fi
    echo ""

    # Check if discrepancies were found (newUpdates > 0)
    NEW_UPDATES=$(grep -oP '"newUpdates":\s*\K\d+' "$RESPONSE_FILE" 2>/dev/null || echo "0")

    if [ "$NEW_UPDATES" -gt 0 ]; then
      echo "⚠️  DISCREPANCIES FOUND — new legislative updates logged."
      exit 1
    fi

    echo "✅ All clear — rates match constants.ts"
    exit 0
    ;;
  401)
    echo "ERROR: Unauthorized — CRON_SECRET does not match server."
    [ -f "$RESPONSE_FILE" ] && cat "$RESPONSE_FILE"
    exit 2
    ;;
  500)
    echo "ERROR: Server error."
    [ -f "$RESPONSE_FILE" ] && cat "$RESPONSE_FILE"
    exit 3
    ;;
  *)
    echo "ERROR: Unexpected HTTP status ${HTTP_CODE}"
    exit 3
    ;;
esac