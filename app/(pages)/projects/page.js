'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import ProjectCard from '../../components/projects/ProjectCard';
import CreateProjectModal from '../../components/projects/CreateProjectModal';

export default function ProjectsPage() {
  const { user, loading, authFetch } = useAuth();

  const [projects, setProjects] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Chargement des projets + détails (pour récupérer toutes les tâches)
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

      // 2. Pour chaque projet, charger les détails complets (nécessaire pour la progression)
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
        <p className="text-gray-700">Chargement...</p>
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
            <p className="text-sm sm:text-base text-gray-700 mt-1">Gérez vos projets</p>
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
          <p className="text-gray-700 text-center py-16">Chargement des projets...</p>
        ) : projects.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-700 mb-4">Aucun projet pour le moment</p>
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
              <ProjectCard key={project.id} project={project} />
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