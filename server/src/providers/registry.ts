export interface ModelInfo {
  id: string;
  provider: string;
  displayName: string;
  contextWindow: number;
  isDefault: boolean;
  costPer1KTokens: number;
}

export const models: ModelInfo[] = [
  {
    id: 'deepseek-chat',
    provider: 'deepseek',
    displayName: 'DeepSeek Chat',
    contextWindow: 64_000,
    isDefault: true,
    costPer1KTokens: 0.001,
  },
  {
    id: 'deepseek-reasoner',
    provider: 'deepseek',
    displayName: 'DeepSeek Reasoner',
    contextWindow: 64_000,
    isDefault: false,
    costPer1KTokens: 0.004,
  },
  {
    id: 'gpt-4o',
    provider: 'openai',
    displayName: 'GPT-4o',
    contextWindow: 128_000,
    isDefault: false,
    costPer1KTokens: 0.005,
  },
  {
    id: 'gpt-4o-mini',
    provider: 'openai',
    displayName: 'GPT-4o Mini',
    contextWindow: 128_000,
    isDefault: false,
    costPer1KTokens: 0.00015,
  },
  {
    id: 'claude-sonnet-4-20250514',
    provider: 'anthropic',
    displayName: 'Claude Sonnet 4',
    contextWindow: 200_000,
    isDefault: false,
    costPer1KTokens: 0.003,
  },
  {
    id: 'claude-opus-4-20250514',
    provider: 'anthropic',
    displayName: 'Claude Opus 4',
    contextWindow: 200_000,
    isDefault: false,
    costPer1KTokens: 0.015,
  },
];

export function getModelById(modelId: string): ModelInfo | null {
  return models.find((m) => m.id === modelId) ?? null;
}

export function getModels(): ModelInfo[] {
  return models.filter((m) => {
    const envKey = m.provider === 'openai' ? 'OPENAI_API_KEY'
      : m.provider === 'anthropic' ? 'ANTHROPIC_API_KEY'
      : `${m.provider.toUpperCase()}_API_KEY`;
    return !!process.env[envKey];
  });
}

export function getDefaultModel(): ModelInfo {
  // Prefer DeepSeek as default if configured, otherwise OpenAI
  const deepseekModel = models.find((m) => m.isDefault && m.provider === 'deepseek' && process.env.DEEPSEEK_API_KEY);
  if (deepseekModel) return deepseekModel;

  const openaiModel = models.find((m) => m.isDefault && m.provider === 'openai' && process.env.OPENAI_API_KEY);
  if (openaiModel) return openaiModel;

  return models[0];
}
