import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { prisma } from '../db';
import { encryptApiKey, decryptApiKey, maskApiKey } from '../services/crypto';
import { z } from 'zod';

const router = Router();

const configSchema = z.object({
  provider: z.enum(['openai', 'anthropic']),
  apiKey: z.string().min(1, 'API key is required'),
  baseUrl: z.string().optional(),
  isActive: z.boolean().default(true),
});

// List all configured providers (masked keys)
router.get('/', authMiddleware, async (_req: AuthRequest, res) => {
  const configs = await prisma.apiConfig.findMany({
    orderBy: { provider: 'asc' },
  });

  const result = configs.map((c) => ({
    id: c.id,
    provider: c.provider,
    apiKey: maskApiKey(c.apiKey),
    baseUrl: c.baseUrl,
    isActive: c.isActive,
    updatedAt: c.updatedAt,
  }));

  res.json({ configs: result });
});

// Get decrypted key for a specific provider (internal use)
router.get('/:provider/key', authMiddleware, async (req: AuthRequest, res) => {
  const { provider } = req.params;
  const config = await prisma.apiConfig.findUnique({ where: { provider } });

  if (!config || !config.isActive) {
    return res.status(404).json({ error: `No active config for ${provider}` });
  }

  res.json({ provider, apiKey: decryptApiKey(config.apiKey), baseUrl: config.baseUrl });
});

// Add or update API config
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  const result = configSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Validation failed', details: result.error.errors });
  }

  const { provider, apiKey, baseUrl, isActive } = result.data;
  const encryptedKey = encryptApiKey(apiKey);

  const config = await prisma.apiConfig.upsert({
    where: { provider },
    update: { apiKey: encryptedKey, baseUrl, isActive },
    create: { provider, apiKey: encryptedKey, baseUrl, isActive },
  });

  res.json({
    id: config.id,
    provider: config.provider,
    apiKey: maskApiKey(config.apiKey),
    baseUrl: config.baseUrl,
    isActive: config.isActive,
  });
});

// Delete API config
router.delete('/:provider', authMiddleware, async (req: AuthRequest, res) => {
  const { provider } = req.params;
  const config = await prisma.apiConfig.findUnique({ where: { provider } });

  if (!config) {
    return res.status(404).json({ error: `No config for ${provider}` });
  }

  await prisma.apiConfig.delete({ where: { provider } });
  res.status(204).send();
});

// Toggle active status
router.patch('/:provider/toggle', authMiddleware, async (req: AuthRequest, res) => {
  const { provider } = req.params;
  const config = await prisma.apiConfig.findUnique({ where: { provider } });

  if (!config) {
    return res.status(404).json({ error: `No config for ${provider}` });
  }

  const updated = await prisma.apiConfig.update({
    where: { provider },
    data: { isActive: !config.isActive },
  });

  res.json({
    provider: updated.provider,
    isActive: updated.isActive,
  });
});

export default router;
