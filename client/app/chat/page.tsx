'use client';

import { Sidebar } from '@/components/sidebar';
import { ChatView } from '@/components/layout/chat-view';

export default function ChatPage() {
  return (
    <div className="flex h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0" role="main">
        <ChatView />
      </main>
    </div>
  );
}
