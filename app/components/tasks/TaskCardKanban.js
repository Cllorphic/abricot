import StatusBadge from '../ui/StatusBadge';
import TaskMeta from './TaskMeta';

// Carte de tâche utilisée dans la vue "kanban" du dashboard.
// Plus compacte que TaskCardList.
// Props :
//   - task : l'objet tâche
//   - onView : callback appelé quand on clique sur "Voir"
export default function TaskCardKanban({ task, onView }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="font-semibold text-sm text-gray-900 truncate">{task.title}</h3>
        <StatusBadge status={task.status} />
      </div>
      {task.description && <p className="text-xs text-gray-700 line-clamp-2">{task.description}</p>}
      <TaskMeta task={task} />
      <button
        onClick={() => onView(task)}
        aria-label={`Voir la tâche : ${task.title}`}
        className="bg-gray-900 text-white text-sm px-6 py-2 rounded-full hover:bg-gray-800 transition-colors mt-4"
      >
        Voir
      </button>
    </div>
  );
}