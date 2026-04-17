import { getInitials } from '../../lib/userUtils';

// Affiche un avatar (initiales) suivi du nom de l'utilisateur dans une pastille.
// Utilisé dans la barre des contributeurs de la page projet.
//
// Props :
//   - user : objet utilisateur
//   - isOwner : booléen, affiche "Propriétaire" à la place du nom pour le propriétaire
export default function AvatarWithName({ user, isOwner = false }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold shrink-0 ${
          isOwner ? 'bg-orange-100 text-orange-800' : 'bg-gray-200 text-gray-800'
        }`}
      >
        {getInitials(user)}
      </span>
      {isOwner ? (
        <span className="text-xs font-medium text-orange-800 bg-orange-50 px-2.5 py-1 rounded-full">Propriétaire</span>
      ) : (
        <span className="text-xs text-gray-800 bg-gray-100 px-2.5 py-1 rounded-full">{user.name || user.email}</span>
      )}
    </div>
  );
}