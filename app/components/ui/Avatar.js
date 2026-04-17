import { getInitials } from '../../lib/userUtils';

// Pastille ronde affichant les initiales d'un utilisateur.
// Props :
//   - user : objet utilisateur (name, email)
//   - isOwner : booléen, affiche un style particulier (orange avec ring) pour le propriétaire
export default function Avatar({ user, isOwner = false }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold shrink-0 ${
        isOwner ? 'bg-orange-100 text-orange-800 ring-2 ring-orange-300' : 'bg-gray-100 text-gray-800'
      }`}
      title={user?.name || user?.email || ''}
    >
      {getInitials(user)}
    </span>
  );
}