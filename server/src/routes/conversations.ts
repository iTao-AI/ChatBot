import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { prisma } from '../db';
import { z } from 'zod';

const router = Router();
const createSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  systemPrompt: z.string().max(2000).optional(),
  modelId: z.string().max(100).optional(),
});

// Create conversation
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  const result = createSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Validation failed', details: result.error.errors });
  }

  const { title, systemPrompt, modelId } = result.data;
  const conversation = await prisma.conversation.create({
    data: {
      userId: req.userId,
      title: title || 'New Conversation',
      systemPrompt: systemPrompt || 'You are a helpful assistant.',
      modelId: modelId || 'gpt-4',
    },
  });

  res.status(201).json(conversation);
});

// List conversations (paginated)
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where: { userId: req.userId },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: { id: true, title: true, modelId: true, createdAt: true, updatedAt: true },
    }),
    prisma.conversation.count({ where: { userId: req.userId } }),
  ]);

  res.json({
    data: conversations,
    pagination: { page, limit, total, hasMore: page * limit < total },
  });
});

// Search conversations
router.get('/search', authMiddleware, async (req: AuthRequest, res) => {
  const query = req.query.q as string;
  if (!query?.trim()) {
    return res.json({ data: [] });
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      userId: req.userId,
      searchVector: { search: query },
    },
    orderBy: { updatedAt: 'desc' },
    take: 20,
    select: { id: true, title: true, modelId: true, updatedAt: true },
  });

  res.json({ data: conversations });
});

// Rename conversation
router.patch('/:id', authMiddleware, async (req: AuthRequest, res) => {
  const { title } = req.body;
  if (!title || typeof title !== 'string' || title.length > 200) {
    return res.status(400).json({ error: 'Title is required and must be under 200 characters' });
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const updated = await prisma.conversation.update({
    where: { id: req.params.id },
    data: { title },
  });

  res.json(updated);
});

// Delete conversation
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  const conversation = await prisma.conversation.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  await prisma.conversation.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// Get messages for a conversation
router.get('/:id/messages', authMiddleware, async (req: AuthRequest, res) => {
  const conversation = await prisma.conversation.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const messages = await prisma.message.findMany({
    where: { conversationId: req.params.id },
    orderBy: { createdAt: 'asc' },
  });

  res.json(messages);
});

// Save a message
router.post('/:id/messages', authMiddleware, async (req: AuthRequest, res) => {
  const conversation = await prisma.conversation.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const { role, content, modelUsed, tokenCount } = req.body;
  if (!role || !content) {
    return res.status(400).json({ error: 'Role and content are required' });
  }

  const message = await prisma.message.create({
    data: {
      conversationId: req.params.id,
      role,
      content,
      modelUsed,
      tokenCount,
    },
  });

  res.status(201).json(message);
});

export default router;
