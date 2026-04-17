'use client';

import { useState, useEffect } from 'react';
import UserSearchInput from '../forms/UserSearchInput';
import { CloseIcon, TrashIcon } from '../ui/Icon';
import { statusConfig } from '../../lib/taskConfig';

// Modale de détail / édition d'une tâche existante.
// Permet de modifier les champs (titre, description, échéance, statut, assignés) ou de supprimer la tâche.
//
// Props :
//   - task : la tâche à afficher/modifier (null si pas de tâche sélectionnée)
//   - isOpen : booléen contrôlant l'ouverture
//   - onClose : callback de fermeture
//   - authFetch : fonction fetch authentifiée fournie par AuthContext
//   - onTaskUpdated : callback (task) => void après mise à jour
//   - onTaskDeleted : callback (taskId) => void après suppression
export default function TaskDetailModal({ task, isOpen, onClose, authFetch, onTaskUpdated, onTaskDeleted }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('TODO');
  const [assignees, setAssignees] = useState([]);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // À chaque fois que la tâche change, on réinitialise le formulaire avec ses valeurs
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
      setStatus(task.status || 'TODO');
      const rawAssignees = task.assignees || task.taskAssignees || [];
      setAssignees(rawAssignees.map((a) => a.user || a));
      setError('');
      setSuccessMsg('');
      setConfirmDelete(false);
    }
  }, [task]);

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');
    setSuccessMsg('');
    if (!title.trim()) {
      setError('Le titre est requis');
      return;
    }
    setIsSaving(true);
    try {
      const body = {
        title: title.trim(),
        description: description.trim(),
        status,
        assigneeIds: assignees.map((a) => a.id).filter(Boolean),
      };
      if (dueDate) body.dueDate = new Date(dueDate).toISOString();
      const res = await authFetch(`/projects/${task.projectId}/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur lors de la mise à jour');
      setSuccessMsg('Tâche mise à jour');
      onTaskUpdated({
        ...task,
        title: body.title,
        description: body.description,
        status: body.status,
        dueDate: body.dueDate || task.dueDate,
        assignees: assignees.map((a) => ({ user: a })),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setError('');
    setIsDeleting(true);
    try {
      const res = await authFetch(`/projects/${task.projectId}/tasks/${task.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erreur lors de la suppression');
      }
      onTaskDeleted(task.id);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête avec boutons supprimer + fermer */}
        <div className="flex items-center justify-end gap-2 absolute top-4 right-4 sm:top-6 sm:right-6">
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="text-gray-600 hover:text-red-700 transition-colors p-1"
            aria-label="Supprimer la tâche"
            title="Supprimer"
          >
            <TrashIcon />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 transition-colors"
            aria-label="Fermer"
          >
            <CloseIcon />
          </button>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-6 sm:mb-8">Modifier</h2>

        {/* Confirmation de suppression */}
        {confirmDelete && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-800 font-medium mb-3">Supprimer cette tâche ?</p>
            <p className="text-xs text-red-800 mb-3">Cette action est irréversible.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 text-white text-sm px-4 py-2 rounded-full hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Suppression...' : 'Confirmer'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="border border-gray-200 text-gray-700 text-sm px-4 py-2 rounded-full hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {error && <p className="text-red-800 text-sm mb-4 p-3 bg-red-50 rounded-lg">{error}</p>}
        {successMsg && <p className="text-green-800 text-sm mb-4 p-3 bg-green-50 rounded-lg">{successMsg}</p>}

        <form onSubmit={handleSave} className="flex flex-col gap-5 sm:gap-6">
          <div>
            <label htmlFor="task-title" className="block text-sm font-semibold text-gray-900 mb-2">Titre</label>
            <input
              id="task-title"
              type="text"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-600 bg-white focus:outline-none focus:border-orange-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="task-desc" className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
            <textarea
              id="task-desc"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-600 bg-white focus:outline-none focus:border-orange-500 resize-none"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="task-date" className="block text-sm font-semibold text-gray-900 mb-2">Échéance</label>
            <input
              id="task-date"
              type="date"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:border-orange-500"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Assigné à :</label>
            <UserSearchInput
              authFetch={authFetch}
              selected={assignees}
              onAdd={(user) => setAssignees((prev) => [...prev, user])}
              onRemove={(user) =>
                setAssignees((prev) => prev.filter((a) => (a.id || a.email) !== (user.id || user.email)))
              }
              placeholder="Ajouter un collaborateur..."
            />
          </div>

          <fieldset>
            <legend className="block text-sm font-semibold text-gray-900 mb-3">Statut :</legend>
            <div className="flex flex-wrap gap-2" role="radiogroup">
              {['TODO', 'IN_PROGRESS', 'DONE'].map((s) => {
                const c = statusConfig[s];
                const isActive = status === s;
                return (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setStatus(s)}
                    role="radio"
                    aria-checked={isActive}
                    className={`text-sm px-5 py-2 rounded-full border transition-colors ${
                      isActive
                        ? `${c.bg} ${c.text} ${c.border} font-medium`
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={isSaving}
            className="bg-gray-100 text-orange-700 font-medium py-3 px-8 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50 w-fit"
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </form>
      </div>
    </div>
  );
}