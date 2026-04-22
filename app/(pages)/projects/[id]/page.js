'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import Header from '../../../components/layout/Header';
import Footer from '../../../components/layout/Footer';
import AvatarWithName from '../../../components/ui/AvatarWithName';
import { BackIcon, ListIcon, CalendarIcon, SearchIcon, ChevronDownIcon, SparkleIcon } from '../../../components/ui/Icon';
import CalendarView from '../../../components/tasks/CalendarView';
import TaskCardDetail from '../../../components/tasks/TaskCardDetail';
import TaskModal from '../../../components/tasks/TaskModal';
import EditProjectModal from '../../../components/projects/EditProjectModal';

// Helper : extraire un tableau depuis une réponse API de format variable
function extractArray(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    for (const key of Object.keys(data)) {
      if (Array.isArray(data[key])) return data[key];
    }
  }
  return [];
}

export default function ProjectDetailPage() {
  const { user, loading, authFetch } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id;

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('list');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [confirmDeleteProject, setConfirmDeleteProject] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchProject = useCallback(async () => {
    try {
      const res = await authFetch(`/projects/${projectId}`);
      const data = await res.json();
      if (res.ok && data.success !== false) {
        const proj = data.data?.project || data.data || data.project || data;
        setProject(proj);
        setTasks(proj.tasks || extractArray(data.data?.tasks || data.tasks));
      } else if (res.status === 403) {
        setError('Vous n\'avez pas accès à ce projet');
      } else {
        setError(data.message || 'Projet introuvable');
      }
    } catch (err) {
      console.error('Erreur chargement projet:', err);
      setError('Erreur lors du chargement du projet');
    } finally {
      setLoadingData(false);
    }
  }, [authFetch, projectId]);

  useEffect(() => {
    if (loading || !user || !projectId) return;
    fetchProject();
  }, [loading, user, projectId, fetchProject]);

  const handleTaskSaved = () => fetchProject();

  const handleTaskDeleted = (taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setSelectedTask(null);
  };

  // Suppression rapide (pour les contributeurs qui n'ont pas accès à la modale d'édition)
  const handleQuickDeleteTask = async (taskId) => {
    try {
      const res = await authFetch(`/projects/${projectId}/tasks/${taskId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erreur lors de la suppression');
      }
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteProject = async () => {
    setIsDeletingProject(true);
    try {
      const res = await authFetch(`/projects/${projectId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erreur lors de la suppression');
      }
      router.push('/projects');
    } catch (err) {
      setError(err.message);
      setConfirmDeleteProject(false);
    } finally {
      setIsDeletingProject(false);
    }
  };

  // Construction de l'équipe
  const owner = project?.owner || project?.user || null;
  const ownerId = project?.ownerId || owner?.id || null;
  const members = project?.members || project?.contributors || project?.projectMembers || [];
  const team = [];
  if (owner) team.push({ ...owner, _isOwner: true });
  members.forEach((m) => {
    const u = m.user || m;
    if (u.id !== owner?.id) team.push(u);
  });

  // Rôle de l'utilisateur dans le projet
  const isOwner = user?.id === ownerId;
  const memberEntry = members.find((m) => {
    const u = m.user || m;
    return u.id === user?.id;
  });
  const memberRole = memberEntry?.role || null;
  const isAdmin = isOwner || memberRole === 'ADMIN';
  const isContributor = memberRole === 'CONTRIBUTOR';
  const canEdit = isAdmin;
  const canCreateTask = isAdmin || isContributor;
  const canViewTask = isAdmin || isContributor;

  // Ordre d'affichage des statuts : À faire → En cours → Terminées → Annulées
  const statusOrder = { TODO: 0, IN_PROGRESS: 1, DONE: 2, CANCELLED: 3 };

  // Filtrage des tâches (recherche + statut) puis tri par statut
  const filteredTasks = tasks
    .filter((t) => {
      const matchSearch = !search
        || t.title?.toLowerCase().includes(search.toLowerCase())
        || t.description?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99));

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-700">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        {error ? (
          <div className="text-center py-16">
            {error.includes('accès') ? (
              <>
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg aria-hidden="true" className="w-8 h-8 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-gray-900 mb-2">Accès refusé</p>
                <p className="text-sm text-gray-700 mb-6">Vous n&apos;êtes ni administrateur ni contributeur de ce projet.</p>
              </>
            ) : (
              <p className="text-red-800 mb-4">{error}</p>
            )}
            <button
              type="button"
              onClick={() => router.push('/projects')}
              className="bg-gray-900 text-white text-sm px-5 py-2.5 rounded-full hover:bg-gray-800 transition-colors"
            >
              Retour aux projets
            </button>
          </div>
        ) : loadingData ? (
          <p className="text-gray-700 text-center py-16">Chargement du projet...</p>
        ) : (
          <>
            {/* En-tête projet */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6 sm:mb-8">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/projects')}
                  className="mt-1 w-10 h-10 border border-gray-200 rounded-full flex items-center justify-center text-gray-700 hover:text-gray-900 hover:border-gray-300 transition-colors shrink-0"
                  aria-label="Retour aux projets"
                >
                  <BackIcon />
                </button>
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{project?.name}</h1>
                    {canEdit && (
                      <button type="button" onClick={() => setShowEditModal(true)} className="text-sm text-orange-700 hover:text-orange-800 font-medium transition-colors">
                        Modifier
                      </button>
                    )}
                    {canEdit && (
                      <button type="button" onClick={() => setConfirmDeleteProject(true)} className="text-sm text-red-700 hover:text-red-800 font-medium transition-colors">
                        Supprimer
                      </button>
                    )}
                  </div>
                  {project?.description && <p className="text-sm sm:text-base text-gray-700 mt-1">{project.description}</p>}
                </div>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {canCreateTask && (
                  <button
                    type="button"
                    onClick={() => { setSelectedTask(null); setShowTaskModal(true); }}
                    className="bg-gray-900 text-white text-sm px-5 py-2.5 rounded-full hover:bg-gray-800 transition-colors"
                  >
                    Créer une tâche
                  </button>
                )}
                <button type="button" className="bg-orange-500 text-white text-sm px-4 py-2.5 rounded-full hover:bg-orange-600 transition-colors flex items-center gap-1.5">
                  <SparkleIcon cls="w-4 h-4" /> IA
                </button>
              </div>
            </div>

            {/* Confirmation suppression projet */}
            {confirmDeleteProject && (
              <div className="mb-6 p-5 bg-red-50 border border-red-200 rounded-2xl">
                <p className="text-sm text-red-800 font-semibold mb-2">Supprimer ce projet ?</p>
                <p className="text-xs text-red-800 mb-4">Toutes les tâches et données associées seront définitivement supprimées.</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDeleteProject}
                    disabled={isDeletingProject}
                    className="bg-red-600 text-white text-sm px-5 py-2 rounded-full hover:bg-red-700 disabled:opacity-50"
                  >
                    {isDeletingProject ? 'Suppression...' : 'Confirmer la suppression'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteProject(false)}
                    className="border border-gray-200 text-gray-700 text-sm px-5 py-2 rounded-full hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}

            {/* Barre des contributeurs */}
            {team.length > 0 && (
              <div className="bg-gray-50 rounded-2xl px-5 py-4 mb-8 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 shrink-0">
                  <span>Contributeurs</span>
                  <span className="text-gray-700 font-normal">{team.length} personne{team.length > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {team.map((member, i) => (
                    <AvatarWithName key={member.id || member.email || i} user={member} isOwner={!!member._isOwner} />
                  ))}
                </div>
              </div>
            )}

            {/* Section tâches */}
            <div className="border border-gray-200 rounded-2xl p-4 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                  <h2 className="font-semibold text-gray-900">Tâches</h2>
                  <p className="text-sm text-gray-700">Par ordre de priorité</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Onglets Liste / Calendrier */}
                  <div className="flex items-center gap-1">
                    {[
                      { key: 'list', label: 'Liste', icon: <ListIcon /> },
                      { key: 'calendar', label: 'Calendrier', icon: <CalendarIcon /> },
                    ].map((tab) => (
                      <button
                        type="button"
                        key={tab.key}
                        onClick={() => setView(tab.key)}
                        className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full transition-colors ${
                          view === tab.key ? 'bg-orange-50 text-orange-700 font-medium' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {tab.icon} {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Filtre statut */}
                  <div className="relative">
                    <select
                      id="status-filter"
                      aria-label="Filtrer par statut"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="appearance-none border border-gray-300 rounded-full pl-4 pr-8 py-1.5 text-sm text-gray-800 bg-white focus:outline-none focus:border-orange-500 cursor-pointer"
                    >
                      <option value="ALL">Statut</option>
                      <option value="TODO">À faire</option>
                      <option value="IN_PROGRESS">En cours</option>
                      <option value="DONE">Terminée</option>
                    </select>
                    <ChevronDownIcon cls="w-3.5 h-3.5 text-gray-700 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Recherche */}
                  <div className="relative">
                    <input
                      type="search"
                      aria-label="Rechercher une tâche"
                      placeholder="Rechercher une tâche"
                      className="border border-gray-300 rounded-full pl-4 pr-9 py-1.5 text-sm text-gray-900 placeholder-gray-600 bg-white focus:outline-none focus:border-orange-500 w-44"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <SearchIcon cls="w-4 h-4 text-gray-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Affichage selon la vue */}
              {view === 'calendar' ? (
                <CalendarView
                  tasks={filteredTasks}
                  onTaskClick={canViewTask ? (task) => { setSelectedTask(task); setShowTaskModal(true); } : null}
                />
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-700 mb-4">
                    {search || statusFilter !== 'ALL' ? 'Aucune tâche trouvée' : 'Aucune tâche dans ce projet'}
                  </p>
                  {!search && statusFilter === 'ALL' && canCreateTask && (
                    <button
                      type="button"
                      onClick={() => { setSelectedTask(null); setShowTaskModal(true); }}
                      className="bg-gray-900 text-white text-sm px-5 py-2.5 rounded-full hover:bg-gray-800 transition-colors"
                    >
                      + Créer une tâche
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {filteredTasks.map((t) => (
                    <TaskCardDetail
                      key={t.id}
                      task={t}
                      onMenuClick={canViewTask ? (task) => { setSelectedTask(task); setShowTaskModal(true); } : null}
                      onDelete={canCreateTask ? handleQuickDeleteTask : null}
                      authFetch={authFetch}
                      projectId={projectId}
                      currentUser={user}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
      <Footer />

      <TaskModal
        isOpen={showTaskModal}
        onClose={() => { setShowTaskModal(false); setSelectedTask(null); }}
        authFetch={authFetch}
        projectId={projectId}
        task={selectedTask}
        onSaved={handleTaskSaved}
        onDeleted={handleTaskDeleted}
        projectMembers={team}
      />

      <EditProjectModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        authFetch={authFetch}
        project={project}
        onSaved={fetchProject}
      />
    </div>
  );
}