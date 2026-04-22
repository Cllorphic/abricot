import Link from 'next/link';
import { FolderIcon } from '../ui/Icon';
import { statusConfig } from '../../lib/taskConfig';

// Ligne compacte d'un projet dans la liste du dashboard.
// Affiche le nom du projet, sa description, le nombre de tâches par statut
// et le compteur de tâches urgentes assignées à l'utilisateur.
//
// Props :
//   - project : l'objet projet (avec ses tâches)
//   - assignedTasksCount : objet { urgent, total } — nombre de tâches assignées à l'utilisateur
export default function ProjectListItem({ project, assignedTasksCount }) {
  const tasks = project.tasks || [];
  const byStatus = {
    TODO: tasks.filter((t) => t.status === 'TODO').length,
    IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
    DONE: tasks.filter((t) => t.status === 'DONE').length,
  };

  return (
    <Link href={`/projects/${project.id}`} className="block">
      <div className="border border-gray-200 rounded-xl p-4 sm:p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between hover:border-gray-300 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <FolderIcon cls="w-4 h-4 text-gray-700" />
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{project.name}</h3>
          </div>
          {project.description && (
            <p className="text-sm text-gray-700 line-clamp-1">{project.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-700 mt-2">
            <span>
              {assignedTasksCount?.total ?? 0} tâche{(assignedTasksCount?.total ?? 0) > 1 ? 's' : ''} assignée{(assignedTasksCount?.total ?? 0) > 1 ? 's' : ''}
            </span>
            <span aria-hidden="true">|</span>
            <span className={statusConfig.TODO.text}>{byStatus.TODO} à faire</span>
            <span aria-hidden="true">|</span>
            <span className={statusConfig.IN_PROGRESS.text}>{byStatus.IN_PROGRESS} en cours</span>
            <span aria-hidden="true">|</span>
            <span className={statusConfig.DONE.text}>{byStatus.DONE} terminée{byStatus.DONE > 1 ? 's' : ''}</span>
          </div>
        </div>
        <span className="text-sm text-orange-700 font-medium shrink-0">Ouvrir →</span>
      </div>
    </Link>
  );
}