import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { parseChatCsv, toTranscript } from "@/lib/parseChat";
import type { ActionItem, AnalysisResult } from "@/lib/types";

const SYSTEM_PROMPT = `당신은 채팅 커뮤니티의 '방장'입니다. 주어진 채팅 메시지 로그를 읽고 커뮤니티 운영자 관점에서 분석하세요.
다음 JSON 형식으로만 응답하세요 (다른 텍스트 없이 JSON만):
{
  "summary": "대화 내용에 대한 3~6문장 요약 (한국어)",
  "actionItems": [
    { "task": "해야 할 일 설명", "owner": "담당자 이름 또는 null", "priority": "high" | "medium" | "low" }
  ]
}
actionItems는 실제로 방장이나 구성원이 처리해야 할 구체적인 행동 항목만 포함하고, 없으면 빈 배열을 반환하세요.`;

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
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

  const client = new GoogleGenAI({ apiKey });
  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

  let raw: string;
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

  let parsed: { summary?: string; actionItems?: ActionItem[] };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "모델 응답을 해석하지 못했습니다." }, { status: 502 });
  }

  const result: AnalysisResult = {
    summary: parsed.summary ?? "",
    actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
    messageCount: usedCount,
    truncated,
  };

  return NextResponse.json(result);
}
