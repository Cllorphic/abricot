'use client';

import { useAuth } from '../../context/AuthContext';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import ProfileForm from '../../components/forms/ProfileForm';

export default function ProfilePage() {
  const { user, loading, authFetch } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-700">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-10">
          <div className="mb-8">
            <h1 className="text-xl font-bold text-gray-900">Mon compte</h1>
            <p className="text-sm text-orange-700 mt-1">{user?.name || user?.email}</p>
          </div>

          <ProfileForm user={user} authFetch={authFetch} />
        </div>
      </main>
      <Footer />
    </div>
  );
}