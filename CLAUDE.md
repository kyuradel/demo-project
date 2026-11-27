# CLAUDE.md

채팅방 메시지 CSV를 업로드하면 요약/액션아이템/주요토픽/활성사용자를 뽑아주는 Next.js MVP. 데이터베이스 없음, 업로드된 파일은 저장하지 않고 요청 단위로만 처리합니다. 사용자 대상 설명은 `README.md` 참고.

## 명령어

- `npm run dev` — 개발 서버 (포트 3100 고정, `package.json` 참고)
- `npm run build` / `npm run lint` / `npm run test` / `npm run type-check` — 타입만 빠르게 확인 (`tsc --noEmit`, build보다 빠름)
- `npm run check-schema` — `src/app/api/CLAUDE.md`의 "네 곳 동기화" 규칙(prompt 스키마 / parsed 타입 / `AnalysisResult` 타입 / page.tsx 렌더링)이 깨졌는지 검사
- `npm run inspect-csv -- <csv 경로>` — 업로드 UI나 Gemini 호출 없이 `parseChat.ts`의 컬럼 자동 인식 결과만 바로 확인
- `npm run test-hook` — `.claude/hooks/tdd-guard.js` 훅 자체를 수정했을 때 고정 fixture로 동작 확인 (`.claude/hooks/__tests__/fixtures/`)
- 과거 커밋에서 파일을 완전히 지워야 할 때는 `scripts/purge-git-history.sh` (`purge-git-history` 스킬 참고) — 일반 `git rm`은 히스토리에 남은 블롭까지는 못 지움

## 구조

- `src/app/page.tsx` — 업로드 UI + 결과 렌더링 (클라이언트 컴포넌트, 다크 테마 고정)
- `src/app/api/` — API 라우트. **세부 내용은 [src/app/api/CLAUDE.md](src/app/api/CLAUDE.md) 참고**
- `src/lib/types.ts` — `ChatMessage`, `AnalysisResult` 등 공유 타입
- `src/lib/parseChat.ts` — CSV 파싱, 트랜스크립트 생성, 활성 사용자 집계

## 환경변수

`.env.local.example`을 `.env.local`로 복사해서 사용. `GEMINI_API_KEY`(필수, [Google AI Studio](https://aistudio.google.com/apikey)에서 무료 발급), `GEMINI_MODEL`(기본 `gemini-3.5-flash-lite`), `MOCK_GEMINI`(선택, `1`로 설정하면 실제 Gemini 호출 없이 고정 응답 반환 — API 키 없이 빠르게 반복 작업할 때 사용. `verify` 스킬의 end-to-end 단계에서는 쓰지 말 것).

## 설계 원칙

- MVP 범위 유지: DB·인증·백엔드 서버 추가하지 않음
- 정확성이 중요한 값(개수 집계 등)은 LLM이 아니라 코드로 계산 — 자세한 이유는 `src/app/api/CLAUDE.md` 참고

## 알아두면 좋은 것들

- `vitest`는 메이저 버전을 `^3`으로 고정해서 씀 — 최신(`5.x`)으로 올리면 `@types/node@20`과 ERESOLVE 충돌이 남.
- `.claude/hooks/tdd-guard.js`가 `src/lib/**`, `src/app/api/**`의 구현 코드 Edit/Write를 막고, 대응하는 `*.test.ts(x)`가 먼저 있어야 통과시킴(TDD 가드). 테스트 파일/`types.ts`는 예외.
