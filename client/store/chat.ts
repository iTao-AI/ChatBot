import { create } from 'zustand';
import { Conversation, Message, ModelInfo } from '@/types';
import { api } from '@/lib/api';
import { createSSEClient, SSECallbacks } from '@/lib/sse-client';

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  models: ModelInfo[];
  selectedModel: string;
  isLoading: boolean;
  isStreaming: boolean;
  searchQuery: string;
  searchResults: Conversation[];

  // Conversations
  loadConversations: () => Promise<void>;
  createConversation: (data?: { title?: string; modelId?: string }) => Promise<Conversation>;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, title: string) => Promise<void>;
  selectConversation: (id: string) => Promise<void>;
  searchConversations: (query: string) => Promise<void>;

  // Chat
  loadModels: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  stopStreaming: () => void;

  // UI
  setSearchQuery: (query: string) => void;
  setSelectedModel: (modelId: string) => void;
}

let currentStreamController: AbortController | null = null;

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  models: [],
  selectedModel: 'gpt-4o',
  isLoading: false,
  isStreaming: false,
  searchQuery: '',
  searchResults: [],

  loadConversations: async () => {
    try {
      const { data } = await api.conversations.list();
      set({ conversations: data });
    } catch {
      // Silently fail - conversations will be empty
    }
  },

  createConversation: async (data) => {
    const conversation = await api.conversations.create(data);
    set((state) => ({
      conversations: [conversation, ...state.conversations],
      currentConversation: conversation,
      messages: [],
    }));
    return conversation;
  },

  deleteConversation: async (id) => {
    await api.conversations.delete(id);
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
      currentConversation: state.currentConversation?.id === id ? null : state.currentConversation,
      messages: state.currentConversation?.id === id ? [] : state.messages,
    }));
  },

  renameConversation: async (id, title) => {
    await api.conversations.update(id, title);
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, title } : c
      ),
    }));
  },

  selectConversation: async (id) => {
    const conversation = get().conversations.find((c) => c.id === id);
    if (!conversation) return;

    set({ currentConversation: conversation, isLoading: true });
    try {
      const messages = await api.conversations.messages(id);
      set({ messages, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  searchConversations: async (query) => {
    if (!query.trim()) {
      set({ searchResults: [], searchQuery: '' });
      return;
    }
    set({ searchQuery: query });
    try {
      const { data } = await api.conversations.search(query);
      set({ searchResults: data });
    } catch {
      set({ searchResults: [] });
    }
  },

  loadModels: async () => {
    try {
      const { models, default: defaultModel } = await api.chat.models();
      set({ models, selectedModel: defaultModel });
    } catch {
      // Use defaults if API unavailable
    }
  },

  sendMessage: async (content) => {
    const { currentConversation, selectedModel, messages } = get();
    if (!currentConversation || !content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      conversationId: currentConversation.id,
      role: 'user',
      content: { text: content },
      createdAt: new Date().toISOString(),
    };

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      conversationId: currentConversation.id,
      role: 'assistant',
      content: { text: '' },
      modelUsed: selectedModel,
      createdAt: new Date().toISOString(),
    };

    set({
      messages: [...messages, userMessage, assistantMessage],
      isStreaming: true,
    });

    const callbacks: SSECallbacks = {
      onToken: (token) => {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantMessage.id
              ? { ...m, content: { text: m.content.text + token } }
              : m
          ),
        }));
      },
      onDone: (metadata) => {
        set((state) => ({
          isStreaming: false,
          messages: state.messages.map((m) =>
            m.id === assistantMessage.id
              ? { ...m, modelUsed: (metadata.model as string) ?? selectedModel, tokenCount: (metadata.totalTokens as number) ?? 0 }
              : m
          ),
        }));
        currentStreamController = null;
      },
      onError: (error) => {
        set((state) => ({
          isStreaming: false,
          messages: state.messages.map((m) =>
            m.id === assistantMessage.id
              ? { ...m, content: { text: `Error: ${error}` } }
              : m
          ),
        }));
        currentStreamController = null;
      },
      onAbort: () => {
        set({ isStreaming: false });
        currentStreamController = null;
      },
    };

    currentStreamController = createSSEClient(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/chat/stream`,
      { conversationId: currentConversation.id, content, modelId: selectedModel },
      '', // Token will be added via interceptor in production
      callbacks,
    );
  },

  stopStreaming: () => {
    if (currentStreamController) {
      currentStreamController.abort();
      currentStreamController = null;
      set({ isStreaming: false });
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedModel: (modelId) => set({ selectedModel: modelId }),
}));
