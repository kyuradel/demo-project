---
name: verify
description: Run this project's local verification loop (lint, build, and a real end-to-end request against /api/analyze) after any code change under src/app/api, src/lib, or src/app/page.tsx, and before telling the user a change works. Also trigger on requests like "확인해줘", "검증해줘", "잘 되는지 테스트해줘", "돌려봐줘", or "작동하는지 봐줘" in this project. A build that compiles is not the same as a feature that works — this skill's last step actually calls Gemini and checks the response, which is the only way to catch prompt/parsing mismatches that TypeScript can't.
---

# Verifying a change in this project

Run these in order and stop at the first failure — don't skip ahead and claim success.

## 1. Lint and build

```bash
npm run lint
npm run build
```

Both must exit clean. `npm run build` also runs the TypeScript check, so this catches type errors across all four files touched by an analysis-field change (see the `update-analysis-fields` skill).

## 2. Make sure a dev server is up on port 3100

The dev script is pinned to port 3100 (`package.json` → `"dev": "next dev -p 3100"`), because port 3000 tends to be occupied on this machine. Check before starting a new one:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3100/
```

- `200` → a server is already running; reuse it (hot reload already picked up your file changes — don't restart it).
- connection error → start one: `npm run dev > /tmp/dev.log 2>&1 &`, then wait a few seconds before continuing.

Don't blindly `pkill`/kill existing node processes to "clean up" — this project has previously had unrelated processes squatting on port 3000, and killing processes has been blocked by the permission system before. If a stray server is in the way, say so instead of force-killing it.

## 3. End-to-end smoke test against the real API

```bash
curl -s -m 30 -X POST http://localhost:3100/api/analyze -F "file=@sample-chat.csv"
```

(`sample-chat.csv` lives at the repo root.) This is the step that actually exercises the Gemini call — lint/build only prove the code compiles, not that the prompt still produces parseable JSON or that a new field actually comes back populated.

Make sure the dev server is NOT running with `MOCK_GEMINI=1` for this step — that env var short-circuits the real Gemini call and returns a canned response, which defeats the entire point of this step. Check `curl -s -X POST .../api/analyze ...` output for the `[MOCK]` prefix in `summary`; if you see it, restart the dev server without `MOCK_GEMINI` set.

Check the JSON response for:
- no `"error"` key
- `summary` is a non-empty string
- `actionItems`, `topics`, `activeUsers` are arrays (shape depends on what the task touched — only check the fields relevant to the change)
- `messageCount` / `truncated` present

## Reading failures correctly

- `GEMINI_API_KEY가 설정되지 않았습니다` → `.env.local` is missing the key, not a code bug.
- `Gemini 호출 실패: 429 ...` (quota/credits) → the free-tier rate limit or quota was hit — this is expected under heavy testing, not a regression. Mention it rather than treating it as broken.
- `모델 응답을 해석하지 못했습니다` → the prompt schema and the parsing code likely drifted out of sync (see `update-analysis-fields` skill, step 1 vs 2).

Report pass/fail concisely: which of the three steps ran, and the actual response (or actual error) from step 3 — not just "it should work now".
