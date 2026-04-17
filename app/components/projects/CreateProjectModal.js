'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UserSearchInput from '../forms/UserSearchInput';
import { CloseIcon } from '../ui/Icon';

// Modale de création d'un nouveau projet.
// Champs : nom, description, contributeurs.
// Après création, redirige vers la page du projet créé (ou appelle onProjectCreated en fallback).
//
// Props :
//   - isOpen : booléen contrôlant l'ouverture
//   - onClose : callback de fermeture
//   - authFetch : fonction fetch authentifiée
//   - onProjectCreated : callback optionnel appelé si l'API ne renvoie pas d'ID exploitable
export default function CreateProjectModal({ isOpen, onClose, authFetch, onProjectCreated }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [contributors, setContributors] = useState([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');
    if (!name.trim()) {
      setError('Le titre est requis');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await authFetch('/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          contributors: contributors.map((c) => c.email),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur lors de la création');

      // Extraire l'ID du projet depuis plusieurs formats de réponse possibles
      const projectId = data.data?.id || data.data?.project?.id || data.id || data.project?.id;
      if (projectId) {
        router.push(`/projects/${projectId}`);
      } else {
        onClose();
        if (onProjectCreated) onProjectCreated();
        else {
          router.push('/dashboard');
          router.refresh();
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Réinitialiser le formulaire quand la modale se ferme
  useEffect(() => {
    if (!isOpen) {
      setName('');
      setDescription('');
      setContributors([]);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
        <h2 className="text-xl font-bold text-gray-900 mb-6 sm:mb-8">Créer un projet</h2>
        {error && <p className="text-red-800 text-sm mb-4 p-3 bg-red-50 rounded-lg">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 sm:gap-6">
          <div>
            <label htmlFor="project-name" className="block text-sm font-medium text-gray-900 mb-2">
              Titre<span className="text-red-700">*</span>
            </label>
            <input
              id="project-name"
              type="text"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-600 bg-white focus:outline-none focus:border-orange-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom du projet"
            />
          </div>
          <div>
            <label htmlFor="project-desc" className="block text-sm font-medium text-gray-900 mb-2">
              Description<span className="text-red-700">*</span>
            </label>
            <textarea
              id="project-desc"
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
              onRemove={(user) => setContributors((prev) => prev.filter((c) => c.email !== user.email))}
              placeholder="Choisir un ou plusieurs collaborateurs"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-gray-100 text-orange-700 font-medium py-3 px-6 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50 w-fit"
          >
            {isSubmitting ? 'Création...' : 'Ajouter un projet'}
          </button>
        </form>
      </div>
    </div>
  );
}