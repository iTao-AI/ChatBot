import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { prisma } from '../db';
import { getProviderForModel } from '../providers/router';
import { getModels, getModelById, getDefaultModel } from '../providers/registry';
import { processUserMessage, truncateToContextWindow } from '../services/context';

const router = Router();

// SSE streaming endpoint
router.post('/stream', authMiddleware, async (req: AuthRequest, res) => {
  const { conversationId, content, modelId } = req.body;

  if (!conversationId || !content) {
    return res.status(400).json({ error: 'conversationId and content are required' });
  }

  // Verify conversation ownership
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId: req.userId },
  });
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const model = modelId ? getModelById(modelId) : getDefaultModel();
  if (!model) {
    return res.status(400).json({ error: 'Invalid model', available: getModels().map((m) => m.id) });
  }

  // Process user message (injection defense)
  const { text: processedContent, blocked } = processUserMessage(content);
  if (blocked) {
    return res.status(400).json({ error: 'Message contains potentially unsafe content' });
  }

  // Save user message
  await prisma.message.create({
    data: {
      conversationId,
      role: 'user',
      content: { text: content },
    },
  });

  // Build conversation context
  const allMessages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
  });

  const chatMessages = allMessages.map((m: { role: string; content: unknown }) => ({
    role: m.role as 'user' | 'assistant' | 'system',
    content: (m.content as any).text || '',
  }));

  // Truncate to context window
  const contextMessages = truncateToContextWindow(chatMessages, conversation.systemPrompt, model.id);

  const provider = getProviderForModel(model.id);

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const sendEvent = (event: string, data: object) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const abortController = new AbortController();

  // Detect client disconnect
  res.on('close', () => {
    abortController.abort();
  });

  // Heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    sendEvent('heartbeat', { ping: Date.now() });
  }, 30000);

  try {
    const startTime = Date.now();
    let fullContent = '';

    const response = await provider.streamChat(
      contextMessages,
      conversation.systemPrompt,
      model.id,
      abortController.signal,
      (chunk) => {
        fullContent += chunk.token;
        sendEvent('token', { token: chunk.token });
      },
    );

    clearInterval(heartbeat);

    // Send completion with metadata
    const responseTime = Date.now() - startTime;
    const finalResponse = {
      model: response.model,
      promptTokens: response.promptTokens,
      completionTokens: response.completionTokens,
      totalTokens: response.totalTokens,
      responseTimeMs: responseTime,
      costEstimate: (response.totalTokens / 1000) * model.costPer1KTokens,
    };

    sendEvent('done', finalResponse);

    // Save assistant message
    await prisma.message.create({
      data: {
        conversationId,
        role: 'assistant',
        content: { text: fullContent },
        modelUsed: response.model,
        tokenCount: response.totalTokens,
      },
    });

    // Save usage record
    if (req.userId) {
      await prisma.usageRecord.create({
        data: {
          userId: req.userId,
          model: response.model,
          promptTokens: response.promptTokens,
          completionTokens: response.completionTokens,
          totalTokens: response.totalTokens,
          costEstimate: finalResponse.costEstimate,
        },
      });
    }
  } catch (error: any) {
    clearInterval(heartbeat);
    if (error.name === 'AbortError') {
      sendEvent('done', { cancelled: true });
    } else {
      sendEvent('error', { message: error.message || 'Unknown error occurred' });
    }
  } finally {
    res.end();
  }
});

// Get available models
router.get('/models', authMiddleware, (_req: AuthRequest, res) => {
  const available = getModels();
  res.json({ models: available, default: getDefaultModel().id });
});

export default router;
