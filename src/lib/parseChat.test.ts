import { describe, expect, it } from "vitest";
import { parseChatCsv, toTranscript, topActiveUsers } from "./parseChat";
import type { ChatMessage } from "./types";

describe("parseChatCsv", () => {
  it("parses recognized timestamp/sender/message columns", () => {
    const csv = "timestamp,sender,message\n2024-01-01,민호,안녕하세요\n2024-01-02,지민,반갑습니다\n";
    expect(parseChatCsv(csv)).toEqual([
      { timestamp: "2024-01-01", sender: "민호", text: "안녕하세요" },
      { timestamp: "2024-01-02", sender: "지민", text: "반갑습니다" },
    ]);
  });

  it("matches header aliases case-insensitively (author/content)", () => {
    const csv = "Date,Author,Content\n2024-01-01,수연,hello\n";
    expect(parseChatCsv(csv)).toEqual([
      { timestamp: "2024-01-01", sender: "수연", text: "hello" },
    ]);
  });

  it("falls back to joining all fields when no message column is recognized", () => {
    const csv = "col_a,col_b\nfoo,bar\n";
    expect(parseChatCsv(csv)).toEqual([
      { timestamp: null, sender: null, text: "foo bar" },
    ]);
  });

  it("drops rows whose resulting text is empty", () => {
    const csv = "sender,message\n민호,\n지민,hi\n";
    expect(parseChatCsv(csv)).toEqual([
      { timestamp: null, sender: "지민", text: "hi" },
    ]);
  });

  it("returns an empty array for an empty CSV", () => {
    expect(parseChatCsv("")).toEqual([]);
  });
});

describe("toTranscript", () => {
  it("joins messages with [timestamp sender] prefixes and does not truncate short logs", () => {
    const messages: ChatMessage[] = [
      { timestamp: "10:00", sender: "민호", text: "안녕" },
      { timestamp: null, sender: "지민", text: "안녕하세요" },
    ];
    const result = toTranscript(messages);
    expect(result.truncated).toBe(false);
    expect(result.usedCount).toBe(2);
    expect(result.transcript).toBe("[10:00 민호] 안녕\n[지민] 안녕하세요");
  });

  it("omits the bracket prefix entirely when there is no timestamp or sender", () => {
    const messages: ChatMessage[] = [{ timestamp: null, sender: null, text: "hello" }];
    expect(toTranscript(messages).transcript).toBe("hello");
  });

  it("truncates from the oldest messages when the transcript exceeds the character limit", () => {
    const longText = "x".repeat(1000);
    const messages: ChatMessage[] = Array.from({ length: 100 }, (_, i) => ({
      timestamp: null,
      sender: null,
      text: `${i}:${longText}`,
    }));
    const result = toTranscript(messages);
    expect(result.truncated).toBe(true);
    expect(result.usedCount).toBeLessThan(messages.length);
    expect(result.transcript.length).toBeLessThanOrEqual(60000);
    // oldest messages (low indices) should have been dropped first
    expect(result.transcript.startsWith("0:")).toBe(false);
    expect(result.transcript).toContain(`${messages.length - 1}:`);
  });
});

describe("topActiveUsers", () => {
  it("counts messages per sender and sorts descending", () => {
    const messages: ChatMessage[] = [
      { timestamp: null, sender: "민호", text: "a" },
      { timestamp: null, sender: "지민", text: "b" },
      { timestamp: null, sender: "민호", text: "c" },
      { timestamp: null, sender: "지민", text: "d" },
      { timestamp: null, sender: "지민", text: "e" },
    ];
    expect(topActiveUsers(messages)).toEqual([
      { name: "지민", messageCount: 3 },
      { name: "민호", messageCount: 2 },
    ]);
  });

  it("ignores messages with null or blank senders", () => {
    const messages: ChatMessage[] = [
      { timestamp: null, sender: null, text: "a" },
      { timestamp: null, sender: "  ", text: "b" },
      { timestamp: null, sender: "하늘", text: "c" },
    ];
    expect(topActiveUsers(messages)).toEqual([{ name: "하늘", messageCount: 1 }]);
  });

  it("respects the limit parameter", () => {
    const messages: ChatMessage[] = ["a", "b", "c"].map((sender) => ({
      timestamp: null,
      sender,
      text: "hi",
    }));
    expect(topActiveUsers(messages, 2)).toHaveLength(2);
  });

  it("returns an empty array when there are no messages", () => {
    expect(topActiveUsers([])).toEqual([]);
  });
});
