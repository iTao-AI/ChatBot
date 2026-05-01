import { ChatProvider } from './types';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { getModelById } from './registry';

const providers: Record<string, ChatProvider> = {
  openai: new OpenAIProvider(),
  anthropic: new AnthropicProvider(),
};

export function getProviderForModel(modelId: string): ChatProvider {
  const model = getModelById(modelId);
  if (!model) {
    throw new Error(`Unknown model: ${modelId}. Available: ${getModelById(modelId)?.id ?? 'none'}`);
  }
  const provider = providers[model.provider];
  if (!provider) {
    throw new Error(`Provider ${model.provider} not configured`);
  }
  return provider;
}

export function getProviderByName(name: string): ChatProvider {
  return providers[name];
}
