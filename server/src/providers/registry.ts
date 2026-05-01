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
    id: 'gpt-4o',
    provider: 'openai',
    displayName: 'GPT-4o',
    contextWindow: 128_000,
    isDefault: true,
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
    const key = m.provider === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY';
    return !!process.env[key];
  });
}

export function getDefaultModel(): ModelInfo {
  return models.find((m) => m.isDefault && process.env.OPENAI_API_KEY) ?? models[0];
}
