import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { prisma } from '../db';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  const range = (req.query.range as 'day' | 'week' | 'month') || 'day';
  const days = range === 'month' ? 30 : range === 'week' ? 7 : 1;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const records = await prisma.usageRecord.findMany({
    where: {
      userId: req.userId,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Aggregate by date
  const byDate: Record<string, { date: string; totalTokens: number; cost: number; requestCount: number }> = {};
  for (const record of records) {
    const date = record.createdAt.toISOString().split('T')[0];
    if (!byDate[date]) {
      byDate[date] = { date, totalTokens: 0, cost: 0, requestCount: 0 };
    }
    byDate[date].totalTokens += record.totalTokens;
    byDate[date].cost += record.costEstimate;
    byDate[date].requestCount += 1;
  }

  // By model
  const byModel: Record<string, { model: string; totalTokens: number; cost: number; requestCount: number }> = {};
  for (const record of records) {
    if (!byModel[record.model]) {
      byModel[record.model] = { model: record.model, totalTokens: 0, cost: 0, requestCount: 0 };
    }
    byModel[record.model].totalTokens += record.totalTokens;
    byModel[record.model].cost += record.costEstimate;
    byModel[record.model].requestCount += 1;
  }

  const totalTokens = records.reduce((sum: number, r: { totalTokens: number }) => sum + r.totalTokens, 0);
  const totalCost = records.reduce((sum: number, r: { costEstimate: number }) => sum + r.costEstimate, 0);

  res.json({
    summary: { totalTokens, totalCost, requestCount: records.length, range, days },
    byDate: Object.values(byDate),
    byModel: Object.values(byModel),
  });
});

export default router;
