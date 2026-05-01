export interface User {
  id: string;
  email: string;
}

export interface Conversation {
  id: string;
  title: string;
  modelId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: { text: string };
  modelUsed?: string;
  tokenCount?: number;
  createdAt: string;
}

export interface ModelInfo {
  id: string;
  provider: string;
  displayName: string;
  contextWindow: number;
  isDefault: boolean;
  costPer1KTokens: number;
}

export interface UsageData {
  summary: {
    totalTokens: number;
    totalCost: number;
    requestCount: number;
    range: 'day' | 'week' | 'month';
    days: number;
  };
  byDate: { date: string; totalTokens: number; cost: number; requestCount: number }[];
  byModel: { model: string; totalTokens: number; cost: number; requestCount: number }[];
}
