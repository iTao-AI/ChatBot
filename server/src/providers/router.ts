import { ChatProvider } from './types';
import { getModelById, getModels } from './registry';
import { prisma } from '../db';
import { decryptApiKey } from '../services/crypto';

const providerCache: Record<string, { provider: ChatProvider; apiKeyHash: string }> = {};

async function getDbApiKey(providerName: string): Promise<string | null> {
  try {
    const config = await prisma.apiConfig.findFirst({
      where: { provider: providerName, isActive: true },
    });
    if (!config) return null;
    return decryptApiKey(config.apiKey);
  } catch {
    return null;
  }
}

async function getProviderInstance(name: string): Promise<ChatProvider | null> {
  const cached = providerCache[name];
  if (cached) return cached.provider;

  // Try database first, then env variable
  let apiKey = await getDbApiKey(name);
  if (!apiKey) {
    const envKey = name === 'openai' ? 'OPENAI_API_KEY'
      : name === 'anthropic' ? 'ANTHROPIC_API_KEY'
      : `${name.toUpperCase()}_API_KEY`;
    apiKey = process.env[envKey];
  }
  if (!apiKey) return null;

  if (name === 'openai') {
    const { OpenAIProvider } = require('./openai');
    const baseURL = process.env.OPENAI_BASE_URL;
    const instance = new OpenAIProvider(apiKey, baseURL);
    providerCache[name] = { provider: instance, apiKeyHash: apiKey.slice(-8) };
    return instance;
  } else if (name === 'deepseek') {
    // DeepSeek uses OpenAI-compatible API
    const { OpenAIProvider } = require('./openai');
    const baseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
    const instance = new OpenAIProvider(apiKey, baseURL);
    providerCache[name] = { provider: instance, apiKeyHash: apiKey.slice(-8) };
    return instance;
  } else if (name === 'anthropic') {
    const { AnthropicProvider } = require('./anthropic');
    const instance = new AnthropicProvider(apiKey);
    providerCache[name] = { provider: instance, apiKeyHash: apiKey.slice(-8) };
    return instance;
  }

  return null;
}

export async function getProviderForModel(modelId: string): Promise<ChatProvider> {
  const model = getModelById(modelId);
  if (!model) {
    throw new Error(`Unknown model: ${modelId}. Available models: ${getModels().map((m) => m.id).join(', ') || 'none (no API keys configured)'}`);
  }
  const provider = await getProviderInstance(model.provider);
  if (!provider) {
    throw new Error(`Provider ${model.provider} not configured (missing API key — set via /api/config or env var)`);
  }
  return provider;
}

export async function getProviderByName(name: string): Promise<ChatProvider | null> {
  return getProviderInstance(name);
}
