const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body.error ?? 'Request failed');
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  // Auth
  auth: {
    register: (email: string, password: string) =>
      request<{ id: string; email: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    login: (email: string, password: string) =>
      request<{ id: string; email: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    refresh: () =>
      request<{ accessToken: string }>('/api/auth/refresh', { method: 'POST' }),
    logout: () =>
      request<{ message: string }>('/api/auth/logout', { method: 'POST' }),
  },

  // Conversations
  conversations: {
    list: (page = 1, limit = 20) =>
      request<{ data: import('@/types').Conversation[]; pagination: { page: number; limit: number; total: number; hasMore: boolean } }>(
        `/api/conversations?page=${page}&limit=${limit}`
      ),
    create: (data?: { title?: string; systemPrompt?: string; modelId?: string }) =>
      request<import('@/types').Conversation>('/api/conversations', {
        method: 'POST',
        body: JSON.stringify(data ?? {}),
      }),
    update: (id: string, title: string) =>
      request<import('@/types').Conversation>(`/api/conversations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title }),
      }),
    delete: (id: string) =>
      request<void>(`/api/conversations/${id}`, { method: 'DELETE' }),
    messages: (id: string) =>
      request<import('@/types').Message[]>(`/api/conversations/${id}/messages`),
    sendMessage: (id: string, role: string, content: string, modelUsed?: string) =>
      request<import('@/types').Message>(`/api/conversations/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ role, content, modelUsed }),
      }),
    search: (query: string) =>
      request<{ data: import('@/types').Conversation[] }>(`/api/conversations/search?q=${encodeURIComponent(query)}`),
  },

  // Chat
  chat: {
    models: () =>
      request<{ models: import('@/types').ModelInfo[]; default: string }>('/api/chat/models'),
  },

  // Usage
  usage: {
    get: (range: 'day' | 'week' | 'month' = 'day') =>
      request<import('@/types').UsageData>(`/api/usage?range=${range}`),
  },

  // Health
  health: () =>
    request<{ status: string; timestamp: string }>('/api/health'),
};
