'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { UsageData } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function UsagePage() {
  const { isAuthenticated } = useAuthStore();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [range, setRange] = useState<'day' | 'week' | 'month'>('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    api.usage
      .get(range)
      .then(setUsage)
      .catch(() => setError('Failed to load usage data'))
      .finally(() => setLoading(false));
  }, [range, isAuthenticated]);

  if (!isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Sign in to view usage.</div>;
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading usage data...</div>;
  }

  if (error || !usage) {
    return <div className="min-h-screen flex items-center justify-center text-red-400">{error ?? 'No data'}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Usage Dashboard</h1>
          <div className="flex gap-2">
            {(['day', 'week', 'month'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  range === r ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
            <p className="text-sm text-gray-400">Total Tokens</p>
            <p className="text-2xl font-bold mt-1">{usage.summary.totalTokens.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
            <p className="text-sm text-gray-400">Estimated Cost</p>
            <p className="text-2xl font-bold mt-1">${usage.summary.totalCost.toFixed(4)}</p>
          </div>
          <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
            <p className="text-sm text-gray-400">Requests</p>
            <p className="text-2xl font-bold mt-1">{usage.summary.requestCount}</p>
          </div>
        </div>

        {/* Daily chart */}
        {usage.byDate.length > 0 && (
          <div className="mb-8 p-4 bg-gray-900 rounded-lg border border-gray-800">
            <h2 className="text-lg font-semibold mb-4">Tokens per Day</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usage.byDate}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  />
                  <Bar dataKey="totalTokens" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Model breakdown */}
        {usage.byModel.length > 0 && (
          <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
            <h2 className="text-lg font-semibold mb-4">By Model</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={usage.byModel}
                    dataKey="totalTokens"
                    nameKey="model"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {usage.byModel.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {usage.byDate.length === 0 && usage.byModel.length === 0 && (
          <div className="text-center text-gray-500 py-12">No usage data for this period.</div>
        )}
      </div>
    </div>
  );
}
