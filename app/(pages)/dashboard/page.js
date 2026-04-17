'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import SearchBar from '../../components/ui/SearchBar';
import TaskCardList from '../../components/tasks/TaskCardList';
import KanbanColumn from '../../components/tasks/KanbanColumn';
import TaskDetailModal from '../../components/tasks/TaskDetailModal';
import CreateProjectModal from '../../components/projects/CreateProjectModal';
import { ChevronLeftIcon, ChevronRightIcon } from '../../components/ui/Icon';
import { priorityOrder } from '../../lib/taskConfig';

const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

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

export default function DashboardPage() {
  const { user, loading, authFetch } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [view, setView] = useState('list');
  const [search, setSearch] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  // Mois courant pour la vue kanban (année + mois 0-indexé)
  const [kanbanMonth, setKanbanMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  // Chargement des tâches du dashboard
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

        // 2. Charger les projets pour récupérer les tâches IN_PROGRESS et DONE manquantes
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

            details.forEach((proj) => {
              if (!proj?.tasks) return;
              proj.tasks.forEach((task) => {
                if (existingIds.has(task.id)) return;
                if (task.status === 'IN_PROGRESS' || task.status === 'DONE') {
                  allTasks.push({ ...task, project: { id: proj.id, name: proj.name } });
                  existingIds.add(task.id);
                }
              });
            });
          }
        } catch (err) { /* on a au moins les tâches actives */ }

        allTasks.sort((a, b) => (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99));
        setTasks(allTasks);
      } catch (err) {
        console.error('Erreur chargement dashboard:', err);
      } finally {
        setLoadingData(false);
      }
    }
    fetchData();
  }, [loading, user, authFetch]);

  const handleTaskUpdated = (updatedTask) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t)));
  };

  const handleTaskDeleted = (taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  // Filtrage par recherche
  const filteredTasks = tasks.filter(
    (t) =>
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase())
  );

  // Vue liste : les 10 tâches actives les plus récemment créées
  const listTasks = filteredTasks
    .filter((t) => t.status !== 'DONE' && t.status !== 'CANCELLED')
    .slice()
    .sort((a, b) => {
      const da = new Date(a.createdAt || a.created_at || 0).getTime();
      const db = new Date(b.createdAt || b.created_at || 0).getTime();
      return db - da; // plus récent en premier
    })
    .slice(0, 10);

  // Vue kanban : filtrer par mois (basé sur dueDate) puis par statut
  const kanbanTasks = filteredTasks.filter((t) => {
    if (!t.dueDate) return false; // pas d'échéance = pas dans le kanban mois
    const d = new Date(t.dueDate);
    return d.getFullYear() === kanbanMonth.year && d.getMonth() === kanbanMonth.month;
  });
  const kanban = {
    TODO: kanbanTasks.filter((t) => t.status === 'TODO'),
    IN_PROGRESS: kanbanTasks.filter((t) => t.status === 'IN_PROGRESS'),
    DONE: kanbanTasks.filter((t) => t.status === 'DONE'),
  };

  // Navigation entre mois (kanban)
  const prevMonth = () => setKanbanMonth(({ year, month }) => {
    if (month === 0) return { year: year - 1, month: 11 };
    return { year, month: month - 1 };
  });
  const nextMonth = () => setKanbanMonth(({ year, month }) => {
    if (month === 11) return { year: year + 1, month: 0 };
    return { year, month: month + 1 };
  });
  const goTodayMonth = () => {
    const now = new Date();
    setKanbanMonth({ year: now.getFullYear(), month: now.getMonth() });
  };

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
        {/* En-tête */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Tableau de bord</h1>
            <p className="text-sm sm:text-base text-gray-700 mt-1">
              Bonjour {user?.name || user?.email}, voici un aperçu de vos projets et tâches
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="bg-gray-900 text-white text-sm px-5 py-2.5 rounded-full hover:bg-gray-800 transition-colors w-fit"
          >
            + Créer un projet
          </button>
        </div>

        {/* Onglets Liste / Kanban */}
        <div className="flex items-center gap-1 mb-6 overflow-x-auto" role="tablist" aria-label="Vues du tableau de bord">
          {[
            { key: 'list', label: 'Liste', d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
            { key: 'kanban', label: 'Kanban', d: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z' },
          ].map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={view === tab.key}
              onClick={() => setView(tab.key)}
              className={`flex items-center gap-2 text-sm px-4 py-2 rounded-full transition-colors whitespace-nowrap ${
                view === tab.key ? 'bg-orange-50 text-orange-700 font-medium' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={tab.d} />
              </svg>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Vue Liste */}
        {view === 'list' && (
          <div className="border border-gray-200 rounded-2xl p-4 sm:p-6" role="tabpanel">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h2 className="font-semibold text-gray-900">Mes tâches assignées</h2>
                <p className="text-sm text-gray-700">Les 10 dernières tâches créées</p>
              </div>
              <SearchBar
                id="search-tasks-list"
                value={search}
                onChange={setSearch}
                placeholder="Rechercher une tâche"
                label="Rechercher une tâche"
              />
            </div>
            {loadingData ? (
              <p className="text-gray-700 text-center py-12">Chargement...</p>
            ) : listTasks.length === 0 ? (
              <p className="text-gray-700 text-center py-12">
                {search ? 'Aucune tâche trouvée' : 'Aucune tâche assignée'}
              </p>
            ) : (
              <div className="flex flex-col gap-3 sm:gap-4">
                {listTasks.map((t) => (
                  <TaskCardList key={t.id} task={t} onView={setSelectedTask} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Vue Kanban */}
        {view === 'kanban' && (
          <div role="tabpanel">
            {/* Navigation entre mois */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={prevMonth}
                  aria-label="Mois précédent"
                  className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 transition-colors text-gray-700"
                >
                  <ChevronLeftIcon />
                </button>
                <h2 className="text-base font-semibold text-gray-900 min-w-[180px] text-center">
                  {MONTHS_FR[kanbanMonth.month]} {kanbanMonth.year}
                </h2>
                <button
                  type="button"
                  onClick={nextMonth}
                  aria-label="Mois suivant"
                  className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 transition-colors text-gray-700"
                >
                  <ChevronRightIcon />
                </button>
                <button
                  type="button"
                  onClick={goTodayMonth}
                  className="text-xs text-orange-700 hover:text-orange-800 font-medium px-3 py-1.5 rounded-full border border-orange-300 hover:bg-orange-50 transition-colors ml-1"
                >
                  Aujourd&apos;hui
                </button>
              </div>
              <SearchBar
                id="search-tasks-kanban"
                value={search}
                onChange={setSearch}
                placeholder="Rechercher une tâche"
                label="Rechercher une tâche"
              />
            </div>
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
              <KanbanColumn title="À faire" tasks={kanban.TODO} onView={setSelectedTask} />
              <KanbanColumn title="En cours" tasks={kanban.IN_PROGRESS} onView={setSelectedTask} />
              <KanbanColumn title="Terminées" tasks={kanban.DONE} onView={setSelectedTask} />
            </div>
          </div>
        )}
      </main>
      <Footer />

      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        authFetch={authFetch}
      />
      <TaskDetailModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        authFetch={authFetch}
        onTaskUpdated={handleTaskUpdated}
        onTaskDeleted={handleTaskDeleted}
      />
    </div>
  );
}