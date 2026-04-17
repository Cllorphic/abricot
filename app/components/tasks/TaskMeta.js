import { FolderIcon, CalendarIcon, CommentIcon } from '../ui/Icon';

// Affiche les métadonnées d'une tâche (projet, échéance, commentaires) sous la forme d'une ligne d'infos.
// Props : task (objet tâche complet)
export default function TaskMeta({ task }) {
  const dueDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    : null;
  const comments = task._count?.comments || task.comments?.length || 0;

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-700 mt-3">
      {task.project?.name && (
        <span className="flex items-center gap-1">
          <FolderIcon /> {task.project.name}
        </span>
      )}
      {dueDate && (
        <>
          <span aria-hidden="true" className="hidden sm:inline">|</span>
          <span className="flex items-center gap-1">
            <CalendarIcon /> <span><span className="sr-only">Échéance : </span>{dueDate}</span>
          </span>
        </>
      )}
      {comments > 0 && (
        <>
          <span aria-hidden="true" className="hidden sm:inline">|</span>
          <span className="flex items-center gap-1">
            <CommentIcon /> <span><span className="sr-only">Commentaires : </span>{comments}</span>
          </span>
        </>
      )}
    </div>
  );
}