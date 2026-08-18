#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "=== Partner regression E2E START $(date '+%Y-%m-%d %H:%M:%S') ==="
bun run test:e2e:partner
echo "=== Partner regression E2E PASS $(date '+%Y-%m-%d %H:%M:%S') ==="
