// Barre de progression basée sur un nombre "fait" / "total".
// Props :
//   - done : nombre d'éléments terminés
//   - total : nombre total d'éléments
//   - label : étiquette affichée au-dessus (défaut: "Progression")
//   - unit : unité pour le texte du bas (défaut: "tâches terminées")
export default function ProgressBar({ done, total, label = 'Progression', unit = 'tâches terminées' }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-gray-700">{label}</span>
        <span className="text-xs font-medium text-gray-900">{pct}%</span>
      </div>
      <div
        className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-orange-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-700 mt-1.5">{done}/{total} {unit}</p>
    </div>
  );
}