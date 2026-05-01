export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  content: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface StreamChunk {
  token: string;
  finishReason?: 'stop' | 'length' | 'content_filter';
}

export interface ChatProvider {
  name: string;
  chat(messages: ChatMessage[], systemPrompt: string, model: string): Promise<ChatResponse>;
  streamChat(
    messages: ChatMessage[],
    systemPrompt: string,
    model: string,
    signal: AbortSignal,
    onChunk: (chunk: StreamChunk) => void,
  ): Promise<ChatResponse>;
}
