#!/usr/bin/env bash
# Lightweight env check for nightly test coverage (L1/L2/L3).
# Does NOT run verify:merchant-grading-e2e (unlike prelaunch-check-env.sh).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

missing=()

check_set() {
  local key="$1"
  if [[ -z "${!key:-}" ]]; then
    missing+=("$key")
  fi
}

if [[ -f .env.local ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

check_set NEXT_PUBLIC_SUPABASE_URL
check_set NEXT_PUBLIC_SUPABASE_ANON_KEY
check_set SUPABASE_SERVICE_ROLE_KEY
check_set E2E_ADMIN_EMAIL
check_set E2E_ADMIN_PASSWORD
check_set E2E_BUYER_EMAIL
check_set E2E_BUYER_PASSWORD
check_set E2E_SELLER_EMAIL
check_set E2E_SELLER_PASSWORD
check_set E2E_SELLER_ID
check_set E2E_LISTING_ID

if [[ ${#missing[@]} -gt 0 ]]; then
  echo "=== Nightly env check: FAILED ===" >&2
  echo "Missing required variables:" >&2
  for key in "${missing[@]}"; do
    echo "  - $key" >&2
  done
  echo "" >&2
  echo "See docs/dev/test-coverage-ssot.md §8 (Nightly CI)." >&2
  exit 1
fi

echo "=== Nightly env check: OK ==="
