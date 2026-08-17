#!/usr/bin/env bash
# Validates docs/dev/system-feature-registry.md — all in-scope features ☑ for Staging.
# Also validates docs/dev/staging-certification.md §2 gate rows (SC-G*, SC-S*).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FEATURE_REGISTRY="$ROOT/docs/dev/system-feature-registry.md"
STAGING_MANIFEST="$ROOT/docs/dev/staging-certification.md"

fail=0

check_progress_column() {
  local file="$1"
  local label="$2"
  local incomplete
  incomplete="$(awk '
    /^\| \*\*(F-[MCSA]-|SC-FX-|SC-G|SC-S)/ {
      n = split($0, a, "|")
      if (n >= 2) {
        progress = a[n-1]
        gsub(/^[ \t]+|[ \t]+$/, "", progress)
        if (progress == "☐" || progress == "◐") print $0
      }
    }
  ' "$file" || true)"

  if [[ -n "$incomplete" ]]; then
    echo "=== $label INCOMPLETE ==="
    echo "$incomplete"
    echo ""
    fail=1
  fi
}

if [[ ! -f "$FEATURE_REGISTRY" ]]; then
  echo "Missing $FEATURE_REGISTRY" >&2
  exit 1
fi

check_progress_column "$FEATURE_REGISTRY" "System Feature Registry (Member/Merchant/Admin/System)"

if [[ -f "$STAGING_MANIFEST" ]]; then
  check_progress_column "$STAGING_MANIFEST" "Staging gate rows (SC-G / SC-S in staging-certification §2.1/2.6)"
fi

if [[ "$fail" -ne 0 ]]; then
  echo "Fix: complete tests/CI, update 進度 to ☑ in system-feature-registry.md"
  echo "See docs/dev/system-feature-registry.md §5 SC-FX-ALL"
  exit 1
fi

echo "=== Staging checklist: all in-scope features ☑ ==="
exit 0
