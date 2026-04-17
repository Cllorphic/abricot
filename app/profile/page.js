'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function ProfilePage() {
  const { user, loading, authFetch } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSaving(true);

    try {
      // Mettre à jour le profil
      const profileRes = await authFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ name, email }),
      });
      const profileData = await profileRes.json();
      if (!profileRes.ok) throw new Error(profileData.message || 'Erreur lors de la mise à jour');

      // Si nouveau mot de passe renseigné, le mettre à jour aussi
      if (newPassword) {
        if (!currentPassword) { setError('Le mot de passe actuel est requis'); setIsSaving(false); return; }
        const pwRes = await authFetch('/auth/password', {
          method: 'PUT',
          body: JSON.stringify({ currentPassword, newPassword }),
        });
        const pwData = await pwRes.json();
        if (!pwRes.ok) throw new Error(pwData.message || 'Erreur mot de passe');
        setCurrentPassword('');
        setNewPassword('');
      }

      setMessage('Informations mises à jour avec succès');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><p className="text-gray-500">Chargement...</p></div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-10">
          <div className="mb-8">
            <h1 className="text-xl font-bold text-gray-900">Mon compte</h1>
            <p className="text-sm text-orange-500 mt-1">{user?.name || user?.email}</p>
          </div>

          {message && <p className="text-green-700 text-sm mb-6 p-3 bg-green-50 rounded-xl">{message}</p>}
          {error && <p className="text-red-600 text-sm mb-6 p-3 bg-red-50 rounded-xl">{error}</p>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
              <label htmlFor="profile-name" className="block text-sm font-medium text-gray-900 mb-2">Nom</label>
              <input
                id="profile-name"
                type="text"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-orange-400"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre nom"
              />
            </div>

            <div>
              <label htmlFor="profile-email" className="block text-sm font-medium text-gray-900 mb-2">Email</label>
              <input
                id="profile-email"
                type="email"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-orange-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Votre email"
              />
            </div>

            <div>
              <label htmlFor="profile-current-pw" className="block text-sm font-medium text-gray-900 mb-2">Mot de passe actuel</label>
              <input
                id="profile-current-pw"
                type="password"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-orange-400"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••"
              />
            </div>

            <div>
              <label htmlFor="profile-new-pw" className="block text-sm font-medium text-gray-900 mb-2">Nouveau mot de passe</label>
              <input
                id="profile-new-pw"
                type="password"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-orange-400"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Laisser vide pour ne pas changer"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="bg-gray-900 text-white font-medium py-3 px-6 rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50 w-fit"
            >
              {isSaving ? 'Enregistrement...' : 'Modifier les informations'}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}