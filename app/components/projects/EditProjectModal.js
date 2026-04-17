'use client';

import { useState, useEffect } from 'react';
import UserSearchInput from '../forms/UserSearchInput';
import { CloseIcon } from '../ui/Icon';

// Modale pour modifier un projet existant (nom, description, contributeurs).
// La synchronisation des contributeurs se fait en plusieurs appels : on compare la liste
// actuelle avec la nouvelle, puis on supprime les retirés et on ajoute les nouveaux.
//
// Props :
//   - isOpen, onClose : contrôle
//   - authFetch : fonction fetch authentifiée
//   - project : l'objet projet (avec members/contributors)
//   - onSaved : callback après enregistrement
export default function EditProjectModal({ isOpen, onClose, authFetch, project, onSaved }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [contributors, setContributors] = useState([]);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Pré-remplir les champs à l'ouverture
  useEffect(() => {
    if (project && isOpen) {
      setName(project.name || '');
      setDescription(project.description || '');
      const members = project.members || project.contributors || project.projectMembers || [];
      const memberUsers = members
        .map((m) => m.user || m)
        .filter((u) => u.id !== (project.ownerId || project.owner?.id));
      setContributors(memberUsers);
      setError('');
      setSuccessMsg('');
    }
  }, [project, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');
    setSuccessMsg('');
    if (!name.trim()) { setError('Le nom du projet est requis'); return; }
    setIsSaving(true);
    try {
      // 1. Mettre à jour nom + description
      const res = await authFetch(`/projects/${project.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur lors de la mise à jour');

      // 2. Synchroniser les contributeurs
      const currentMembers = (project.members || project.contributors || project.projectMembers || [])
        .map((m) => m.user || m)
        .filter((u) => u.id !== (project.ownerId || project.owner?.id));
      const currentIds = currentMembers.map((m) => m.id);
      const newIds = contributors.map((c) => c.id);

      // Retirer ceux qui ne sont plus dans la liste
      for (const member of currentMembers) {
        if (!newIds.includes(member.id)) {
          try {
            await authFetch(`/projects/${project.id}/contributors/${member.id}`, { method: 'DELETE' });
          } catch (err) { console.error('Erreur retrait contributeur:', err); }
        }
      }

      // Ajouter les nouveaux
      for (const contrib of contributors) {
        if (!currentIds.includes(contrib.id)) {
          try {
            await authFetch(`/projects/${project.id}/contributors`, {
              method: 'POST',
              body: JSON.stringify({ email: contrib.email, role: 'CONTRIBUTOR' }),
            });
          } catch (err) { console.error('Erreur ajout contributeur:', err); }
        }
      }

      setSuccessMsg('Projet mis à jour');
      if (onSaved) onSaved();
      setTimeout(() => onClose(), 800);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 text-gray-600 hover:text-gray-900"
          aria-label="Fermer"
        >
          <CloseIcon />
        </button>

        <h2 className="text-xl font-bold text-gray-900 mb-6 sm:mb-8">Modifier le projet</h2>

        {error && <p className="text-red-800 text-sm mb-4 p-3 bg-red-50 rounded-lg">{error}</p>}
        {successMsg && <p className="text-green-800 text-sm mb-4 p-3 bg-green-50 rounded-lg">{successMsg}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 sm:gap-6">
          <div>
            <label htmlFor="edit-project-name" className="block text-sm font-medium text-gray-900 mb-2">
              Nom du projet<span className="text-red-700">*</span>
            </label>
            <input
              id="edit-project-name"
              type="text"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-600 bg-white focus:outline-none focus:border-orange-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom du projet"
            />
          </div>
          <div>
            <label htmlFor="edit-project-desc" className="block text-sm font-medium text-gray-900 mb-2">
              Description
            </label>
            <textarea
              id="edit-project-desc"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-600 bg-white focus:outline-none focus:border-orange-500 resize-none"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du projet"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Contributeurs</label>
            <UserSearchInput
              authFetch={authFetch}
              selected={contributors}
              onAdd={(user) => setContributors((prev) => [...prev, user])}
              onRemove={(user) => setContributors((prev) => prev.filter((c) => c.id !== user.id))}
              placeholder="Ajouter ou retirer des contributeurs"
            />
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="bg-gray-900 text-white font-medium py-3 px-6 rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50 w-fit"
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </form>
      </div>
    </div>
  );
}