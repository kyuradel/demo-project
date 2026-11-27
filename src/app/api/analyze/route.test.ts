import { afterEach, describe, expect, it } from "vitest";
import { POST } from "./route";

function requestWithCsv(csv: string) {
  const formData = new FormData();
  formData.append("file", new Blob([csv], { type: "text/csv" }), "chat.csv");
  return new Request("http://localhost/api/analyze", { method: "POST", body: formData });
}

describe("POST /api/analyze — MOCK_GEMINI", () => {
  afterEach(() => {
    delete process.env.MOCK_GEMINI;
    delete process.env.GEMINI_API_KEY;
  });

  it("returns the fixed mock response without calling Gemini or requiring an API key", async () => {
    process.env.MOCK_GEMINI = "1";
    delete process.env.GEMINI_API_KEY;

    const csv = "timestamp,sender,message\n2024-01-01,민호,안녕하세요\n";
    const res = await POST(requestWithCsv(csv));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(typeof data.summary).toBe("string");
    expect(data.summary).toContain("[MOCK]");
    expect(Array.isArray(data.actionItems)).toBe(true);
    expect(data.actionItems.length).toBeGreaterThan(0);
    // activeUsers/messageCount are still computed from the real CSV, not mocked
    expect(data.activeUsers).toEqual([{ name: "민호", messageCount: 1 }]);
    expect(data.messageCount).toBe(1);
  });

  it("still requires GEMINI_API_KEY when MOCK_GEMINI is not set", async () => {
    delete process.env.MOCK_GEMINI;
    delete process.env.GEMINI_API_KEY;

    const res = await POST(requestWithCsv("timestamp,sender,message\n2024-01-01,민호,hi\n"));
    expect(res.status).toBe(500);
  });
});
