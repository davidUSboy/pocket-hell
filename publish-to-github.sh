#!/usr/bin/env bash
set -euo pipefail

REPO="https://github.com/davidUSboy/pocket-hell.git"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORK="$(mktemp -d -t pocket-hell-v2-XXXXXX)"
trap 'rm -rf "$WORK"' EXIT

command -v git >/dev/null 2>&1 || { echo "Git is not installed or is not in PATH." >&2; exit 1; }

echo "[1/4] Cloning the current repository..."
git clone "$REPO" "$WORK/repo"

echo "[2/4] Copying Pocket Hell v2..."
for item in "$ROOT"/* "$ROOT"/.[!.]* "$ROOT"/..?*; do
  [[ -e "$item" ]] || continue
  name="$(basename "$item")"
  case "$name" in
    .git|publish-to-github.ps1|publish-to-github.sh|PUBLISH.md) continue ;;
  esac
  cp -R "$item" "$WORK/repo/"
done

echo "[3/4] Creating the release commit..."
git -C "$WORK/repo" add --all
if git -C "$WORK/repo" diff --cached --quiet; then
  echo "Repository is already up to date."
  exit 0
fi
git -C "$WORK/repo" commit -m "feat: launch premium Pocket Hell v2"

echo "[4/4] Pushing to GitHub..."
git -C "$WORK/repo" push origin main

echo "Pocket Hell v2 has been pushed successfully."
echo "Live site: https://davidusboy.github.io/pocket-hell/"
