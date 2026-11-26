---
name: update-analysis-fields
description: Use this skill whenever the user wants to add, remove, rename, or restructure a field or section in this project's chat-analysis output (currently 전체요약/summary, 액션아이템/actionItems, 주요토픽·이슈/topics, 활성사용자·분위기/activeUsers+mood). Trigger it even for casual phrasing like "결과에 OO도 보여줬으면 좋겠어요", "OO 필드 빼줘", "액션아이템에 마감일도 넣어줘", or "분석 결과에 새 섹션 추가해줘" — any request that changes what the Gemini analysis returns or displays, not just ones that say "schema" or "field" explicitly.
---

# Updating the chat-analysis output shape

This project's analysis output is defined in **four places that must change together**. Missing one leaves the app half-updated (e.g. the type compiles but the UI never shows the new data, or the model never gets asked for it). Go through all four, in this order, for every change:

1. **Prompt schema** — `src/app/api/analyze/route.ts`, the `SYSTEM_PROMPT` constant. Update the JSON shape description and any instruction sentences (e.g. "최대 5개까지" limits) so Gemini knows what to return.
2. **Response parsing & assembly** — same file, the `parsed` type annotation and the `result: AnalysisResult` object. Add the new field with a safe default (`?? ""`, `Array.isArray(...) ? ... : []`, etc.) so a malformed/partial model response doesn't crash the route.
3. **Shared types** — `src/lib/types.ts`. Update `AnalysisResult` (and add a nested type like `Topic`/`ActiveUser` if the field is a structured list, not a primitive).
4. **Frontend rendering** — `src/app/page.tsx`. Add or edit a card inside the `result &&` grid section, following the existing pattern: a small colored icon badge + `<h2>` label, then the content. Pick an accent color not already used by a sibling card (see existing `blue`/`emerald`/`pink`/`cyan` badges) so sections stay visually distinct.

## Before touching the prompt: decide who computes the value

Ask: **does this field need to be exactly correct (a count, a total, a ranking), or is it a qualitative judgment (a summary, a vibe, a categorization)?**

- Qualitative → ask Gemini for it via the prompt schema (steps 1–2 above).
- Needs precision → compute it in code instead, in `src/lib/parseChat.ts`, from the already-parsed `ChatMessage[]` (see `topActiveUsers` for the existing pattern: tally from raw messages, not from the LLM). Then just thread the computed value into `result` in `route.ts` (skip step 1, and keep step 2 limited to merging the computed value in).

This matters because LLMs are unreliable at exact counting/arithmetic over long transcripts, especially once the transcript gets truncated (see `toTranscript`) — a count the model reports may not match the real CSV. Computing it in code sidesteps that entirely. `src/app/api/CLAUDE.md` documents this convention; keep it in sync if the convention itself changes.

## After the change

Run the project's verification flow (see the `verify` skill in this repo) before telling the user it works: lint, build, and a real end-to-end request against `/api/analyze` with `sample-chat.csv`. A field that only "looks right" in the code but was never exercised against a real Gemini response is not verified.
