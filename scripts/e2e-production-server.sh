#!/usr/bin/env bash
# Shared production Next.js server lifecycle for Playwright E2E (nightly / staging certify).
set -euo pipefail

E2E_SERVER_PID_FILE="${E2E_SERVER_PID_FILE:-/tmp/hkcv-e2e-prod-server.pid}"
E2E_SERVER_SKIP_BUILD="${E2E_SERVER_SKIP_BUILD:-0}"

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

e2e_stop_production_server() {
  local pid=""
  if [[ -f "$E2E_SERVER_PID_FILE" ]]; then
    pid="$(cat "$E2E_SERVER_PID_FILE" 2>/dev/null || true)"
    rm -f "$E2E_SERVER_PID_FILE"
  fi
  if [[ -n "$pid" ]]; then
    kill "$pid" 2>/dev/null || true
    wait "$pid" 2>/dev/null || true
  fi

  local pid_on_port
  pid_on_port="$(lsof -t -i:3000 2>/dev/null || true)"
  if [[ -n "$pid_on_port" ]]; then
    kill "$pid_on_port" 2>/dev/null || true
    sleep 1
  fi
}

e2e_start_production_server() {
  local base_url="${PLAYWRIGHT_BASE_URL:-http://localhost:3000}"

  e2e_stop_production_server

  if [[ "$E2E_SERVER_SKIP_BUILD" != "1" ]]; then
    echo ">> bun run build (production bundle for E2E)"
    bun run build
  else
    echo ">> skipping build (E2E_SERVER_SKIP_BUILD=1)"
  fi

  bun run start &
  local server_pid=$!
  echo "$server_pid" >"$E2E_SERVER_PID_FILE"
  export PLAYWRIGHT_SKIP_WEBSERVER=1

  if ! wait_for_http "$base_url/"; then
    echo "Production server did not become ready at $base_url" >&2
    e2e_stop_production_server
    return 1
  fi

  echo "Production server ready (pid $server_pid) at $base_url"
}
