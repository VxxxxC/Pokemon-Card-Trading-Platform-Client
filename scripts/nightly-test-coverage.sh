#!/usr/bin/env bash
# Phase 1 nightly test coverage — serial L2 → L1 → L3 on staging fixtures.
# SSOT: docs/dev/test-coverage-ssot.md §8
#
# Prerequisites: Supabase + E2E_* in .env.local or CI secrets (see check-nightly-env.sh).
# Does NOT require Stripe webhook listen or merchant-grading verify.
#
# Usage: bun run test:nightly:coverage
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ -f .env.local ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

export PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-http://localhost:3000}"
export PRODUCTION_GATE=1

SERVER_PID=""
failed=0

cleanup() {
  if [[ -n "$SERVER_PID" ]]; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

run_step() {
  local name="$1"
  shift
  echo ""
  echo "=== $(date '+%H:%M:%S') $name ==="
  if "$@"; then
    echo ">>> PASS: $name"
  else
    echo ">>> FAIL: $name"
    failed=1
  fi
}

wait_for_http() {
  local url="$1"
  local attempts="${2:-90}"
  for _ in $(seq 1 "$attempts"); do
    if curl -m 3 -s -o /dev/null -w "%{http_code}" "$url" | grep -qE '^[23]'; then
      return 0
    fi
    sleep 2
  done
  return 1
}

start_production_server() {
  local pid_on_port
  pid_on_port="$(lsof -t -i:3000 2>/dev/null || true)"
  if [[ -n "$pid_on_port" ]]; then
    echo "Stopping existing process on :3000 (pid $pid_on_port)"
    kill "$pid_on_port" 2>/dev/null || true
    sleep 2
  fi

  echo ">> bun run build (production bundle for E2E)"
  bun run build

  bun run start &
  SERVER_PID=$!
  export PLAYWRIGHT_SKIP_WEBSERVER=1

  if ! wait_for_http "$PLAYWRIGHT_BASE_URL/"; then
    echo "Production server did not become ready at $PLAYWRIGHT_BASE_URL" >&2
    return 1
  fi
  echo "Production server ready (pid $SERVER_PID)"
}

echo "=== Nightly test coverage START $(date '+%Y-%m-%d %H:%M:%S') ==="

run_step "check-nightly-env" bash scripts/check-nightly-env.sh
if [[ "$failed" -ne 0 ]]; then exit 1; fi

run_step "L2 platform integration" bun run test:integration:platform
if [[ "$failed" -ne 0 ]]; then exit 1; fi

run_step "start production server for E2E" start_production_server
if [[ "$failed" -ne 0 ]]; then exit 1; fi

run_step "L1 P2 E2E (TC-E01–E03)" bun run test:e2e:nightly:p2
if [[ "$failed" -ne 0 ]]; then exit 1; fi

run_step "L3a matrix E2E (TC-P05)" env REWARDS_GATE=1 bun run test:e2e:nightly:matrix
if [[ "$failed" -ne 0 ]]; then exit 1; fi

run_step "L3b rewards matrix integration (TC-N05)" bun run test:integration:rewards-matrix
if [[ "$failed" -ne 0 ]]; then exit 1; fi

echo ""
if [[ "$failed" -eq 0 ]]; then
  echo "=== Nightly test coverage PASS $(date '+%Y-%m-%d %H:%M:%S') ==="
else
  echo "=== Nightly test coverage FAIL $(date '+%Y-%m-%d %H:%M:%S') ==="
  exit 1
fi
