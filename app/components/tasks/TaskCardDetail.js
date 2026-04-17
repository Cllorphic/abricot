'use client';

import { useState, useEffect } from 'react';
import StatusBadge from '../ui/StatusBadge';
import { CalendarIcon, CommentIcon, DotsIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon } from '../ui/Icon';
import { getInitials } from '../../lib/userUtils';

// Carte détaillée d'une tâche dans la page projet.
// Inclut : titre, description, statut, échéance, assignés et section commentaires dépliable.
//
// Props :
//   - task : la tâche à afficher
//   - onMenuClick : callback (task) => void si l'utilisateur peut ouvrir la modale d'édition (null sinon)
//   - onDelete : callback (taskId) => void si l'utilisateur peut supprimer la tâche (null sinon)
//   - authFetch : fonction fetch authentifiée
//   - projectId : id du projet (pour les appels API)
//   - currentUser : utilisateur courant (pour afficher son nom sur les commentaires postés)
export default function TaskCardDetail({ task, onMenuClick, onDelete, authFetch, projectId, currentUser }) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [commentsList, setCommentsList] = useState([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [commentError, setCommentError] = useState('');

  const dueDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
    : null;
  const assignees = (task.assignees || task.taskAssignees || []).map((a) => a.user || a);

  // Chargement des commentaires au montage
  useEffect(() => {
    if (!authFetch || !projectId || !task?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch(`/projects/${projectId}/tasks/${task.id}/comments`);
        const data = await res.json();
        if (cancelled) return;
        if (res.ok) {
          let list = [];
          if (Array.isArray(data)) list = data;
          else if (Array.isArray(data.data)) list = data.data;
          else if (data.data && typeof data.data === 'object') {
            for (const key of Object.keys(data.data)) {
              if (Array.isArray(data.data[key])) { list = data.data[key]; break; }
            }
          }
          setCommentsList(list);
        }
      } catch (err) { /* silently fail */ }
      if (!cancelled) setCommentsLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [authFetch, projectId, task?.id]);

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    setIsPosting(true);
    setCommentError('');
    try {
      const res = await authFetch(`/projects/${projectId}/tasks/${task.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: newComment.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur lors de l\'envoi');
      const posted = data.data?.comment || data.data || data.comment || data;
      setCommentsList((prev) => [...prev, {
        id: posted.id || Date.now(),
        content: newComment.trim(),
        createdAt: posted.createdAt || new Date().toISOString(),
        author: currentUser || { name: 'Moi' },
      }]);
      setNewComment('');
    } catch (err) {
      setCommentError(err.message);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-2xl p-5 sm:p-6 hover:border-gray-300 transition-colors">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-bold text-gray-900">{task.title}</h3>
            <StatusBadge status={task.status} />
          </div>
          {task.description && <p className="text-sm text-gray-700 mt-1">{task.description}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {onMenuClick && (
            <button
              type="button"
              onClick={() => onMenuClick(task)}
              className="w-10 h-10 border border-gray-200 rounded-xl flex items-center justify-center text-gray-700 hover:text-gray-900 hover:border-gray-300 transition-colors"
              aria-label="Modifier la tâche"
            >
              <DotsIcon />
            </button>
          )}
          {onDelete && !onMenuClick && (
            <button
              type="button"
              onClick={() => setConfirmDel(true)}
              className="w-10 h-10 border border-gray-200 rounded-xl flex items-center justify-center text-gray-700 hover:text-red-700 hover:border-red-300 transition-colors"
              aria-label="Supprimer la tâche"
            >
              <TrashIcon />
            </button>
          )}
        </div>
      </div>

      {/* Confirmation de suppression */}
      {confirmDel && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-2">
          <p className="text-xs text-red-800">Supprimer cette tâche ?</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { onDelete(task.id); setConfirmDel(false); }}
              className="bg-red-600 text-white text-xs px-3 py-1 rounded-full hover:bg-red-700"
            >
              Oui
            </button>
            <button
              type="button"
              onClick={() => setConfirmDel(false)}
              className="border border-gray-200 text-gray-700 text-xs px-3 py-1 rounded-full hover:bg-gray-50"
            >
              Non
            </button>
          </div>
        </div>
      )}

      {/* Échéance */}
      {dueDate && (
        <div className="flex items-center gap-2 mt-4 text-sm text-gray-700">
          <span className="text-gray-700">Échéance :</span>
          <CalendarIcon cls="w-4 h-4 text-gray-700" />
          <span>{dueDate}</span>
        </div>
      )}

      {/* Assignés */}
      {assignees.length > 0 && (
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-sm text-gray-700">Assigné à :</span>
          {assignees.map((u, i) => (
            <div key={u.id || u.email || i} className="flex items-center gap-1">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-semibold bg-gray-200 text-gray-800">
                {getInitials(u)}
              </span>
              <span className="text-xs text-gray-800 bg-gray-100 px-2 py-0.5 rounded-full">{u.name || u.email}</span>
            </div>
          ))}
        </div>
      )}

      {/* Section commentaires */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={() => setCommentsOpen(!commentsOpen)}
          aria-expanded={commentsOpen}
          className="flex items-center justify-between w-full text-sm text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <CommentIcon cls="w-4 h-4" />
            Commentaires{commentsLoaded ? ` (${commentsList.length})` : ''}
          </span>
          {commentsOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </button>

        {commentsOpen && (
          <div className="mt-3">
            {!commentsLoaded && (
              <p className="text-xs text-gray-700 mb-3">Chargement des commentaires...</p>
            )}

            {commentsLoaded && commentsList.length > 0 && (
              <div className="flex flex-col gap-2.5 mb-4">
                {commentsList.map((c, i) => (
                  <div key={c.id || i} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-semibold bg-gray-200 text-gray-800">
                        {getInitials(c.user || c.author)}
                      </span>
                      <span className="text-xs font-medium text-gray-800">
                        {c.user?.name || c.author?.name || 'Utilisateur'}
                      </span>
                      {c.createdAt && (
                        <span className="text-xs text-gray-700">
                          {new Date(c.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-800">{c.content || c.text || c.body}</p>
                  </div>
                ))}
              </div>
            )}

            {commentsLoaded && commentsList.length === 0 && (
              <p className="text-xs text-gray-700 mb-3">Aucun commentaire pour le moment</p>
            )}

            {commentError && <p className="text-red-800 text-xs mb-2">{commentError}</p>}
            <div className="flex gap-2">
              <label htmlFor={`comment-${task.id}`} className="sr-only">Écrire un commentaire</label>
              <input
                id={`comment-${task.id}`}
                type="text"
                className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-gray-600 bg-white focus:outline-none focus:border-orange-500"
                placeholder="Écrire un commentaire..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePostComment(); } }}
                disabled={isPosting}
              />
              <button
                type="button"
                onClick={handlePostComment}
                disabled={isPosting || !newComment.trim()}
                className="bg-gray-900 text-white text-sm px-4 py-2 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-40 shrink-0"
              >
                {isPosting ? '...' : 'Envoyer'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}