import Papa from "papaparse";
import type { ChatMessage } from "./types";

const TIMESTAMP_KEYS = ["timestamp", "time", "date", "datetime", "sent_at"];
const SENDER_KEYS = ["sender", "author", "user", "username", "name", "from"];
const TEXT_KEYS = ["message", "text", "content", "body", "msg"];

function findKey(keys: string[], candidates: string[]): string | undefined {
  const lower = keys.map((k) => k.toLowerCase().trim());
  for (const candidate of candidates) {
    const idx = lower.findIndex((k) => k === candidate || k.includes(candidate));
    if (idx !== -1) return keys[idx];
  }
  return undefined;
}

export function parseChatCsv(csvText: string): ChatMessage[] {
  const { data } = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (data.length === 0) return [];

  const keys = Object.keys(data[0]);
  const timestampKey = findKey(keys, TIMESTAMP_KEYS);
  const senderKey = findKey(keys, SENDER_KEYS);
  const textKey = findKey(keys, TEXT_KEYS);

  return data
    .map((row): ChatMessage => {
      if (textKey) {
        return {
          timestamp: timestampKey ? row[timestampKey] ?? null : null,
          sender: senderKey ? row[senderKey] ?? null : null,
          text: row[textKey] ?? "",
        };
      }
      // Fallback: no recognizable message column, so join every field.
      return {
        timestamp: timestampKey ? row[timestampKey] ?? null : null,
        sender: senderKey ? row[senderKey] ?? null : null,
        text: Object.values(row).filter(Boolean).join(" "),
      };
    })
    .filter((m) => m.text.trim().length > 0);
}

const MAX_CHARS = 60000;

export function toTranscript(messages: ChatMessage[]): {
  transcript: string;
  truncated: boolean;
  usedCount: number;
} {
  const lines = messages.map((m) => {
    const prefix = [m.timestamp, m.sender].filter(Boolean).join(" ");
    return prefix ? `[${prefix}] ${m.text}` : m.text;
  });

  // Keep the most recent messages if the log is too long for the prompt.
  let usedLines = lines;
  let truncated = false;
  let transcript = usedLines.join("\n");
  if (transcript.length > MAX_CHARS) {
    truncated = true;
    while (transcript.length > MAX_CHARS && usedLines.length > 1) {
      usedLines = usedLines.slice(Math.ceil(usedLines.length * 0.1));
      transcript = usedLines.join("\n");
    }
  }

  return { transcript, truncated, usedCount: usedLines.length };
}
