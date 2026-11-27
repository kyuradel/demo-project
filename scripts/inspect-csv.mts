// Quick CLI to run the real CSV parser against a file without going through
// the upload UI or the Gemini API. Useful for checking whether the loose
// timestamp/sender/message column-detection heuristic in parseChat.ts
// handles a new or oddly-formatted CSV before wiring it through the app.
//
// Usage: npm run inspect-csv -- <csv 경로>
import { readFileSync } from "node:fs";
import { parseChatCsv, toTranscript, topActiveUsers } from "../src/lib/parseChat.ts";

const path = process.argv[2];
if (!path) {
  console.error("사용법: npm run inspect-csv -- <csv 경로>");
  process.exit(1);
}

const csvText = readFileSync(path, "utf8");
const messages = parseChatCsv(csvText);

console.log(`파싱된 메시지: ${messages.length}개`);
if (messages.length === 0) {
  console.log(
    "메시지를 하나도 찾지 못했습니다 — 컬럼명이 timestamp/sender/message 계열과 매칭되는지 확인하세요."
  );
  process.exit(0);
}

console.log("\n처음 3개 메시지:");
for (const m of messages.slice(0, 3)) {
  console.log(`  [${m.timestamp ?? "-"}] ${m.sender ?? "(알수없음)"}: ${m.text}`);
}

const { truncated, usedCount } = toTranscript(messages);
console.log(
  `\n트랜스크립트: ${usedCount}개 메시지 사용${truncated ? " (60,000자 초과로 잘림)" : ""}`
);

console.log("\n활성 사용자 Top 5:");
for (const u of topActiveUsers(messages)) {
  console.log(`  ${u.name}: ${u.messageCount}개`);
}

const noSender = messages.filter((m) => !m.sender).length;
const noTimestamp = messages.filter((m) => !m.timestamp).length;
if (noSender > 0 || noTimestamp > 0) {
  console.log(
    `\n⚠ sender 없음: ${noSender}개, timestamp 없음: ${noTimestamp}개 — 컬럼 자동 인식이 일부 실패했을 수 있습니다.`
  );
}
