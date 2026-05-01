import OpenAI from 'openai';
import { ChatProvider, ChatMessage, ChatResponse, StreamChunk } from './types';

export class OpenAIProvider implements ChatProvider {
  name = 'openai';
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async chat(messages: ChatMessage[], systemPrompt: string, model: string): Promise<ChatResponse> {
    const allMessages = [{ role: 'system' as const, content: systemPrompt }, ...messages];
    const response = await this.client.chat.completions.create({
      model,
      messages: allMessages as any,
    });

    const choice = response.choices[0];
    return {
      content: choice.message.content || '',
      model: response.model,
      promptTokens: response.usage?.prompt_tokens ?? 0,
      completionTokens: response.usage?.completion_tokens ?? 0,
      totalTokens: response.usage?.total_tokens ?? 0,
    };
  }

  async streamChat(
    messages: ChatMessage[],
    systemPrompt: string,
    model: string,
    signal: AbortSignal,
    onChunk: (chunk: StreamChunk) => void,
  ): Promise<ChatResponse> {
    const allMessages = [{ role: 'system' as const, content: systemPrompt }, ...messages];
    let promptTokens = 0;
    let completionTokens = 0;

    const stream = await this.client.chat.completions.create({
      model,
      messages: allMessages as any,
      stream: true,
    });

    for await (const chunk of stream) {
      if (signal.aborted) break;
      const token = chunk.choices[0]?.delta?.content;
      if (token) {
        onChunk({ token });
      }
      if (chunk.usage) {
        promptTokens = chunk.usage.prompt_tokens ?? 0;
        completionTokens = chunk.usage.completion_tokens ?? 0;
      }
    }

    return {
      content: '', // Content is streamed to client, not returned here
      model,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
    };
  }
}
