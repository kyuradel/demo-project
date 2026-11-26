"use client";

import { useRef, useState } from "react";
import type { ActionItem, AnalysisResult } from "@/lib/types";

const PRIORITY_META: Record<
  ActionItem["priority"],
  { label: string; dot: string; chip: string }
> = {
  high: {
    label: "높음",
    dot: "bg-red-500",
    chip: "bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900",
  },
  medium: {
    label: "보통",
    dot: "bg-amber-500",
    chip: "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900",
  },
  low: {
    label: "낮음",
    dot: "bg-zinc-400",
    chip: "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700",
  },
};

const PRIORITY_ORDER: Record<ActionItem["priority"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
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

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M12 3v3m0 12v3m9-9h-3M6 12H3m14.5-6.5-2 2M8.5 15.5l-2 2m0-11 2 2m9 9-2-2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
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
    <div className="relative min-h-screen overflow-hidden bg-zinc-50 font-sans dark:bg-zinc-950">
      {/* decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-violet-300/40 blur-3xl dark:bg-violet-700/20" />
        <div className="absolute top-40 -right-24 h-96 w-96 rounded-full bg-indigo-300/30 blur-3xl dark:bg-indigo-700/20" />
      </div>

      <main className="relative mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-20">
        <header className="flex flex-col items-start gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
            <SparkleIcon />
            AI 채팅 분석
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            채팅방 방장 봇
          </h1>
          <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            채팅 메시지 CSV를 올리면 대화를 요약하고, 방장이 챙겨야 할 액션 아이템을 뽑아드려요.
          </p>
        </header>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !loading && fileInputRef.current?.click()}
          className={`group flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
            isDragging
              ? "border-violet-500 bg-violet-50 dark:bg-violet-500/10"
              : "border-zinc-300 bg-white/70 hover:border-violet-400 hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/60 dark:hover:border-violet-500"
          } ${loading ? "pointer-events-none opacity-70" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-violet-600 transition-transform group-hover:scale-105 dark:bg-violet-500/10 dark:text-violet-300 ${
              loading ? "animate-pulse" : ""
            }`}
          >
            <UploadIcon />
          </div>
          {loading ? (
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
              분석 중입니다...
            </p>
          ) : (
            <>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                CSV 파일을 끌어다 놓거나 클릭해서 선택하세요
              </p>
              <p className="text-xs text-zinc-400">채팅방 메시지 로그 (.csv)</p>
            </>
          )}
          {fileName && !loading && (
            <p className="mt-1 rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {fileName}
            </p>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
            <AlertIcon />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <section className="animate-fade-in-up flex flex-col gap-5">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">
                요약
              </h2>
              <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                {result.summary}
              </p>
              <div className="mt-4 flex items-center gap-2 border-t border-zinc-100 pt-3 text-xs text-zinc-400 dark:border-zinc-800">
                <span>메시지 {result.messageCount}개 분석됨</span>
                {result.truncated && (
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
                    최근 메시지 위주로 요약됨
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
                액션 아이템
              </h2>
              {sortedItems.length === 0 ? (
                <p className="text-sm text-zinc-500">특별한 액션 아이템이 없습니다.</p>
              ) : (
                <ul className="flex flex-col gap-2.5">
                  {sortedItems.map((item, i) => {
                    const meta = PRIORITY_META[item.priority] ?? PRIORITY_META.low;
                    return (
                      <li
                        key={i}
                        className="flex items-start justify-between gap-3 rounded-xl bg-zinc-50 p-3.5 dark:bg-zinc-800/50"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${meta.dot}`} />
                          <div className="flex flex-col gap-1">
                            <span className="text-sm text-zinc-800 dark:text-zinc-200">
                              {item.task}
                            </span>
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
          </section>
        )}
      </main>
    </div>
  );
}
