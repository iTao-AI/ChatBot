'use client';

import { useState, useEffect } from 'react';
import { Conversation } from '@/types';
import { useChatStore } from '@/store/chat';

export function Sidebar() {
  const {
    conversations,
    currentConversation,
    searchQuery,
    searchResults,
    loadConversations,
    createConversation,
    deleteConversation,
    selectConversation,
    renameConversation,
    searchConversations,
  } = useChatStore();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleNewChat = async () => {
    setIsCreating(true);
    try {
      await createConversation();
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this conversation?')) {
      await deleteConversation(id);
    }
  };

  const startRename = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const saveRename = async (id: string) => {
    if (editTitle.trim()) {
      await renameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    if (query) {
      searchConversations(query);
    }
  };

  const displayConversations = searchQuery ? searchResults : conversations;

  return (
    <aside className="flex flex-col h-full bg-gray-900 text-white w-64 shrink-0">
      <div className="p-3 border-b border-gray-700">
        <button
          onClick={handleNewChat}
          disabled={isCreating}
          className="w-full px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50"
          aria-label="New conversation"
        >
          {isCreating ? 'Creating...' : '+ New Chat'}
        </button>
      </div>

      <div className="p-2 border-b border-gray-700">
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="w-full px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
          aria-label="Toggle search"
        >
          {showSearch ? 'Hide search' : 'Search conversations'}
        </button>
        {showSearch && (
          <input
            type="text"
            onChange={handleSearch}
            placeholder="Search..."
            className="w-full px-2 py-1 text-sm bg-gray-800 rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none"
            aria-label="Search conversations"
          />
        )}
      </div>

      <nav className="flex-1 overflow-y-auto" aria-label="Conversation list">
        {displayConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            {searchQuery ? 'No conversations found' : 'No conversations yet'}
          </div>
        ) : (
          <ul>
            {displayConversations.map((conv: Conversation) => (
              <li key={conv.id}>
                <button
                  onClick={() => selectConversation(conv.id)}
                  className={`w-full px-3 py-2 text-left text-sm truncate hover:bg-gray-800 transition-colors flex justify-between items-center group ${
                    currentConversation?.id === conv.id ? 'bg-gray-800' : ''
                  }`}
                  aria-current={currentConversation?.id === conv.id ? 'true' : undefined}
                >
                  {editingId === conv.id ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => saveRename(conv.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveRename(conv.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="flex-1 px-1 py-0.5 text-sm bg-gray-700 rounded"
                      autoFocus
                      aria-label="Edit conversation title"
                    />
                  ) : (
                    <span className="flex-1 truncate">{conv.title}</span>
                  )}
                  <div className="hidden group-hover:flex gap-1 ml-2 shrink-0">
                    <button
                      onClick={(e) => startRename(conv.id, conv.title, e)}
                      className="p-1 text-gray-400 hover:text-white"
                      aria-label="Rename conversation"
                    >
                      &#9998;
                    </button>
                    <button
                      onClick={(e) => handleDelete(conv.id, e)}
                      className="p-1 text-gray-400 hover:text-red-400"
                      aria-label="Delete conversation"
                    >
                      &#10005;
                    </button>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </aside>
  );
}
