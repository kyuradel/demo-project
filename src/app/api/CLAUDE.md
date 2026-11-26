# API 라우트 (`src/app/api`)

이 디렉터리 아래의 Next.js Route Handler들에 대한 문서입니다.

## `POST /api/analyze` (`analyze/route.ts`)

채팅 로그 CSV를 받아 Gemini로 분석한 결과를 반환합니다.

**요청**: `multipart/form-data`, 필드명 `file` (CSV Blob)

**처리 흐름**:
1. `@/lib/parseChat`의 `parseChatCsv`로 CSV → `ChatMessage[]` 파싱 (timestamp/sender/message 컬럼 느슨하게 자동 인식)
2. `toTranscript`로 프롬프트용 텍스트 생성. 너무 길면(60,000자 초과) 최근 메시지 위주로 잘라서 `truncated: true` 처리
3. `topActiveUsers`로 발신자별 메시지 수를 **코드로 직접 집계** (LLM에게 세게 하지 않음 — 숫자는 정확해야 하므로 모델 환각 리스크를 피하기 위한 설계 결정)
4. `@google/genai`의 `GoogleGenAI.models.generateContent`를 `responseMimeType: "application/json"`과 함께 호출해 요약/액션아이템/토픽/분위기를 JSON으로 받음
5. 모델 출력 + 로컬 집계 결과를 합쳐 `AnalysisResult`(`@/lib/types`)로 응답

**환경변수**: `GEMINI_API_KEY`(필수), `GEMINI_MODEL`(기본값 `gemini-3.5-flash-lite`) — 루트 `.env.local` 참고

**에러 응답** (모두 `{ error: string }` 형태의 한국어 메시지):
- `500`: `GEMINI_API_KEY` 미설정
- `400`: CSV 파일 누락 또는 파싱 결과 메시지 0건
- `502`: Gemini 호출 실패 또는 응답 JSON 파싱 실패

## 새 출력 필드를 추가할 때

`SYSTEM_PROMPT`의 JSON 스키마 설명, 응답 파싱(`parsed` 타입/기본값), `AnalysisResult` 타입(`src/lib/types.ts`), 프론트엔드 렌더링(`src/app/page.tsx`) 네 곳을 함께 수정해야 합니다. 숫자 집계처럼 정확성이 중요한 값은 가능하면 LLM이 아니라 `src/lib/parseChat.ts`에서 코드로 계산하는 패턴을 따르세요.
