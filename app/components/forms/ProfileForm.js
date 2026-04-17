'use client';

import { useState, useEffect } from 'react';

// Formulaire d'édition du profil utilisateur.
// Gère 2 appels API (un pour les infos générales, un pour le mot de passe si modifié).
//
// Props :
//   - user : l'utilisateur courant (pour préremplir les champs)
//   - authFetch : fonction fetch authentifiée
export default function ProfileForm({ user, authFetch }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Préremplir les champs quand l'utilisateur est chargé
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
      // 1. Mettre à jour les infos du profil (nom + email)
      const profileRes = await authFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ name, email }),
      });
      const profileData = await profileRes.json();
      if (!profileRes.ok) throw new Error(profileData.message || 'Erreur lors de la mise à jour');

      // 2. Si nouveau mot de passe renseigné, faire un second appel
      if (newPassword) {
        if (!currentPassword) {
          setError('Le mot de passe actuel est requis');
          setIsSaving(false);
          return;
        }
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

  return (
    <>
      {message && <p className="text-green-800 text-sm mb-6 p-3 bg-green-50 rounded-xl">{message}</p>}
      {error && <p className="text-red-800 text-sm mb-6 p-3 bg-red-50 rounded-xl">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <label htmlFor="profile-name" className="block text-sm font-medium text-gray-900 mb-2">Nom</label>
          <input
            id="profile-name"
            type="text"
            autoComplete="name"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-600 bg-white focus:outline-none focus:border-orange-500"
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
            autoComplete="email"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-600 bg-white focus:outline-none focus:border-orange-500"
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
            autoComplete="current-password"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-600 bg-white focus:outline-none focus:border-orange-500"
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
            autoComplete="new-password"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-600 bg-white focus:outline-none focus:border-orange-500"
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
    </>
  );
}