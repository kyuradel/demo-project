"use client";

import { useRef, useState } from "react";
import type { ActionItem, AnalysisResult } from "@/lib/types";

function TopicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
      <path
        d="M9 4 7 20M17 4l-2 16M4 9h16M3 15h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M3 20c0-3 2.7-5 6-5s6 2 6 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M16 8.5a2.5 2.5 0 1 0 0-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M15 15.2c2.4.4 4 1.9 4 4.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const PRIORITY_META: Record<
  ActionItem["priority"],
  { label: string; dot: string; chip: string }
> = {
  high: {
    label: "높음",
    dot: "bg-red-500",
    chip: "bg-red-500/10 text-red-300 ring-1 ring-red-500/20",
  },
  medium: {
    label: "보통",
    dot: "bg-amber-500",
    chip: "bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20",
  },
  low: {
    label: "낮음",
    dot: "bg-zinc-500",
    chip: "bg-zinc-800 text-zinc-400 ring-1 ring-zinc-700",
  },
};

const PRIORITY_ORDER: Record<ActionItem["priority"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M4 5h16v11H8l-4 4V5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M12 16V4m0 0 4 4m-4-4-4 4M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M7 3h7l4 4v14H7V3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M14 3v4h4" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function SummaryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
      <path
        d="M5 5h14M5 11h14M5 17h8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
      <path
        d="M5 13l4 4 10-10"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0">
      <path
        d="M12 9v4m0 4h.01M10.3 3.9 1.9 18a1.5 1.5 0 0 0 1.3 2.25h17.6a1.5 1.5 0 0 0 1.3-2.25L13.7 3.9a1.5 1.5 0 0 0-2.6 0Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-zinc-700 border-t-violet-400" />
  );
}

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  async function analyze(file: File) {
    setFileName(file.name);
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/analyze", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "분석에 실패했습니다.");
      }
      setResult(data as AnalysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) analyze(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) analyze(file);
  }

  const sortedItems = result
    ? [...result.actionItems].sort(
        (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      )
    : [];

  return (
    <div className="relative min-h-screen bg-zinc-950 font-sans text-zinc-50">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-violet-500/10 to-transparent" />

      <main className="relative mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-16">
        <header className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-violet-400 ring-1 ring-zinc-800">
            <ChatIcon />
          </div>
          <div className="flex flex-col gap-1 pt-0.5">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-50">
              채팅방 방장 봇
            </h1>
            <p className="text-sm text-zinc-500">
              채팅 메시지 CSV를 올리면 대화를 요약하고, 방장이 챙겨야 할 액션 아이템을
              뽑아드려요.
            </p>
          </div>
        </header>

        <div className="flex flex-col gap-2.5">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !loading && fileInputRef.current?.click()}
            className={`flex min-h-[128px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
              isDragging
                ? "border-violet-500 bg-violet-500/5"
                : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900"
            } ${loading ? "pointer-events-none" : ""}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
            />
            {!fileName ? (
              <>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-800 text-zinc-300">
                  <UploadIcon />
                </div>
                <p className="text-sm font-medium text-zinc-200">
                  CSV 파일을 끌어다 놓거나 클릭해서 업로드
                </p>
                <p className="text-xs text-zinc-500">채팅방 메시지 로그 파일(.csv)</p>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300">
                  <FileIcon />
                </div>
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-sm font-medium text-zinc-100">{fileName}</span>
                  <span className="text-xs text-zinc-500">
                    {loading ? "분석 중입니다..." : "클릭해서 다른 파일 선택"}
                  </span>
                </div>
                {loading && <Spinner />}
              </div>
            )}
          </div>
          <p className="text-center text-xs text-zinc-600">
            MVP · 업로드한 파일은 서버에 저장되지 않습니다
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-300">
            <AlertIcon />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <section className="animate-fade-in-up grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-500/15 text-blue-400">
                  <SummaryIcon />
                </span>
                <h2 className="text-sm font-semibold text-zinc-100">전체 요약</h2>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-400">
                {result.summary}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-zinc-800 pt-3 text-xs text-zinc-500">
                <span>메시지 {result.messageCount}개 분석됨</span>
                {result.truncated && (
                  <span className="rounded-full bg-zinc-800 px-2 py-0.5">
                    최근 메시지 위주로 요약됨
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-400">
                  <CheckIcon />
                </span>
                <h2 className="text-sm font-semibold text-zinc-100">액션 아이템</h2>
              </div>
              {sortedItems.length === 0 ? (
                <p className="text-sm text-zinc-500">특별한 액션 아이템이 없습니다.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {sortedItems.map((item, i) => {
                    const meta = PRIORITY_META[item.priority] ?? PRIORITY_META.low;
                    return (
                      <li
                        key={i}
                        className="flex items-start justify-between gap-3 rounded-xl bg-zinc-950/50 p-3.5"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${meta.dot}`} />
                          <div className="flex flex-col gap-1">
                            <span className="text-sm text-zinc-200">{item.task}</span>
                            {item.owner && (
                              <span className="text-xs text-zinc-500">담당: {item.owner}</span>
                            )}
                          </div>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.chip}`}
                        >
                          {meta.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-pink-500/15 text-pink-400">
                  <TopicIcon />
                </span>
                <h2 className="text-sm font-semibold text-zinc-100">주요 토픽·이슈</h2>
              </div>
              {result.topics.length === 0 ? (
                <p className="text-sm text-zinc-500">두드러진 토픽이 없습니다.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {result.topics.map((topic, i) => (
                    <li key={i} className="rounded-xl bg-zinc-950/50 p-3.5">
                      <p className="text-sm text-zinc-200">{topic.title}</p>
                      <p className="mt-1 text-xs leading-5 text-zinc-500">{topic.detail}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-500/15 text-cyan-400">
                  <UsersIcon />
                </span>
                <h2 className="text-sm font-semibold text-zinc-100">활성 사용자·분위기</h2>
              </div>
              {result.mood && (
                <p className="mb-4 text-sm leading-6 text-zinc-400">{result.mood}</p>
              )}
              {result.activeUsers.length === 0 ? (
                <p className="text-sm text-zinc-500">발신자 정보를 찾을 수 없습니다.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {result.activeUsers.map((user, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 rounded-full bg-zinc-950/50 px-3 py-1.5 text-xs"
                    >
                      <span className="font-medium text-zinc-100">{user.name}</span>
                      <span className="text-zinc-500">{user.messageCount}개</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
