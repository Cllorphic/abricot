'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UserSearchInput from '../components/UserSearchInput';
import Link from 'next/link';

// ──── Icônes ────
const Icon = {
  Close: ({ cls = 'w-6 h-6' }) => (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Team: ({ cls = 'w-4 h-4' }) => (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
};

// ──── Helper : extraire un tableau depuis une réponse API ────
function extractArray(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    for (const key of Object.keys(data)) {
      if (Array.isArray(data[key])) return data[key];
    }
  }
  return [];
}

// ──── Initiales d'un utilisateur ────
function getInitials(user) {
  if (user?.name) return user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  if (user?.email) return user.email[0].toUpperCase();
  return '?';
}

// ──── Avatar pastille ────
function Avatar({ user, isOwner = false }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold shrink-0 ${
        isOwner ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-300' : 'bg-gray-100 text-gray-700'
      }`}
      title={user?.name || user?.email || ''}
    >
      {getInitials(user)}
    </span>
  );
}

// ──── Barre de progression ────
function ProgressBar({ done, total }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-gray-500">Progression</span>
        <span className="text-xs font-medium text-gray-900">{pct}%</span>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-orange-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-1.5">{done}/{total} tâches terminées</p>
    </div>
  );
}

// ──── Carte projet ────
function ProjectCard({ project, currentUserId }) {
  const tasks = project.tasks || [];
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === 'DONE').length;

  // Membres : owner + contributors
  const owner = project.owner || project.user || null;
  const members = project.members || project.contributors || project.projectMembers || [];

  // Dédupliquer et construire la liste d'équipe
  const team = [];
  if (owner) team.push({ ...owner, _isOwner: true });
  members.forEach((m) => {
    const user = m.user || m;
    if (user.id !== owner?.id) team.push(user);
  });

  return (
    <Link href={`/projects/${project.id}`} className="block">
      <div className="border border-gray-200 rounded-2xl p-5 sm:p-6 hover:border-gray-300 hover:shadow-sm transition-all flex flex-col justify-between h-full">
        {/* En-tête */}
        <div>
          <h3 className="font-bold text-gray-900 mb-1 truncate">{project.name}</h3>
          {project.description && (
            <p className="text-sm text-gray-500 line-clamp-2 mb-6">{project.description}</p>
          )}
        </div>

        {/* Progression */}
        <div className="mb-6">
          <ProgressBar done={doneTasks} total={totalTasks} />
        </div>

        {/* Équipe */}
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
            <Icon.Team />
            <span>Équipe ({team.length})</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {team.slice(0, 5).map((member, i) => (
              <div key={member.id || member.email || i} className="flex items-center gap-1">
                <Avatar user={member} isOwner={member._isOwner} />
                {member._isOwner && (
                  <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
                    Propriétaire
                  </span>
                )}
              </div>
            ))}
            {team.length > 5 && (
              <span className="text-xs text-gray-400">+{team.length - 5}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ══════════════════════════════════
// ──── Modal Créer un projet ────
// ══════════════════════════════════
function CreateProjectModal({ isOpen, onClose, authFetch, onProjectCreated }) {
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
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          contributors: contributors.map((c) => c.email),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur lors de la création');
      const projectId = data.data?.id || data.data?.project?.id || data.id || data.project?.id;
      if (projectId) {
        router.push(`/projects/${projectId}`);
      } else {
        onClose();
        if (onProjectCreated) onProjectCreated();
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
        <button type="button" onClick={onClose} className="absolute top-4 right-4 sm:top-6 sm:right-6 text-gray-400 hover:text-gray-600" aria-label="Fermer">
          <Icon.Close />
        </button>
        <h2 className="text-xl font-bold text-gray-900 mb-6 sm:mb-8">Créer un projet</h2>
        {error && <p className="text-red-600 text-sm mb-4 p-3 bg-red-50 rounded-lg">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 sm:gap-6">
          <div>
            <label htmlFor="project-name" className="block text-sm font-medium text-gray-900 mb-2">
              Titre<span className="text-red-500">*</span>
            </label>
            <input
              id="project-name"
              type="text"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-orange-400"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom du projet"
            />
          </div>
          <div>
            <label htmlFor="project-desc" className="block text-sm font-medium text-gray-900 mb-2">
              Description<span className="text-red-500">*</span>
            </label>
            <textarea
              id="project-desc"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-orange-400 resize-none"
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
            className="bg-gray-900 text-white font-medium py-3 px-6 rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50 w-fit"
          >
            {isSubmitting ? 'Création...' : 'Ajouter un projet'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ══════════════════════════════
// ──── Page Projets ────
// ══════════════════════════════
export default function ProjectsPage() {
  const { user, loading, authFetch } = useAuth();
  const router = useRouter();

  const [projects, setProjects] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      // 1. Charger la liste des projets
      const res = await authFetch('/projects');
      const data = await res.json();
      let projectsList = [];
      if (res.ok) {
        if (Array.isArray(data)) projectsList = data;
        else if (Array.isArray(data.data)) projectsList = data.data;
        else if (data.data && typeof data.data === 'object') {
          for (const key of Object.keys(data.data)) {
            if (Array.isArray(data.data[key])) { projectsList = data.data[key]; break; }
          }
        }
      }

      // 2. Pour chaque projet, charger les détails complets (avec toutes les tâches)
      if (projectsList.length > 0) {
        const detailed = await Promise.all(
          projectsList.map(async (p) => {
            try {
              const detailRes = await authFetch(`/projects/${p.id}`);
              const detailData = await detailRes.json();
              if (detailRes.ok) {
                const proj = detailData.data?.project || detailData.data || detailData.project || detailData;
                return { ...p, ...proj };
              }
            } catch (err) { /* garder le projet sans détails */ }
            return p;
          })
        );
        setProjects(detailed);
      } else {
        setProjects([]);
      }
    } catch (err) {
      console.error('Erreur chargement projets:', err);
    } finally {
      setLoadingData(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (loading || !user) return;
    fetchProjects();
  }, [loading, user, fetchProjects]);

  const handleProjectCreated = () => {
    setLoadingData(true);
    fetchProjects();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        {/* En-tête */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 sm:mb-10">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mes projets</h1>
            <p className="text-sm sm:text-base text-gray-500 mt-1">Gérez vos projets</p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="bg-gray-900 text-white text-sm px-5 py-2.5 rounded-full hover:bg-gray-800 transition-colors w-fit"
          >
            + Créer un projet
          </button>
        </div>

        {/* Grille de projets */}
        {loadingData ? (
          <p className="text-gray-500 text-center py-16">Chargement des projets...</p>
        ) : projects.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-4">Aucun projet pour le moment</p>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="bg-gray-900 text-white text-sm px-5 py-2.5 rounded-full hover:bg-gray-800 transition-colors"
            >
              + Créer votre premier projet
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} currentUserId={user?.id} />
            ))}
          </div>
        )}
      </main>
      <Footer />

      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        authFetch={authFetch}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
}