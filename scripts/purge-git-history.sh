#!/usr/bin/env bash
# Purge one or more files from the ENTIRE git history (not just HEAD).
# A plain `git rm` + commit only removes a file going forward — the old
# blobs stay reachable from every earlier commit and are still fetchable
# from the remote. This rewrites every commit, drops the filter-branch
# backup refs, and expires the reflog so git actually forgets the blobs.
#
# Usage: scripts/purge-git-history.sh <path> [<path> ...]
#
# This script does NOT push. Rewriting history changes every commit SHA
# on the branch, so the remote will diverge — review the output, then
# force-push yourself once you're sure:
#   git push --force origin <branch>
#
# Note: GitHub (or any remote) may keep serving the OLD commit SHAs via
# raw-content URLs for a while after a force-push, until its own garbage
# collector runs on now-unreachable objects. That's expected, not a sign
# this script failed — verify locally with the commands this script prints
# at the end, not by checking the remote immediately.
set -euo pipefail

if [ "$#" -eq 0 ]; then
  echo "Usage: $0 <path> [<path> ...]" >&2
  exit 1
fi

root="$(git rev-parse --show-toplevel)"
cd "$root"

if [ -n "$(git status --porcelain)" ]; then
  echo "Working tree is not clean. Commit or stash your changes first." >&2
  exit 1
fi

branch="$(git rev-parse --abbrev-ref HEAD)"
echo "Rewriting history on branch '$branch' to remove: $*"
echo

rm_cmd="git rm --cached --ignore-unmatch"
for f in "$@"; do
  rm_cmd="$rm_cmd \"$f\""
done

FILTER_BRANCH_SQUELCH_WARNING=1 git filter-branch --force \
  --index-filter "$rm_cmd" \
  --prune-empty -- --all

echo
echo "Dropping filter-branch backup refs and expiring reflog..."
git for-each-ref --format='%(refname)' refs/original/ | while read -r ref; do
  git update-ref -d "$ref"
done
rm -rf "$root/.git/refs/original"
git reflog expire --expire=now --all
git gc --prune=now --aggressive >/dev/null

echo
echo "Verifying the files are gone from all local history..."
pattern=""
for f in "$@"; do
  if [ -z "$pattern" ]; then pattern="$f"; else pattern="$pattern|$f"; fi
done
remaining="$(git rev-list --objects --all | grep -E "$pattern" || true)"
if [ -n "$remaining" ]; then
  echo "WARNING: still found in local history:" >&2
  echo "$remaining" >&2
  exit 1
fi
echo "Confirmed: no longer present in any local commit."

echo
echo "Local history rewritten. Next steps (not automated — confirm first):"
echo "  1. Make sure whoever owns this decision is fine with a force-push —"
echo "     every existing clone/fork will diverge from the new history."
echo "  2. git push --force origin $branch"
echo "  3. Anyone with an existing clone should re-clone or hard-reset to the new history."
echo "  4. Old commit SHAs may still resolve on the remote (e.g. raw.githubusercontent.com/<old-sha>/<path>)"
echo "     until the remote's own garbage collection runs. That's expected, not a failure of this script."
