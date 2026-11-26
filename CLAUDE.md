# CLAUDE.md

채팅방 메시지 CSV를 업로드하면 요약/액션아이템/주요토픽/활성사용자를 뽑아주는 Next.js MVP. 데이터베이스 없음, 업로드된 파일은 저장하지 않고 요청 단위로만 처리합니다. 사용자 대상 설명은 `README.md` 참고.

## 명령어

- `npm run dev` — 개발 서버 (포트 3100 고정, `package.json` 참고)
- `npm run build` / `npm run lint`

## 구조

- `src/app/page.tsx` — 업로드 UI + 결과 렌더링 (클라이언트 컴포넌트, 다크 테마 고정)
- `src/app/api/` — API 라우트. **세부 내용은 [src/app/api/CLAUDE.md](src/app/api/CLAUDE.md) 참고**
- `src/lib/types.ts` — `ChatMessage`, `AnalysisResult` 등 공유 타입
- `src/lib/parseChat.ts` — CSV 파싱, 트랜스크립트 생성, 활성 사용자 집계

## 환경변수

`.env.local.example`을 `.env.local`로 복사해서 사용. `GEMINI_API_KEY`(필수, [Google AI Studio](https://aistudio.google.com/apikey)에서 무료 발급), `GEMINI_MODEL`(기본 `gemini-3.5-flash-lite`).

## 설계 원칙

- MVP 범위 유지: DB·인증·백엔드 서버 추가하지 않음
- 정확성이 중요한 값(개수 집계 등)은 LLM이 아니라 코드로 계산 — 자세한 이유는 `src/app/api/CLAUDE.md` 참고
