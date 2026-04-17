import Link from 'next/link';
import Avatar from '../ui/Avatar';
import ProgressBar from '../ui/ProgressBar';
import { TeamIcon } from '../ui/Icon';

// Carte d'un projet affichée dans la grille de la page /projects.
// Affiche le nom, description, progression (tâches done/total) et l'équipe (avatars).
//
// Props :
//   - project : l'objet projet complet (avec tasks, owner, members...)
export default function ProjectCard({ project }) {
  const tasks = project.tasks || [];
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === 'DONE').length;

  // Construction de l'équipe : owner marqué comme tel + contributors, en évitant les doublons
  const owner = project.owner || project.user || null;
  const members = project.members || project.contributors || project.projectMembers || [];

  const team = [];
  if (owner) team.push({ ...owner, _isOwner: true });
  members.forEach((m) => {
    const user = m.user || m;
    if (user.id !== owner?.id) team.push(user);
  });

  return (
    <Link href={`/projects/${project.id}`} className="block">
      <div className="border border-gray-200 rounded-2xl p-5 sm:p-6 hover:border-gray-300 hover:shadow-sm transition-all flex flex-col justify-between h-full">
        {/* En-tête */}
        <div>
          <h3 className="font-bold text-gray-900 mb-1 truncate">{project.name}</h3>
          {project.description && (
            <p className="text-sm text-gray-700 line-clamp-2 mb-6">{project.description}</p>
          )}
        </div>

        {/* Progression */}
        <div className="mb-6">
          <ProgressBar done={doneTasks} total={totalTasks} />
        </div>

        {/* Équipe */}
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-700 mb-3">
            <TeamIcon />
            <span>Équipe ({team.length})</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {team.slice(0, 5).map((member, i) => (
              <div key={member.id || member.email || i} className="flex items-center gap-1">
                <Avatar user={member} isOwner={member._isOwner} />
                {member._isOwner && (
                  <span className="text-xs font-medium text-orange-800 bg-orange-50 px-2.5 py-1 rounded-full">
                    Propriétaire
                  </span>
                )}
              </div>
            ))}
            {team.length > 5 && (
              <span className="text-xs text-gray-700">+{team.length - 5}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}