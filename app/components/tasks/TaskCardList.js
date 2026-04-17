import StatusBadge from '../ui/StatusBadge';
import TaskMeta from './TaskMeta';

// Carte de tâche utilisée dans la vue "liste" du dashboard.
// Props :
//   - task : l'objet tâche
//   - onView : callback appelé quand on clique sur "Voir"
export default function TaskCardList({ task, onView }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 sm:p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between hover:border-gray-300 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{task.title}</h3>
          <StatusBadge status={task.status} />
        </div>
        {task.description && <p className="text-sm text-gray-700 line-clamp-1">{task.description}</p>}
        <TaskMeta task={task} />
      </div>
      <button
        onClick={() => onView(task)}
        aria-label={`Voir la tâche : ${task.title}`}
        className="bg-gray-900 text-white text-sm px-6 py-2.5 rounded-full hover:bg-gray-800 transition-colors self-start sm:self-center shrink-0"
      >
        Voir
      </button>
    </div>
  );
}