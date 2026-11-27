import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { parseChatCsv, toTranscript, topActiveUsers } from "@/lib/parseChat";
import type { ActionItem, AnalysisResult, Topic } from "@/lib/types";

const SYSTEM_PROMPT = `당신은 채팅 커뮤니티의 '방장'입니다. 주어진 채팅 메시지 로그를 읽고 커뮤니티 운영자 관점에서 분석하세요.
다음 JSON 형식으로만 응답하세요 (다른 텍스트 없이 JSON만):
{
  "summary": "대화 내용에 대한 3~6문장 요약 (한국어)",
  "actionItems": [
    { "task": "해야 할 일 설명", "owner": "담당자 이름 또는 null", "priority": "high" | "medium" | "low" }
  ],
  "topics": [
    { "title": "주요 토픽/이슈 제목", "detail": "왜 중요한지, 어떤 논의가 있었는지 1~2문장" }
  ],
  "mood": "대화 전반의 분위기/톤에 대한 1~2문장 설명"
}
actionItems는 실제로 방장이나 구성원이 처리해야 할 구체적인 행동 항목만 포함하고, 없으면 빈 배열을 반환하세요.
topics는 대화에서 반복되거나 중요하게 다뤄진 주제·이슈를 최대 5개까지 포함하세요.`;

// MOCK_GEMINI=1 이면 실제 API를 호출하지 않고 이 고정 응답을 반환한다.
// 빠른 반복 작업/스키마 변경 확인용 — API 키나 크레딧 없이도 route 전체 흐름을
// exercise할 수 있다. `verify` 스킬의 end-to-end 단계에서는 사용하지 말 것
// (실제 Gemini 호출을 확인하는 게 그 단계의 목적이므로).
const MOCK_RESPONSE = JSON.stringify({
  summary:
    "[MOCK] 최근 대화는 다음 모임 장소와 일정 조율이 중심이었습니다. 강남역 쪽 장소에 대한 의견이 모였고, 날짜는 아직 확정되지 않았습니다.",
  actionItems: [
    { task: "모임 장소 최종 확정하기", owner: "지민", priority: "high" },
    { task: "참석 가능 여부 다시 취합하기", owner: null, priority: "medium" },
  ],
  topics: [{ title: "모임 장소", detail: "강남역 쪽으로 의견이 모이는 중" }],
  mood: "대체로 우호적이고 협조적인 분위기",
});

export async function POST(request: Request) {
  const mockMode = process.env.MOCK_GEMINI === "1";
  const apiKey = process.env.GEMINI_API_KEY;
  if (!mockMode && !apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY가 설정되지 않았습니다. .env.local 파일을 확인하세요." },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "CSV 파일이 필요합니다." }, { status: 400 });
  }

  const csvText = await file.text();
  const messages = parseChatCsv(csvText);
  if (messages.length === 0) {
    return NextResponse.json(
      { error: "CSV에서 메시지를 찾지 못했습니다. 파일 형식을 확인하세요." },
      { status: 400 }
    );
  }

  const { transcript, truncated, usedCount } = toTranscript(messages);

  let raw: string;
  if (mockMode) {
    raw = MOCK_RESPONSE;
  } else {
    const client = new GoogleGenAI({ apiKey });
    const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
    try {
      const response = await client.models.generateContent({
        model,
        contents: transcript,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json",
        },
      });
      raw = response.text ?? "{}";
    } catch (err) {
      const detail = err instanceof Error ? err.message : "알 수 없는 오류";
      return NextResponse.json({ error: `Gemini 호출 실패: ${detail}` }, { status: 502 });
    }
  }

  let parsed: {
    summary?: string;
    actionItems?: ActionItem[];
    topics?: Topic[];
    mood?: string;
  };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "모델 응답을 해석하지 못했습니다." }, { status: 502 });
  }

  const result: AnalysisResult = {
    summary: parsed.summary ?? "",
    actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
    topics: Array.isArray(parsed.topics) ? parsed.topics : [],
    activeUsers: topActiveUsers(messages),
    mood: parsed.mood ?? "",
    messageCount: usedCount,
    truncated,
  };

  return NextResponse.json(result);
}
