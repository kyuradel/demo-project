#!/usr/bin/env node
// Checks that the 4 places the `update-analysis-fields` skill requires to
// change together (SYSTEM_PROMPT schema / parsed type / result object /
// AnalysisResult type / page.tsx rendering) haven't drifted apart.
//
// This is a line-based heuristic, not a real parser — it assumes the current
// one-key-per-line formatting in route.ts/types.ts. If those files get
// reformatted drastically, fix the regexes below rather than trusting a
// false pass (the script refuses to pass silently if it finds zero fields).
//
// Usage: npm run check-schema

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const typesSrc = readFileSync(join(root, "src/lib/types.ts"), "utf8");
const routeSrc = readFileSync(join(root, "src/app/api/analyze/route.ts"), "utf8");
const pageSrc = readFileSync(join(root, "src/app/page.tsx"), "utf8");

function block(src, startMarker, openChar = "{", closeChar = "}") {
  const start = src.indexOf(startMarker);
  if (start === -1) return null;
  const from = src.indexOf(openChar, start);
  let depth = 0;
  for (let i = from; i < src.length; i++) {
    if (src[i] === openChar) depth++;
    else if (src[i] === closeChar) {
      depth--;
      if (depth === 0) return src.slice(from, i + 1);
    }
  }
  return null;
}

function keysInBlock(blockText) {
  if (!blockText) return [];
  const keys = new Set();
  for (const line of blockText.split("\n")) {
    const m = line.match(/^\s*(\w+)\??\s*[,:]/);
    if (m) keys.add(m[1]);
  }
  return [...keys];
}

// 1. AnalysisResult fields (types.ts)
const typeFields = keysInBlock(block(typesSrc, "export type AnalysisResult = {"));

// 2. SYSTEM_PROMPT top-level JSON keys (route.ts) — only 2-space-indented
//    keys count as top-level; nested object keys (task/owner/title/...) sit
//    inline at a different indent and are intentionally not matched.
const promptMatch = routeSrc.match(/const SYSTEM_PROMPT = `[\s\S]*?`;/);
const promptBlock = promptMatch ? promptMatch[0] : "";
const promptKeys = [...promptBlock.matchAll(/^ {2}"(\w+)":/gm)].map((m) => m[1]);

// 3. `parsed` type block (route.ts) — fields the code expects Gemini to return
const parsedFields = keysInBlock(block(routeSrc, "let parsed: {"));

// 4. `result: AnalysisResult = {...}` object (route.ts)
const resultFields = keysInBlock(block(routeSrc, "const result: AnalysisResult = {"));

// 5. page.tsx usage: result.<field>
const pageFields = [...new Set([...pageSrc.matchAll(/result\.(\w+)/g)].map((m) => m[1]))];

if (typeFields.length === 0 || resultFields.length === 0 || parsedFields.length === 0) {
  console.error(
    "⚠ 필드를 하나도 못 찾았습니다 — route.ts/types.ts 포맷이 바뀌어서 이 스크립트의 정규식이 깨졌을 수 있습니다. 수동으로 확인하세요."
  );
  process.exit(1);
}

let ok = true;
function report(label, missing, context) {
  if (missing.length) {
    ok = false;
    console.error(`✗ ${label}: ${missing.join(", ")} ${context}`);
  } else {
    console.log(`✓ ${label}`);
  }
}

report(
  "AnalysisResult 타입의 모든 필드가 result 객체에 할당됨",
  typeFields.filter((f) => !resultFields.includes(f)),
  "— route.ts의 result 객체에서 빠짐"
);
report(
  "result 객체의 모든 키가 AnalysisResult 타입에 선언됨",
  resultFields.filter((f) => !typeFields.includes(f)),
  "— types.ts의 AnalysisResult에서 빠짐"
);
report(
  "SYSTEM_PROMPT가 parsed 타입이 기대하는 필드를 모두 요청함",
  parsedFields.filter((f) => !promptKeys.includes(f)),
  "— SYSTEM_PROMPT JSON 스키마 설명에서 빠짐"
);
report(
  "SYSTEM_PROMPT가 요청하는 필드를 parsed 타입이 모두 받음",
  promptKeys.filter((f) => !parsedFields.includes(f)),
  "— route.ts의 parsed 타입에서 빠짐"
);
report(
  "AnalysisResult의 모든 필드가 page.tsx에서 렌더링됨",
  typeFields.filter((f) => !pageFields.includes(f)),
  "— src/app/page.tsx에서 result.<field> 참조를 찾지 못함"
);

process.exit(ok ? 0 : 1);
