'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useChatStore } from '@/store/chat';
import { Message } from '@/types';
import { MessageContent } from '@/components/message-rendering';

function MessageBubble({ message, isStreaming }: { message: Message; isStreaming: boolean }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 px-4`}>
      <div
        className={`max-w-3xl rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-800 text-gray-100'
        }`}
        role="article"
        aria-label={`${isUser ? 'Your' : 'Assistant'} message`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content.text}</p>
        ) : (
          <>
            <MessageContent content={message.content.text} />
            {isStreaming && message.content.text === '' && (
              <span className="inline-block w-2 h-5 bg-gray-400 animate-pulse" aria-label="Generating response..." />
            )}
          </>
        )}
        {message.createdAt && !isUser && (
          <p className="text-xs text-gray-500 mt-2">
            {new Date(message.createdAt).toLocaleTimeString()}
            {message.modelUsed && ` · ${message.modelUsed}`}
          </p>
        )}
      </div>
    </div>
  );
}

function MessageInput({
  onSend,
  onStop,
  isStreaming,
  isLoading,
}: {
  onSend: (content: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  isLoading: boolean;
}) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    if (input.trim() && !isStreaming && !isLoading) {
      onSend(input.trim());
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [input, isStreaming, isLoading, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="border-t border-gray-700 p-4">
      <div className="max-w-3xl mx-auto flex gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
          className="flex-1 resize-none bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none px-4 py-2 min-h-[44px] max-h-32"
          rows={1}
          disabled={isLoading}
          aria-label="Message input"
        />
        {isStreaming ? (
          <button
            onClick={onStop}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            aria-label="Stop generating"
          >
            Stop
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            Send
          </button>
        )}
      </div>
    </div>
  );
}

export function ChatView() {
  const {
    messages,
    currentConversation,
    isStreaming,
    isLoading,
    sendMessage,
    stopStreaming,
    selectedModel,
    setSelectedModel,
    models,
    loadModels,
  } = useChatStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!currentConversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-lg mb-2">Start a new conversation</p>
          <p className="text-sm">Select a conversation from the sidebar or create a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with model selector */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
        <h2 className="text-sm font-medium truncate" title={currentConversation.title}>
          {currentConversation.title}
        </h2>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="bg-gray-800 text-sm text-white rounded border border-gray-600 px-2 py-1"
          aria-label="Select AI model"
        >
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.displayName}
            </option>
          ))}
        </select>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4" role="log" aria-live="polite" aria-label="Chat messages">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isStreaming={isStreaming && message.id === messages[messages.length - 1]?.id}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="px-4 py-2 text-center text-sm text-gray-500">Loading messages...</div>
      )}

      {/* Input */}
      <MessageInput
        onSend={sendMessage}
        onStop={stopStreaming}
        isStreaming={isStreaming}
        isLoading={isLoading}
      />
    </div>
  );
}
