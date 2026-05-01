import { ChatMessage } from '../providers/types';
import { getModelById } from '../providers/registry';

// Strip control characters that could be used for injection
function sanitizeInput(input: string): string {
  return input.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim();
}

// Detect common system prompt override attempts
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above)\s+(instruction|prompt|rule)/i,
  /you\s+are\s+now\s+/i,
  /system\s*:\s*/i,
  /<\|system\|>/i,
  /\[system\]/i,
];

function detectInjection(input: string): boolean {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(input));
}

// Wrap user input in delimiter tags to contain it
function wrapUserInput(input: string): string {
  return `<user_input>\n${input}\n</user_input>`;
}

export function processUserMessage(content: string): { text: string; blocked: boolean } {
  const sanitized = sanitizeInput(content);
  const isInjection = detectInjection(sanitized);

  return {
    text: wrapUserInput(sanitized),
    blocked: isInjection,
  };
}

export function truncateToContextWindow(
  messages: ChatMessage[],
  systemPrompt: string,
  modelId: string,
): ChatMessage[] {
  const model = getModelById(modelId);
  if (!model) return messages;

  // Estimate: ~4 chars per token (rough average)
  const maxChars = model.contextWindow * 4;
  const systemChars = systemPrompt.length * 2; // system messages count double
  const availableChars = maxChars - systemChars;

  // Build from newest to oldest, keeping as many messages as fit
  const result: ChatMessage[] = [];
  let usedChars = 0;

  for (let i = messages.length - 1; i >= 0; i--) {
    const msgChars = messages[i].content.length * 2; // assistant messages count more
    if (usedChars + msgChars > availableChars) break;
    result.unshift(messages[i]);
    usedChars += msgChars;
  }

  return result;
}
