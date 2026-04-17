'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
      <p className="text-lg text-gray-500 mb-8">Cette page n&apos;existe pas</p>
      <Link
        href="/dashboard"
        className="bg-gray-900 text-white text-sm px-6 py-3 rounded-full hover:bg-gray-800 transition-colors"
      >
        Retour au tableau de bord
      </Link>
    </div>
  );
}