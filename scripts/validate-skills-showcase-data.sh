#!/usr/bin/env bash
set -euo pipefail

# Validates that committed Skills Showcase imported assets are fresh.
# Usage: scripts/validate-skills-showcase-data.sh

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

IMPORTER="scripts/import-skills-catalog.mjs"

GENERATED_ASSETS=(
  "public/assets/skills-data.js"
  "public/assets/github-proof-data.js"
  "public/assets/skills-catalog/v1/catalog.json"
  "public/assets/skills-catalog/v1/proof.json"
  "public/assets/skills-catalog/v1/manifest.json"
  "public/assets/skills-catalog/v1/import-source.json"
)

cd "$REPO_ROOT"

fingerprint_assets() {
  for asset in "${GENERATED_ASSETS[@]}"; do
    if [[ -f "$asset" ]]; then
      printf '%s  %s\n' "$(git hash-object "$asset")" "$asset"
    else
      echo "MISSING  $asset"
    fi
  done
}

BEFORE="$(fingerprint_assets)"

node "$IMPORTER"

AFTER="$(fingerprint_assets)"

if [[ "$BEFORE" != "$AFTER" ]]; then
  echo "Skills Showcase imported data is stale."
  echo
  echo "Regenerated asset status:"
  git status --short -- "${GENERATED_ASSETS[@]}"
  echo
  echo "Run this command and commit the updated imported assets:"
  echo "  node $IMPORTER"
  exit 1
fi

echo "Skills Showcase imported data is fresh."
