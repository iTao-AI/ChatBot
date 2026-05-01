'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface ApiConfig {
  id: string;
  provider: string;
  apiKey: string;
  baseUrl: string | null;
  isActive: boolean;
  updatedAt: string;
}

const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
};

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [configs, setConfigs] = useState<ApiConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [provider, setProvider] = useState('openai');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadConfigs = async () => {
    try {
      const res = await fetch('/api/config', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setConfigs(data.configs || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!apiKey.trim()) {
      setError('API key is required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          provider,
          apiKey: apiKey.trim(),
          baseUrl: baseUrl.trim() || undefined,
        }),
      });
      if (res.ok) {
        setApiKey('');
        setBaseUrl('');
        setShowForm(false);
        await loadConfigs();
      } else {
        const body = await res.json().catch(() => ({ error: 'Failed to save' }));
        setError(body.error || 'Failed to save');
      }
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (providerName: string) => {
    if (!confirm(`Remove ${PROVIDER_LABELS[providerName]} API key?`)) return;
    try {
      await fetch(`/api/config/${providerName}`, { method: 'DELETE', credentials: 'include' });
      await loadConfigs();
    } catch {
      // silently fail
    }
  };

  const handleToggle = async (providerName: string) => {
    try {
      await fetch(`/api/config/${providerName}/toggle`, { method: 'PATCH', credentials: 'include' });
      await loadConfigs();
    } catch {
      // silently fail
    }
  };

  const existingProviders = new Set(configs.map((c) => c.provider));
  const availableProviders = Object.keys(PROVIDER_LABELS).filter((p) => !existingProviders.has(p) || showForm);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        {/* Account */}
        <section className="mb-8 p-4 bg-gray-900 rounded-lg border border-gray-800">
          <h2 className="text-lg font-semibold mb-3">Account</h2>
          <p className="text-sm text-gray-400">Email: {user?.email}</p>
          <button
            onClick={handleLogout}
            className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-sm transition-colors"
          >
            Sign out
          </button>
        </section>

        {/* API Configuration */}
        <section className="mb-8 p-4 bg-gray-900 rounded-lg border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">API Configuration</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              {showForm ? 'Cancel' : '+ Add Key'}
            </button>
          </div>

          {error && (
            <div className="mb-3 p-2 bg-red-900/50 border border-red-700 rounded text-red-300 text-sm" role="alert">
              {error}
            </div>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="mb-4 space-y-3 p-3 bg-gray-800 rounded-md">
              <div>
                <label className="block text-sm font-medium mb-1">Provider</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-sm"
                >
                  {Object.entries(PROVIDER_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Base URL (optional)</label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-sm transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </form>
          )}

          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : configs.length === 0 ? (
            <p className="text-sm text-gray-500">No API keys configured. Add one to start chatting.</p>
          ) : (
            <div className="space-y-2">
              {configs.map((config) => (
                <div key={config.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-md">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{PROVIDER_LABELS[config.provider] || config.provider}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${config.isActive ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                        {config.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Key: {config.apiKey} {config.baseUrl && `· Base: ${config.baseUrl}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggle(config.provider)}
                      className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                    >
                      {config.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDelete(config.provider)}
                      className="px-2 py-1 text-xs bg-red-900/50 hover:bg-red-900 text-red-300 rounded transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* About */}
        <section className="p-4 bg-gray-900 rounded-lg border border-gray-800">
          <h2 className="text-lg font-semibold mb-3">About</h2>
          <p className="text-sm text-gray-400">ChatBot v0.1.0 — A ChatGPT-like conversation system.</p>
        </section>
      </div>
    </div>
  );
}
