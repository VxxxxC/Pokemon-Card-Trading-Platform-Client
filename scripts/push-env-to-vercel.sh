#!/usr/bin/env bash
# Push app runtime env vars from .env to Vercel (development + preview + production).
# Skips VERCEL_* (CLI) and E2E_* (local Playwright / gate scripts only).
#
# Usage:
#   bun run vercel:env:push
#   bun run vercel:env:push -- --dry-run
#
# Prerequisites:
#   bunx vercel login
#   bunx vercel link
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ROOT}/.env"
TARGET_ENVS="development,preview,production"
DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    *)
      echo "Unknown option: $1" >&2
      echo "Usage: bash scripts/push-env-to-vercel.sh [--dry-run]" >&2
      exit 2
      ;;
  esac
done

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE — create it before running this script." >&2
  exit 1
fi

if [[ ! -f "${ROOT}/.vercel/project.json" ]]; then
  echo "Vercel project not linked — run: bunx vercel link" >&2
  exit 1
fi

should_skip_key() {
  local key="$1"
  [[ "$key" == VERCEL_* || "$key" == E2E_* ]]
}

is_public_env_key() {
  local key="$1"
  [[ "$key" == NEXT_PUBLIC_* || "$key" == "ALLOWED_DEV_ORIGINS" ]]
}

strip_quotes() {
  local value="$1"
  if [[ "$value" == \"*\" && "$value" == *\" ]]; then
    value="${value#\"}"
    value="${value%\"}"
  elif [[ "$value" == \'*\' && "$value" == *\' ]]; then
    value="${value#\'}"
    value="${value%\'}"
  fi
  printf '%s' "$value"
}

added=0
skipped=0
failed=0
to_push=0

echo "=== Vercel env push from .env ==="
echo "Target environments: $TARGET_ENVS"
if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "Mode: dry-run (no changes)"
fi
echo ""

while IFS= read -r line || [[ -n "$line" ]]; do
  # Trim leading/trailing whitespace
  line="${line#"${line%%[![:space:]]*}"}"
  line="${line%"${line##*[![:space:]]}"}"

  [[ -z "$line" || "$line" == \#* ]] && continue

  key="${line%%=*}"
  value="${line#*=}"

  if [[ -z "$key" || "$key" == "$line" ]]; then
    echo "SKIP invalid line (no '='): ${line%% *}..." >&2
    skipped=$((skipped + 1))
    continue
  fi

  if should_skip_key "$key"; then
    echo "SKIP $key (local-only prefix)"
    skipped=$((skipped + 1))
    continue
  fi

  value="$(strip_quotes "$value")"
  to_push=$((to_push + 1))

  if [[ "$DRY_RUN" -eq 1 ]]; then
    if is_public_env_key "$key"; then
      echo "PUSH $key (public)"
    else
      echo "PUSH $key (sensitive)"
    fi
    added=$((added + 1))
    continue
  fi

  echo "ADD $key ..."
  add_args=(env add "$key" "$TARGET_ENVS" --force --yes)
  if [[ "$key" == NEXT_PUBLIC_* ]]; then
    add_args+=(--type config --value "$value")
  elif is_public_env_key "$key"; then
    add_args+=(--value "$value")
  else
    add_args+=(--sensitive --value "$value")
  fi

  # Prevent vercel CLI from consuming the .env file still open on stdin for the while-loop.
  if bunx vercel "${add_args[@]}" < /dev/null; then
    added=$((added + 1))
  else
    echo "FAIL $key" >&2
    failed=$((failed + 1))
  fi
done < "$ENV_FILE"

echo ""
echo "=== Summary ==="
echo "Keys to push: $to_push"
echo "Added/listed: $added"
echo "Skipped:      $skipped"
echo "Failed:       $failed"

if [[ "$DRY_RUN" -eq 0 ]]; then
  echo ""
  echo "MVP notes:"
  echo "  - NEXT_PUBLIC_SITE_URL may still point at localhost; update in Vercel when you have a real URL."
  echo "  - STRIPE_WEBHOOK_SECRET from stripe listen is local-only; create a cloud webhook in Stripe Dashboard for deploys."
fi

if [[ "$failed" -gt 0 ]]; then
  exit 1
fi

if [[ "$to_push" -eq 0 ]]; then
  echo "No keys to push — check .env contents." >&2
  exit 1
fi
