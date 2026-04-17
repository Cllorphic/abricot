'use client';

import { useState, useEffect } from 'react';
import { CloseIcon, TrashIcon } from '../ui/Icon';
import { statusConfig } from '../../lib/taskConfig';
import { getInitials } from '../../lib/userUtils';

// Modale polyvalente : créer une nouvelle tâche ou modifier une tâche existante.
// Mode auto-détecté : si task est fourni → édition, sinon → création.
//
// Props :
//   - isOpen, onClose : contrôle d'ouverture
//   - authFetch : fonction fetch authentifiée
//   - projectId : id du projet dans lequel créer/éditer la tâche
//   - task : tâche à éditer (null pour créer)
//   - onSaved : callback après enregistrement
//   - onDeleted : callback après suppression (taskId) => void
//   - projectMembers : liste des membres du projet pour l'assignation
export default function TaskModal({ isOpen, onClose, authFetch, projectId, task = null, onSaved, onDeleted, projectMembers = [] }) {
  const isEdit = !!task;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('TODO');
  const [assignees, setAssignees] = useState([]);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Réinitialiser / préremplir le formulaire à chaque ouverture
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
      setStatus(task.status || 'TODO');
      const raw = task.assignees || task.taskAssignees || [];
      setAssignees(raw.map((a) => a.user || a));
    } else {
      setTitle(''); setDescription(''); setDueDate(''); setStatus('TODO');
      setAssignees([]);
    }
    setError(''); setConfirmDelete(false);
  }, [task, isOpen]);

  // Refetch la tâche à l'ouverture pour récupérer les assignees à jour (le backend ne les renvoie
  // pas forcément dans la liste des tâches du projet)
  useEffect(() => {
    if (!isOpen || !task?.id || !projectId || !authFetch) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch(`/projects/${projectId}/tasks/${task.id}`);
        if (!res.ok) return;
        const data = await res.json();
        const fresh = data?.data?.task || data?.data || data?.task || data;
        if (cancelled || !fresh) return;
        const raw = fresh.assignees || fresh.taskAssignees || fresh.assignedUsers || [];
        if (raw.length > 0) {
          setAssignees(raw.map((a) => a.user || a));
        }
      } catch (e) { /* silencieux */ }
    })();
    return () => { cancelled = true; };
  }, [isOpen, task?.id, projectId, authFetch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');
    if (!title.trim()) { setError('Le titre est requis'); return; }
    setIsSaving(true);
    try {
      const body = {
        title: title.trim(),
        description: description.trim(),
        status,
        assigneeIds: assignees.map((a) => a.id).filter(Boolean),
      };
      if (dueDate) body.dueDate = new Date(dueDate).toISOString();

      let res;
      if (isEdit) {
        res = await authFetch(`/projects/${projectId}/tasks/${task.id}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        res = await authFetch(`/projects/${projectId}/tasks`, { method: 'POST', body: JSON.stringify(body) });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur');

      // Fallback : si création avec un statut autre que TODO et que le backend l'ignore,
      // on force la mise à jour via PUT pour que le statut soit bien appliqué.
      if (!isEdit && status !== 'TODO') {
        const created = data?.data?.task || data?.data || data?.task || data;
        const createdId = created?.id;
        const createdStatus = created?.status;
        if (createdId && createdStatus !== status) {
          try {
            await authFetch(`/projects/${projectId}/tasks/${createdId}`, {
              method: 'PUT',
              body: JSON.stringify(body),
            });
          } catch (e) { /* silencieux */ }
        }
      }

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await authFetch(`/projects/${projectId}/tasks/${task.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erreur');
      }
      if (onDeleted) onDeleted(task.id);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-end gap-2 absolute top-4 right-4 sm:top-6 sm:right-6">
          {isEdit && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="text-gray-600 hover:text-red-700 transition-colors p-1"
              aria-label="Supprimer la tâche"
              title="Supprimer"
            >
              <TrashIcon />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900"
            aria-label="Fermer"
          >
            <CloseIcon />
          </button>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-6 sm:mb-8">
          {isEdit ? 'Modifier la tâche' : 'Créer une tâche'}
        </h2>

        {confirmDelete && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-800 font-medium mb-3">Supprimer cette tâche ?</p>
            <p className="text-xs text-red-800 mb-3">Cette action est irréversible.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 text-white text-sm px-4 py-2 rounded-full hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Suppression...' : 'Confirmer'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="border border-gray-200 text-gray-700 text-sm px-4 py-2 rounded-full hover:bg-gray-50"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {error && <p className="text-red-800 text-sm mb-4 p-3 bg-red-50 rounded-lg">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 sm:gap-6">
          <div>
            <label htmlFor="task-title" className="block text-sm font-semibold text-gray-900 mb-2">
              Titre<span className="text-red-700">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-600 bg-white focus:outline-none focus:border-orange-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de la tâche"
            />
          </div>

          <div>
            <label htmlFor="task-desc" className="block text-sm font-semibold text-gray-900 mb-2">
              Description<span className="text-red-700">*</span>
            </label>
            <textarea
              id="task-desc"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-600 bg-white focus:outline-none focus:border-orange-500 resize-none"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description de la tâche"
            />
          </div>

          <div>
            <label htmlFor="task-date" className="block text-sm font-semibold text-gray-900 mb-2">
              Échéance<span className="text-red-700">*</span>
            </label>
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

            {/* Tags des assignés */}
            {assignees.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {assignees.map((u) => (
                  <span
                    key={u.id || u.email}
                    className="flex items-center gap-1 bg-orange-50 text-orange-800 text-xs font-medium px-3 py-1.5 rounded-full"
                  >
                    {u.name || u.email}
                    <button
                      type="button"
                      onClick={() =>
                        setAssignees((prev) => prev.filter((a) => (a.id || a.email) !== (u.id || u.email)))
                      }
                      className="hover:text-orange-900 ml-1 text-base leading-none"
                      aria-label={`Retirer ${u.name || u.email}`}
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Membres disponibles */}
            {(() => {
              const selectedIds = assignees.map((a) => a.id || a.email);
              const available = projectMembers.filter(
                (m) => !selectedIds.includes(m.id) && !selectedIds.includes(m.email)
              );
              if (available.length === 0 && assignees.length > 0)
                return <p className="text-xs text-gray-700">Tous les membres sont assignés</p>;
              if (projectMembers.length === 0)
                return <p className="text-xs text-gray-700">Aucun membre dans ce projet</p>;
              return (
                <div className="flex flex-wrap gap-2">
                  {available.map((m) => (
                    <button
                      type="button"
                      key={m.id || m.email}
                      onClick={() => setAssignees((prev) => [...prev, m])}
                      className="flex items-center gap-1.5 border border-gray-300 text-sm text-gray-800 px-3 py-1.5 rounded-full hover:border-orange-300 hover:bg-orange-50 transition-colors"
                    >
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 text-[10px] font-semibold text-gray-800">
                        {getInitials(m)}
                      </span>
                      {m.name || m.email}
                    </button>
                  ))}
                </div>
              );
            })()}
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
            className={`font-medium py-3 px-8 rounded-full transition-colors disabled:opacity-50 w-fit ${
              isEdit ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-gray-100 text-orange-700 hover:bg-gray-200'
            }`}
          >
            {isSaving ? 'Enregistrement...' : isEdit ? 'Enregistrer' : '+ Ajouter une tâche'}
          </button>
        </form>
      </div>
    </div>
  );
}