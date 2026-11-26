export type ActionItem = {
  task: string;
  owner: string | null;
  priority: "high" | "medium" | "low";
};

export type Topic = {
  title: string;
  detail: string;
};

export type ActiveUser = {
  name: string;
  messageCount: number;
};

export type AnalysisResult = {
  summary: string;
  actionItems: ActionItem[];
  topics: Topic[];
  activeUsers: ActiveUser[];
  mood: string;
  messageCount: number;
  truncated: boolean;
};

export type ChatMessage = {
  timestamp: string | null;
  sender: string | null;
  text: string;
};
