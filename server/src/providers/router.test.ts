import { describe, it, expect } from 'vitest';
import { getProviderForModel, getProviderByName } from './router';
import { getModelById } from './registry';

describe('provider routing', () => {
  it('routes gpt-4o to openai provider', () => {
    const model = getModelById('gpt-4o');
    expect(model?.provider).toBe('openai');
  });

  it('routes claude models to anthropic provider', () => {
    const model = getModelById('claude-sonnet-4-20250514');
    expect(model?.provider).toBe('anthropic');
  });

  it('throws for unknown models', () => {
    expect(() => getProviderForModel('unknown-model')).toThrow();
  });

  it('getProviderByName returns correct providers', () => {
    expect(getProviderByName('openai').name).toBe('openai');
    expect(getProviderByName('anthropic').name).toBe('anthropic');
  });
});
