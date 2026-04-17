import TaskCardKanban from './TaskCardKanban';

// Colonne d'un tableau kanban (ex : "À faire", "En cours", "Terminées").
// Props :
//   - title : titre affiché en haut de la colonne
//   - tasks : liste des tâches à afficher
//   - onView : callback passé à chaque carte de tâche
export default function KanbanColumn({ title, tasks, onView }) {
  return (
    <div className="border border-gray-200 rounded-2xl p-4 sm:p-5 bg-gray-50/50 lg:flex-1">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <span
          className="text-xs bg-gray-200 text-gray-900 px-2 py-0.5 rounded-full"
          aria-label={`${tasks.length} tâche${tasks.length > 1 ? 's' : ''}`}
        >
          {tasks.length}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {tasks.length === 0 ? (
          <p className="text-sm text-gray-700 text-center py-8">Aucune tâche</p>
        ) : (
          tasks.map((t) => <TaskCardKanban key={t.id} task={t} onView={onView} />)
        )}
      </div>
    </div>
  );
}