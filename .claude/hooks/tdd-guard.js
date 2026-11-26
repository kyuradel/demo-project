#!/usr/bin/env node
// PreToolUse (Edit|Write) guard: refuses to let implementation code in
// src/lib/** or src/app/api/** be written unless a sibling *.test.ts(x)
// already exists — enforcing "test first" before "code first".

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

let raw = "";
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  const toolName = input.tool_name;
  if (toolName !== "Edit" && toolName !== "Write" && toolName !== "MultiEdit") {
    process.exit(0);
  }

  const filePath = input.tool_input && input.tool_input.file_path;
  if (!filePath) process.exit(0);

  const normalized = filePath.replace(/\\/g, "/");
  const isGuardedDir = /(^|\/)src\/(lib|app\/api)\//.test(normalized);
  const isTsFile = /\.tsx?$/.test(normalized);
  const isTestFile = /\.test\.tsx?$/.test(normalized);
  const isTypesFile = path.basename(filePath) === "types.ts";

  if (!isGuardedDir || !isTsFile || isTestFile || isTypesFile) {
    process.exit(0);
  }

  const ext = path.extname(filePath);
  const dir = path.dirname(filePath);
  const base = path.basename(filePath, ext);
  const testPath = path.join(dir, `${base}.test${ext}`);

  if (!fs.existsSync(testPath)) {
    console.log(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason:
            `TDD 가드: ${path.basename(filePath)}에 대한 테스트 파일이 없습니다 (${path.basename(testPath)} 없음).\n` +
            "구현 코드를 쓰기 전에 실패하는 테스트를 먼저 작성하세요 (Red → Green → Refactor).",
        },
      })
    );
    process.exit(0);
  }

  const isWin = process.platform === "win32";
  try {
    execFileSync(isWin ? "npx.cmd" : "npx", ["vitest", "run", testPath], {
      cwd: process.cwd(),
      stdio: "ignore",
      timeout: 30000,
      shell: isWin,
    });
    console.log(
      JSON.stringify({
        systemMessage:
          `TDD 가드: ${path.basename(testPath)}가 이미 통과(green) 상태입니다. ` +
          "리팩터링이면 괜찮지만, 새 동작을 추가하는 거라면 먼저 실패하는 테스트를 추가하세요.",
      })
    );
  } catch {
    // non-zero exit / timeout => treat as red (expected) or infra hiccup; allow either way.
  }
  process.exit(0);
});
