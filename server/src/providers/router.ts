import { ChatProvider } from './types';
import { getModelById, getModels } from './registry';

const providerCache: Record<string, ChatProvider> = {};

function getProviderInstance(name: string): ChatProvider | null {
  if (providerCache[name]) return providerCache[name];

  const apiKey = name === 'openai' ? process.env.OPENAI_API_KEY : process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  if (name === 'openai') {
    const { OpenAIProvider } = require('./openai');
    providerCache[name] = new OpenAIProvider();
  } else if (name === 'anthropic') {
    const { AnthropicProvider } = require('./anthropic');
    providerCache[name] = new AnthropicProvider();
  }

  return providerCache[name] ?? null;
}

export function getProviderForModel(modelId: string): ChatProvider {
  const model = getModelById(modelId);
  if (!model) {
    throw new Error(`Unknown model: ${modelId}. Available models: ${getModels().map((m) => m.id).join(', ') || 'none (no API keys configured)'}`);
  }
  const provider = getProviderInstance(model.provider);
  if (!provider) {
    throw new Error(`Provider ${model.provider} not configured (missing API key)`);
  }
  return provider;
}

export function getProviderByName(name: string): ChatProvider | null {
  return getProviderInstance(name);
}
