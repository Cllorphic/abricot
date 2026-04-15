'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UserSearchInput from '../components/UserSearchInput';

// ──── Config ────
const statusConfig = {
  TODO: { label: 'À faire', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
  IN_PROGRESS: { label: 'En cours', bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200' },
  DONE: { label: 'Terminée', bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  CANCELLED: { label: 'Annulée', bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
};
const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

function extractArray(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    for (const key of Object.keys(data)) {
      if (Array.isArray(data[key])) return data[key];
    }
  }
  return [];
}

function StatusBadge({ status }) {
  const c = statusConfig[status] || statusConfig.TODO;
  return <span className={`text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ${c.bg} ${c.text}`}>{c.label}</span>;
}

// ──── Icônes ────
const Icon = {
  Folder: ({ cls = 'w-3.5 h-3.5' }) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>,
  Calendar: ({ cls = 'w-3.5 h-3.5' }) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Comment: ({ cls = 'w-3.5 h-3.5' }) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
  Search: ({ cls = 'w-4 h-4' }) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Close: ({ cls = 'w-6 h-6' }) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
  Trash: ({ cls = 'w-4 h-4' }) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
};

// ──── Métadonnées tâche ────
function TaskMeta({ task }) {
  const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : null;
  const comments = task._count?.comments || task.comments?.length || 0;
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 mt-3">
      {task.project?.name && <span className="flex items-center gap-1"><Icon.Folder /> {task.project.name}</span>}
      {dueDate && (<><span className="hidden sm:inline">|</span><span className="flex items-center gap-1"><Icon.Calendar /> {dueDate}</span></>)}
      {comments > 0 && (<><span className="hidden sm:inline">|</span><span className="flex items-center gap-1"><Icon.Comment /> {comments}</span></>)}
    </div>
  );
}

// ──── Carte Liste ────
function TaskCardList({ task, onView }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 sm:p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between hover:border-gray-300 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{task.title}</h3>
          <StatusBadge status={task.status} />
        </div>
        {task.description && <p className="text-sm text-gray-600 line-clamp-1">{task.description}</p>}
        <TaskMeta task={task} />
      </div>
      <button onClick={() => onView(task)} className="bg-gray-900 text-white text-sm px-6 py-2.5 rounded-full hover:bg-gray-800 transition-colors self-start sm:self-center shrink-0">Voir</button>
    </div>
  );
}

// ──── Carte Kanban ────
function TaskCardKanban({ task, onView }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-1">
        <h4 className="font-semibold text-sm text-gray-900 truncate">{task.title}</h4>
        <StatusBadge status={task.status} />
      </div>
      {task.description && <p className="text-xs text-gray-500 line-clamp-2">{task.description}</p>}
      <TaskMeta task={task} />
      <button onClick={() => onView(task)} className="bg-gray-900 text-white text-sm px-6 py-2 rounded-full hover:bg-gray-800 transition-colors mt-4">Voir</button>
    </div>
  );
}

// ──── Colonne Kanban ────
function KanbanColumn({ title, tasks, onView }) {
  return (
    <div className="border border-gray-200 rounded-2xl p-4 sm:p-5 bg-gray-50/50 lg:flex-1">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">{tasks.length}</span>
      </div>
      <div className="flex flex-col gap-3">
        {tasks.length === 0
          ? <p className="text-sm text-gray-400 text-center py-8">Aucune tâche</p>
          : tasks.map((t) => <TaskCardKanban key={t.id} task={t} onView={onView} />)}
      </div>
    </div>
  );
}

// ──── Barre de recherche ────
function SearchBar({ value, onChange }) {
  return (
    <div className="relative w-full sm:w-64">
      <input
        type="text"
        placeholder="Rechercher une tâche"
        className="border border-gray-200 rounded-full pl-4 pr-10 py-2 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-orange-400 w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <Icon.Search cls="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
    </div>
  );
}

// ══════════════════════════════════════════════
// ──── Modal Détail / Modifier une tâche ────
// ══════════════════════════════════════════════
function TaskDetailModal({ task, isOpen, onClose, authFetch, onTaskUpdated, onTaskDeleted }) {
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

  // ── Enregistrer ──
  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');
    setSuccessMsg('');
    if (!title.trim()) { setError('Le titre est requis'); return; }
    setIsSaving(true);
    try {
      const body = { title: title.trim(), description: description.trim(), status, assigneeIds: assignees.map((a) => a.id).filter(Boolean) };
      if (dueDate) body.dueDate = new Date(dueDate).toISOString();
      const res = await authFetch(`/projects/${task.projectId}/tasks/${task.id}`, { method: 'PUT', body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur lors de la mise à jour');
      setSuccessMsg('Tâche mise à jour');
      onTaskUpdated({ ...task, title: body.title, description: body.description, status: body.status, dueDate: body.dueDate || task.dueDate, assignees: assignees.map((a) => ({ user: a })) });
    } catch (err) { setError(err.message); }
    finally { setIsSaving(false); }
  };

  // ── Supprimer ──
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
    } catch (err) { setError(err.message); }
    finally { setIsDeleting(false); }
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* En-tête avec fermer + supprimer */}
        <div className="flex items-center justify-end gap-2 absolute top-4 right-4 sm:top-6 sm:right-6">
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-gray-400 hover:text-red-500 transition-colors p-1"
            aria-label="Supprimer la tâche"
            title="Supprimer"
          >
            <Icon.Trash />
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Fermer">
            <Icon.Close />
          </button>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-6 sm:mb-8">Modifier</h2>

        {/* Confirmation de suppression */}
        {confirmDelete && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-800 font-medium mb-3">Supprimer cette tâche ?</p>
            <p className="text-xs text-red-600 mb-3">Cette action est irréversible.</p>
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

        {error && <p className="text-red-600 text-sm mb-4 p-3 bg-red-50 rounded-lg">{error}</p>}
        {successMsg && <p className="text-green-700 text-sm mb-4 p-3 bg-green-50 rounded-lg">{successMsg}</p>}

        <form onSubmit={handleSave} className="flex flex-col gap-5 sm:gap-6">
          {/* Titre */}
          <div>
            <label htmlFor="task-title" className="block text-sm font-semibold text-gray-900 mb-2">Titre</label>
            <input id="task-title" type="text" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-orange-400" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="task-desc" className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
            <textarea id="task-desc" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-orange-400 resize-none" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {/* Échéance */}
          <div>
            <label htmlFor="task-date" className="block text-sm font-semibold text-gray-900 mb-2">Échéance</label>
            <input id="task-date" type="date" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:border-orange-400" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>

          {/* Assignés */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Assigné à :</label>
            <UserSearchInput
              authFetch={authFetch}
              selected={assignees}
              onAdd={(user) => setAssignees((prev) => [...prev, user])}
              onRemove={(user) => setAssignees((prev) => prev.filter((a) => (a.id || a.email) !== (user.id || user.email)))}
              placeholder="Ajouter un collaborateur..."
            />
          </div>

          {/* Statut */}
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
                    className={`text-sm px-5 py-2 rounded-full border transition-colors ${isActive ? `${c.bg} ${c.text} ${c.border} font-medium` : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Enregistrer */}
          <button type="submit" disabled={isSaving} className="bg-gray-100 text-orange-600 font-medium py-3 px-8 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50 w-fit">
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ══════════════════════════════════
// ──── Modal Créer un projet ────
// ══════════════════════════════════
function CreateProjectModal({ isOpen, onClose, authFetch }) {
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
    if (!name.trim()) { setError('Le titre est requis'); return; }
    setIsSubmitting(true);
    try {
      const res = await authFetch('/projects', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), description: description.trim(), contributors: contributors.map((c) => c.email) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur lors de la création');
      // Extraire l'ID du projet depuis plusieurs formats de réponse possibles
      const projectId = data.data?.id || data.data?.project?.id || data.id || data.project?.id;
      if (projectId) {
        router.push(`/projects/${projectId}`);
      } else {
        // Pas de reload brutal — on ferme la modal et on redirige proprement
        onClose();
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) { setError(err.message); }
    finally { setIsSubmitting(false); }
  };

  useEffect(() => {
    if (!isOpen) { setName(''); setDescription(''); setContributors([]); setError(''); }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 sm:top-6 sm:right-6 text-gray-400 hover:text-gray-600" aria-label="Fermer"><Icon.Close /></button>
        <h2 className="text-xl font-bold text-gray-900 mb-6 sm:mb-8">Créer un projet</h2>
        {error && <p className="text-red-600 text-sm mb-4 p-3 bg-red-50 rounded-lg">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 sm:gap-6">
          <div>
            <label htmlFor="project-name" className="block text-sm font-medium text-gray-900 mb-2">Titre<span className="text-red-500">*</span></label>
            <input id="project-name" type="text" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-orange-400" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du projet" />
          </div>
          <div>
            <label htmlFor="project-desc" className="block text-sm font-medium text-gray-900 mb-2">Description<span className="text-red-500">*</span></label>
            <textarea id="project-desc" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-orange-400 resize-none" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description du projet" />
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
          <button type="submit" disabled={isSubmitting} className="bg-gray-100 text-orange-600 font-medium py-3 px-6 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50 w-fit">
            {isSubmitting ? 'Création...' : 'Ajouter un projet'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ══════════════════════════════
// ──── Page Dashboard ────
// ══════════════════════════════
export default function DashboardPage() {
  const { user, loading, authFetch } = useAuth();
  const router = useRouter();

  const [tasks, setTasks] = useState([]);
  const [view, setView] = useState('list');
  const [search, setSearch] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    if (loading || !user) return;
    async function fetchData() {
      try {
        // 1. Charger les tâches assignées actives
        let allTasks = [];
        try {
          const tasksRes = await authFetch('/dashboard/assigned-tasks');
          const tasksData = await tasksRes.json();
          if (tasksRes.ok) {
            allTasks = extractArray(tasksData.data ?? tasksData);
          }
        } catch (err) { /* continue */ }

        // 2. Charger les projets pour récupérer les tâches DONE manquantes
        try {
          const projRes = await authFetch('/projects');
          const projData = await projRes.json();
          let projectsList = [];
          if (projRes.ok) {
            if (Array.isArray(projData)) projectsList = projData;
            else if (Array.isArray(projData.data)) projectsList = projData.data;
            else if (projData.data && typeof projData.data === 'object') {
              for (const key of Object.keys(projData.data)) {
                if (Array.isArray(projData.data[key])) { projectsList = projData.data[key]; break; }
              }
            }
          }

          if (projectsList.length > 0) {
            const existingIds = new Set(allTasks.map((t) => t.id));

            // Charger les détails de chaque projet en parallèle
            const details = await Promise.all(
              projectsList.map(async (p) => {
                try {
                  const r = await authFetch(`/projects/${p.id}`);
                  const d = await r.json();
                  if (r.ok) return d.data?.project || d.data || d.project || d;
                } catch (err) { /* skip */ }
                return null;
              })
            );

            // Ajouter les tâches DONE qui ne sont pas déjà dans la liste
            details.forEach((proj) => {
              if (!proj?.tasks) return;
              proj.tasks.forEach((task) => {
                if (existingIds.has(task.id)) return;
                if (task.status === 'DONE') {
                  allTasks.push({ ...task, project: { id: proj.id, name: proj.name } });
                  existingIds.add(task.id);
                }
              });
            });
          }
        } catch (err) { /* on a au moins les tâches actives */ }

        allTasks.sort((a, b) => (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99));
        setTasks(allTasks);
      } catch (err) { console.error('Erreur chargement dashboard:', err); }
      finally { setLoadingData(false); }
    }
    fetchData();
  }, [loading, user, authFetch]);

  const handleTaskUpdated = (updatedTask) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t)));
  };

  const handleTaskDeleted = (taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const filteredTasks = tasks.filter(
    (t) => t.title?.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase())
  );

  // Vue liste : uniquement les tâches actives (À faire + En cours)
  const listTasks = filteredTasks.filter((t) => t.status !== 'DONE' && t.status !== 'CANCELLED');

  // Vue kanban : toutes les tâches par statut
  const kanban = {
    TODO: filteredTasks.filter((t) => t.status === 'TODO'),
    IN_PROGRESS: filteredTasks.filter((t) => t.status === 'IN_PROGRESS'),
    DONE: filteredTasks.filter((t) => t.status === 'DONE'),
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center"><p className="text-gray-500">Chargement...</p></div>;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Tableau de bord</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Bonjour {user?.name || user?.email}, voici un aperçu de vos projets et tâches</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="bg-gray-900 text-white text-sm px-5 py-2.5 rounded-full hover:bg-gray-800 transition-colors w-fit">+ Créer un projet</button>
        </div>

        <div className="flex items-center gap-1 mb-6 overflow-x-auto" role="tablist" aria-label="Vues du tableau de bord">
          {[
            { key: 'list', label: 'Liste', d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
            { key: 'kanban', label: 'Kanban', d: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z' },
          ].map((tab) => (
            <button key={tab.key} role="tab" aria-selected={view === tab.key} onClick={() => setView(tab.key)} className={`flex items-center gap-2 text-sm px-4 py-2 rounded-full transition-colors whitespace-nowrap ${view === tab.key ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={tab.d} /></svg>
              {tab.label}
            </button>
          ))}
        </div>

        {view === 'list' && (
          <div className="border border-gray-200 rounded-2xl p-4 sm:p-6" role="tabpanel">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h2 className="font-semibold text-gray-900">Mes tâches assignées</h2>
                <p className="text-sm text-gray-500">Par ordre de priorité</p>
              </div>
              <SearchBar value={search} onChange={setSearch} />
            </div>
            {loadingData ? (
              <p className="text-gray-500 text-center py-12">Chargement...</p>
            ) : listTasks.length === 0 ? (
              <p className="text-gray-500 text-center py-12">{search ? 'Aucune tâche trouvée' : 'Aucune tâche assignée'}</p>
            ) : (
              <div className="flex flex-col gap-3 sm:gap-4">
                {listTasks.map((t) => <TaskCardList key={t.id} task={t} onView={setSelectedTask} />)}
              </div>
            )}
          </div>
        )}

        {view === 'kanban' && (
          <div role="tabpanel">
            <div className="mb-4"><SearchBar value={search} onChange={setSearch} /></div>
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
              <KanbanColumn title="À faire" tasks={kanban.TODO} onView={setSelectedTask} />
              <KanbanColumn title="En cours" tasks={kanban.IN_PROGRESS} onView={setSelectedTask} />
              <KanbanColumn title="Terminées" tasks={kanban.DONE} onView={setSelectedTask} />
            </div>
          </div>
        )}

      </main>
      <Footer />

      <CreateProjectModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} authFetch={authFetch} />
      <TaskDetailModal task={selectedTask} isOpen={!!selectedTask} onClose={() => setSelectedTask(null)} authFetch={authFetch} onTaskUpdated={handleTaskUpdated} onTaskDeleted={handleTaskDeleted} />
    </div>
  );
}