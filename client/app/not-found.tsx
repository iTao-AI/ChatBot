import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-700">404</h1>
        <p className="mt-4 text-gray-400">This page could not be found.</p>
        <Link
          href="/login"
          className="mt-6 inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
        >
          Go to login
        </Link>
      </div>
    </div>
  );
}
