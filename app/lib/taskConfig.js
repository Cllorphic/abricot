// Configuration des statuts de tâches : labels FR et classes Tailwind.
// Partagée entre tous les composants qui affichent un statut (badges, boutons, etc.).

export const statusConfig = {
  TODO: { label: 'À faire', bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-300' },
  IN_PROGRESS: { label: 'En cours', bg: 'bg-yellow-50', text: 'text-yellow-900', border: 'border-yellow-300' },
  DONE: { label: 'Terminée', bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-300' },
  CANCELLED: { label: 'Annulée', bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' },
};

export const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };