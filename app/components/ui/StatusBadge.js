import { statusConfig } from '../../lib/taskConfig';

// Affiche une pastille colorée représentant le statut d'une tâche.
// Props : status (string) — une des clés de statusConfig (TODO, IN_PROGRESS, DONE, CANCELLED).

export default function StatusBadge({ status }) {
  const c = statusConfig[status] || statusConfig.TODO;
  return (
    <span className={`text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}