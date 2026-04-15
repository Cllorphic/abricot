'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

export default function ProfilePage() {
  const { user, loading, authFetch, logout } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Pré-remplir les champs quand le user est chargé
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  // ──── Mise à jour du profil ────
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSaving(true);

    try {
      const res = await authFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ name, email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Erreur lors de la mise à jour');
      }

      setMessage('Profil mis à jour avec succès');
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ──── Changement de mot de passe ────
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordMessage('');

    if (newPassword.length < 8) {
      setPasswordError('Le nouveau mot de passe doit faire au moins 8 caractères');
      return;
    }

    try {
      const res = await authFetch('/auth/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Erreur lors du changement de mot de passe');
      }

      setPasswordMessage('Mot de passe mis à jour');
      setCurrentPassword('');
      setNewPassword('');
      setShowPasswordForm(false);
    } catch (err) {
      setPasswordError(err.message);
    }
  };

  // Afficher un loader pendant le chargement
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Chargement...</p>
      </main>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-lg mx-auto mt-10 p-6">
        <h1 className="text-2xl font-bold mb-6">Mon profil</h1>

        {/* Messages de succès / erreur */}
        {message && (
          <p className="text-green-600 text-sm mb-4 p-2 bg-green-50 rounded">
            {message}
          </p>
        )}
        {error && (
          <p className="text-red-500 text-sm mb-4 p-2 bg-red-50 rounded">
            {error}
          </p>
        )}

        {/* ──── Formulaire profil ──── */}
        <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom</label>
            <input
              type="text"
              className="border p-2 rounded w-full disabled:bg-gray-100"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className="border p-2 rounded w-full disabled:bg-gray-100"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  type="submit"
                  className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
                  disabled={isSaving}
                >
                  {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
                <button
                  type="button"
                  className="border px-4 py-2 rounded"
                  onClick={() => {
                    setIsEditing(false);
                    setName(user?.name || '');
                    setEmail(user?.email || '');
                    setError('');
                  }}
                >
                  Annuler
                </button>
              </>
            ) : (
              <button
                type="button"
                className="bg-black text-white px-4 py-2 rounded"
                onClick={() => setIsEditing(true)}
              >
                Modifier
              </button>
            )}
          </div>
        </form>

        {/* ──── Changement de mot de passe ──── */}
        <div className="mt-8 pt-6 border-t">
          <button
            type="button"
            className="text-sm text-blue-500 underline"
            onClick={() => setShowPasswordForm(!showPasswordForm)}
          >
            {showPasswordForm ? 'Masquer' : 'Changer le mot de passe'}
          </button>

          {showPasswordForm && (
            <form
              onSubmit={handleUpdatePassword}
              className="flex flex-col gap-4 mt-4"
            >
              {passwordError && (
                <p className="text-red-500 text-sm">{passwordError}</p>
              )}
              {passwordMessage && (
                <p className="text-green-600 text-sm">{passwordMessage}</p>
              )}

              <input
                type="password"
                placeholder="Mot de passe actuel"
                className="border p-2 rounded"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Nouveau mot de passe"
                className="border p-2 rounded"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button className="bg-black text-white p-2 rounded">
                Mettre à jour le mot de passe
              </button>
            </form>
          )}
        </div>

        {/* ──── Déconnexion ──── */}
        <div className="mt-8 pt-6 border-t">
          <button
            onClick={logout}
            className="text-red-500 text-sm underline"
          >
            Se déconnecter
          </button>
        </div>
      </main>
    </>
  );
}