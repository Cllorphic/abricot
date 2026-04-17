// Retourne les initiales d'un utilisateur (2 caractères max).
// Prend le name en priorité, sinon la première lettre de l'email.
export function getInitials(user) {
  if (user?.name) return user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  if (user?.email) return user.email[0].toUpperCase();
  return '?';
}