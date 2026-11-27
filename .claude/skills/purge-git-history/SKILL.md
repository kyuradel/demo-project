---
name: purge-git-history
description: Use when the user wants a file permanently gone from GitHub/git — not just removed going forward, but erased from every past commit (e.g. "히스토리에서 완전히 지워줘", "과거 커밋에서도 제거해줘", "깃허브 캐시에 남은 옛 커밋도 지워줘", or follow-up requests after a plain file deletion wasn't enough). A plain `git rm` + commit only stops tracking a file from that point on — the blob is still reachable from every earlier commit and still fetchable from the remote by anyone who has the old commit SHA.
---

# Purging a file from git history (not just HEAD)

## 1. Confirm scope before doing anything

Ask (or infer from how the request is phrased) whether the user wants:
- **Forward-only removal** — `git rm` + commit + normal push. Safe, reversible, done in seconds. Old blobs remain reachable via old commit SHAs, but nothing in the normal repo browsing UI shows them.
- **Full history purge** — rewrites every commit SHA on the branch and requires a force-push. Harder to reverse, and anyone else's existing clone/fork diverges from the new history.

Don't default to the full purge without the user clearly wanting it — it's a strictly more disruptive operation. If genuinely ambiguous, ask.

## 2. Check for a clean working tree first

`scripts/purge-git-history.sh` refuses to run on a dirty tree, but check yourself first and stash/commit anything in progress — don't let the script's own safety check be the only thing standing between this and lost work.

## 3. Run the purge script

```bash
scripts/purge-git-history.sh <path> [<path> ...]
```

This does the full sequence: `git filter-branch --index-filter` over `--all`, drops the `refs/original/*` backup refs, expires the reflog, runs `git gc --prune=now --aggressive`, and verifies locally via `git rev-list --objects --all` that the blobs are gone. It prints next steps but **does not push**.

## 4. Confirm before force-pushing

The script's rewrite is local and still reversible (nothing has left your machine). Force-pushing is not — it changes the remote branch's history for everyone. Tell the user plainly what force-push means here (every other clone/fork now diverges) and get an explicit go-ahead for *that specific action*, even if they already asked for the history purge — "purge the history" implies the rewrite, not necessarily that you should also push without a check-in.

Once confirmed:

```bash
git push --force origin <branch>
```

## 5. Verify, and set expectations about remote caching

Re-check locally that the target paths are gone (`git log --all --oneline -- <path>` should be empty, `git rev-list --objects --all | grep -i <filename>` should find nothing).

Then check whether the remote still serves the old content — this is expected to still work for a while and is not a sign anything went wrong:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://raw.githubusercontent.com/<owner>/<repo>/main/<path>   # expect 404
curl -s -o /dev/null -w "%{http_code}\n" https://raw.githubusercontent.com/<owner>/<repo>/<old-sha>/<path>  # may still be 200
```

Explain to the user that the old commit SHAs may stay fetchable on GitHub's side until its own garbage collection runs on now-unreachable objects (no fixed SLA — can be days). If the content isn't sensitive, this is normally fine to just wait out. If it is sensitive, say so and offer to describe how to file a GitHub Support request to purge the cached/dangling objects — don't attempt to force that cleanup yourself.
