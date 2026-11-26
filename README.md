# 채팅방 방장 봇

채팅 메시지 CSV 파일을 업로드하면 대화를 요약하고, 방장이 챙겨야 할 액션 아이템을 뽑아주는 간단한 프로토타입 MVP입니다.

프론트엔드와 API 라우트만 있는 Next.js 앱이며, 데이터베이스는 사용하지 않습니다. 업로드한 CSV는 저장되지 않고 요청이 끝나면 사라집니다.

## 동작 방식

1. 사용자가 채팅 로그 CSV 파일을 업로드 (드래그&드롭 또는 클릭)
2. `/api/analyze`에서 CSV를 파싱해 메시지 목록으로 변환
3. [Gemini API](https://aistudio.google.com/apikey)에 대화 내용을 보내 요약 + 액션 아이템을 JSON으로 생성
4. 결과를 화면에 요약 카드 + 우선순위별 액션 아이템 목록으로 표시

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. Gemini API 키 설정

[Google AI Studio](https://aistudio.google.com/apikey)에서 무료 API 키를 발급받은 뒤, `.env.local.example`을 복사해서 `.env.local`을 만들고 키를 채워주세요.

```bash
cp .env.local.example .env.local
```

```env
GEMINI_API_KEY=여기에_발급받은_키_입력
GEMINI_MODEL=gemini-3.5-flash-lite
```

> Gemini 무료 티어는 모델별로 하루 요청 수 제한이 있습니다. 프로토타입 테스트 용도로는 충분합니다.

### 3. 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3100](http://localhost:3100) 에서 확인할 수 있습니다. (3000번 포트가 사용 중인 환경을 고려해 3100번으로 고정되어 있습니다.)

저장소에 포함된 `sample-chat.csv`로 바로 테스트해볼 수 있습니다.

## CSV 형식

헤더가 있는 CSV 파일이면 되고, 아래와 같은 컬럼명을 자동으로 인식합니다 (대소문자 구분 없음).

| 역할 | 인식하는 컬럼명 예시 |
| --- | --- |
| 시각 | `timestamp`, `time`, `date`, `datetime` |
| 보낸 사람 | `sender`, `author`, `user`, `name` |
| 메시지 내용 | `message`, `text`, `content`, `body` |

메시지 내용 컬럼을 못 찾으면 각 행의 모든 값을 이어붙여서 분석합니다. 메시지가 너무 많으면 최근 메시지 위주로 잘라서 분석합니다.

## 기술 스택

- [Next.js](https://nextjs.org) (App Router, TypeScript) — 프론트엔드 + API 라우트
- [Tailwind CSS](https://tailwindcss.com) — 스타일링
- [Google Gemini API](https://ai.google.dev) (`@google/genai`) — 요약/액션 아이템 생성
- [PapaParse](https://www.papaparse.com) — CSV 파싱

## 알려진 제한사항 (MVP)

- 데이터베이스가 없어서 분석 결과가 저장되지 않습니다 (매번 새로 분석).
- 매우 긴 대화 로그는 전체가 아니라 최근 메시지 위주로만 분석됩니다.
- Gemini 무료 티어의 요청 수 제한에 걸릴 수 있습니다.
