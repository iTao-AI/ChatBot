'use client';

import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

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

        <section className="mb-8 p-4 bg-gray-900 rounded-lg border border-gray-800">
          <h2 className="text-lg font-semibold mb-3">API Configuration</h2>
          <p className="text-sm text-gray-400">API keys are managed server-side. Contact your administrator to configure AI providers.</p>
        </section>

        <section className="p-4 bg-gray-900 rounded-lg border border-gray-800">
          <h2 className="text-lg font-semibold mb-3">About</h2>
          <p className="text-sm text-gray-400">ChatBot v0.1.0 — A ChatGPT-like conversation system.</p>
        </section>
      </div>
    </div>
  );
}
