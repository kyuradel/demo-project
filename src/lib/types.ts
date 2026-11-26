export type ActionItem = {
  task: string;
  owner: string | null;
  priority: "high" | "medium" | "low";
};

export type AnalysisResult = {
  summary: string;
  actionItems: ActionItem[];
  messageCount: number;
  truncated: boolean;
};

export type ChatMessage = {
  timestamp: string | null;
  sender: string | null;
  text: string;
};
