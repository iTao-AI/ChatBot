import Anthropic from '@anthropic-ai/sdk';
import { ChatProvider, ChatMessage, ChatResponse, StreamChunk } from './types';

export class AnthropicProvider implements ChatProvider {
  name = 'anthropic';
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async chat(messages: ChatMessage[], systemPrompt: string, model: string): Promise<ChatResponse> {
    const response = await this.client.messages.create({
      model,
      system: systemPrompt,
      messages: messages as any,
      max_tokens: 4096,
    });

    const content = response.content[0];
    const text = content.type === 'text' ? content.text : '';

    return {
      content: text,
      model,
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens,
    };
  }

  async streamChat(
    messages: ChatMessage[],
    systemPrompt: string,
    model: string,
    signal: AbortSignal,
    onChunk: (chunk: StreamChunk) => void,
  ): Promise<ChatResponse> {
    let totalInput = 0;
    let totalOutput = 0;
    let content = '';

    const stream = await this.client.messages.create({
      model,
      system: systemPrompt,
      messages: messages as any,
      max_tokens: 4096,
      stream: true,
    });

    for await (const event of stream) {
      if (signal.aborted) break;
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        const text = event.delta.text;
        content += text;
        onChunk({ token: text });
      }
      if (event.type === 'message_delta') {
        totalOutput = event.usage.output_tokens;
      }
    }

    totalInput = Math.max(0, totalOutput > 0 ? 0 : 0); // Anthropic doesn't report input tokens in streaming
    return { content, model, promptTokens: totalInput, completionTokens: totalOutput, totalTokens: totalInput + totalOutput };
  }
}
