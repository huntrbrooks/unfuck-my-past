#!/usr/bin/env bash
set -e

# Usage: ./scripts/commit_push.sh "feat: new onboarding flow"
# This assumes your repo is already cloned and you are inside it.
# Cursor tip: open the repo folder, copy the /src/onboarding and /docs/ONBOARDING_SPEC.md files in, then run.
# Vercel auto deploys on push if your project is connected.

MSG="${1:-feat: onboarding flow update}"

git add docs/ONBOARDING_SPEC.md src/onboarding
git commit -m "$MSG"
git push origin HEAD

echo "Pushed. If Vercel is connected, it will build and deploy."
