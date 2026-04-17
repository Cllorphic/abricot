'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import UserSearchInput from '../../components/UserSearchInput';

// ──── Config ────
const statusConfig = {
  TODO: { label: 'À faire', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
  IN_PROGRESS: { label: 'En cours', bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200' },
  DONE: { label: 'Terminée', bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  CANCELLED: { label: 'Annulée', bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
};

function extractArray(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    for (const key of Object.keys(data)) {
      if (Array.isArray(data[key])) return data[key];
    }
  }
  return [];
}

function getInitials(user) {
  if (user?.name) return user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  if (user?.email) return user.email[0].toUpperCase();
  return '?';
}

// ──── Icônes ────
const Icon = {
  Close: ({ cls = 'w-6 h-6' }) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
  Trash: ({ cls = 'w-4 h-4' }) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Back: ({ cls = 'w-5 h-5' }) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>,
  Calendar: ({ cls = 'w-4 h-4' }) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Search: ({ cls = 'w-4 h-4' }) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  List: ({ cls = 'w-4 h-4' }) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
  CalendarView: ({ cls = 'w-4 h-4' }) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Dots: ({ cls = 'w-5 h-5' }) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01" /></svg>,
  ChevronDown: ({ cls = 'w-4 h-4' }) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>,
  ChevronUp: ({ cls = 'w-4 h-4' }) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>,
  ChevronLeft: ({ cls = 'w-4 h-4' }) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>,
  ChevronRight: ({ cls = 'w-4 h-4' }) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>,
  Sparkle: ({ cls = 'w-4 h-4' }) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
  Comment: ({ cls = 'w-4 h-4' }) => <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
};

function StatusBadge({ status }) {
  const c = statusConfig[status] || statusConfig.TODO;
  return <span className={`text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ${c.bg} ${c.text}`}>{c.label}</span>;
}

// ──── Avatar + nom ────
function AvatarWithName({ user, isOwner = false }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold shrink-0 ${isOwner ? 'bg-orange-100 text-orange-700' : 'bg-gray-200 text-gray-700'}`}>
        {getInitials(user)}
      </span>
      {isOwner && <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">Propriétaire</span>}
      {!isOwner && <span className="text-xs text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full">{user.name || user.email}</span>}
    </div>
  );
}

// ══════════════════════════════════
// ──── Vue Calendrier ────
// ══════════════════════════════════
const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

function CalendarView({ tasks, onTaskClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation mois
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  // Construire la grille du mois
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Lundi = 0, Dimanche = 6
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const daysInMonth = lastDay.getDate();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  // Grouper les tâches par date d'échéance (YYYY-MM-DD)
  const tasksByDate = {};
  tasks.forEach((t) => {
    if (!t.dueDate) return;
    const d = t.dueDate.split('T')[0];
    if (!tasksByDate[d]) tasksByDate[d] = [];
    tasksByDate[d].push(t);
  });

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Couleur du point selon le statut
  const dotColor = (status) => {
    if (status === 'DONE') return 'bg-green-400';
    if (status === 'IN_PROGRESS') return 'bg-yellow-400';
    return 'bg-red-400';
  };

  return (
    <div>
      {/* Header navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button type="button" onClick={prevMonth} aria-label="Mois précédent" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-700">
            <Icon.ChevronLeft />
          </button>
          <h3 className="text-sm font-semibold text-gray-900 min-w-[160px] text-center">
            {MONTHS_FR[month]} {year}
          </h3>
          <button type="button" onClick={nextMonth} aria-label="Mois suivant" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-700">
            <Icon.ChevronRight />
          </button>
        </div>
        <button type="button" onClick={goToday} className="text-xs text-orange-700 hover:text-orange-800 font-medium px-3 py-1 rounded-full border border-orange-300 hover:bg-orange-50 transition-colors">
          Aujourd&apos;hui
        </button>
      </div>

      {/* Jours de la semaine */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_FR.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">{d}</div>
        ))}
      </div>

      {/* Grille des jours */}
      <div className="grid grid-cols-7 border-t border-l border-gray-200">
        {Array.from({ length: totalCells }).map((_, i) => {
          const dayNum = i - startOffset + 1;
          const isCurrentMonth = dayNum >= 1 && dayNum <= daysInMonth;
          const dateStr = isCurrentMonth
            ? `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
            : null;
          const isToday = dateStr === todayStr;
          const dayTasks = dateStr ? (tasksByDate[dateStr] || []) : [];

          return (
            <div
              key={i}
              className={`border-r border-b border-gray-200 min-h-[80px] sm:min-h-[100px] p-1.5 ${
                isCurrentMonth ? 'bg-white' : 'bg-gray-50/50'
              }`}
            >
              {isCurrentMonth && (
                <>
                  {/* Numéro du jour */}
                  <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday ? 'bg-orange-500 text-white' : 'text-gray-700'
                  }`}>
                    {dayNum}
                  </div>

                  {/* Tâches du jour */}
                  <div className="flex flex-col gap-0.5">
                    {dayTasks.slice(0, 3).map((t) => (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => onTaskClick && onTaskClick(t)}
                        className="flex items-center gap-1 text-left w-full group"
                        title={t.title}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor(t.status)}`} />
                        <span className="text-[10px] sm:text-xs text-gray-700 truncate group-hover:text-orange-600 transition-colors">
                          {t.title}
                        </span>
                      </button>
                    ))}
                    {dayTasks.length > 3 && (
                      <span className="text-[10px] text-gray-400">+{dayTasks.length - 3} autre{dayTasks.length - 3 > 1 ? 's' : ''}</span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Légende */}
      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" /> À faire</div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400" /> En cours</div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400" /> Terminée</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// ──── Carte Tâche (vue détail projet) ────
// ══════════════════════════════════════════
function TaskCardDetail({ task, onMenuClick, onDelete, authFetch, projectId, currentUser }) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [commentsList, setCommentsList] = useState([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [commentError, setCommentError] = useState('');

  const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : null;
  const assignees = (task.assignees || task.taskAssignees || []).map((a) => a.user || a);

  // Charger les commentaires automatiquement au montage du composant
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

  // Ouvrir/fermer l'accordéon
  const toggleComments = () => setCommentsOpen(!commentsOpen);

  // Poster un nouveau commentaire
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
      {/* En-tête : titre + badge + menu */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className="font-bold text-gray-900">{task.title}</h4>
            <StatusBadge status={task.status} />
          </div>
          {task.description && <p className="text-sm text-gray-500 mt-1">{task.description}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {/* Bouton modifier (admin seulement) */}
          {onMenuClick && (
            <button
              type="button"
              onClick={() => onMenuClick(task)}
              className="w-10 h-10 border border-gray-200 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
              aria-label="Modifier la tâche"
            >
              <Icon.Dots />
            </button>
          )}
          {/* Bouton supprimer (admin + contributeur) */}
          {onDelete && !onMenuClick && (
            <button
              type="button"
              onClick={() => setConfirmDel(true)}
              className="w-10 h-10 border border-gray-200 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-300 transition-colors"
              aria-label="Supprimer la tâche"
            >
              <Icon.Trash />
            </button>
          )}
        </div>
      </div>

      {/* Confirmation suppression inline */}
      {confirmDel && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-2">
          <p className="text-xs text-red-800">Supprimer cette tâche ?</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => { onDelete(task.id); setConfirmDel(false); }} className="bg-red-600 text-white text-xs px-3 py-1 rounded-full hover:bg-red-700">Oui</button>
            <button type="button" onClick={() => setConfirmDel(false)} className="border border-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full hover:bg-gray-50">Non</button>
          </div>
        </div>
      )}

      {/* Échéance */}
      {dueDate && (
        <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
          <span className="text-gray-400">Échéance :</span>
          <Icon.Calendar cls="w-4 h-4 text-gray-400" />
          <span>{dueDate}</span>
        </div>
      )}

      {/* Assignés */}
      {assignees.length > 0 && (
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-sm text-gray-400">Assigné à :</span>
          {assignees.map((u, i) => (
            <div key={u.id || u.email || i} className="flex items-center gap-1">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-semibold bg-gray-200 text-gray-700">
                {getInitials(u)}
              </span>
              <span className="text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">{u.name || u.email}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Section commentaires ── */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={toggleComments}
          className="flex items-center justify-between w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Icon.Comment cls="w-4 h-4" />
            Commentaires{commentsLoaded ? ` (${commentsList.length})` : ''}
          </span>
          {commentsOpen ? <Icon.ChevronUp /> : <Icon.ChevronDown />}
        </button>

        {commentsOpen && (
          <div className="mt-3">
            {/* Chargement */}
            {!commentsLoaded && (
              <p className="text-xs text-gray-400 mb-3">Chargement des commentaires...</p>
            )}

            {/* Liste des commentaires existants */}
            {commentsLoaded && commentsList.length > 0 && (
              <div className="flex flex-col gap-2.5 mb-4">
                {commentsList.map((c, i) => (
                  <div key={c.id || i} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-semibold bg-gray-200 text-gray-700">
                        {getInitials(c.user || c.author)}
                      </span>
                      <span className="text-xs font-medium text-gray-700">{c.user?.name || c.author?.name || 'Utilisateur'}</span>
                      {c.createdAt && <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
                    </div>
                    <p className="text-sm text-gray-600">{c.content || c.text || c.body}</p>
                  </div>
                ))}
              </div>
            )}

            {commentsLoaded && commentsList.length === 0 && (
              <p className="text-xs text-gray-400 mb-3">Aucun commentaire pour le moment</p>
            )}

            {/* Champ pour ajouter un commentaire */}
            {commentError && <p className="text-red-500 text-xs mb-2">{commentError}</p>}
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-orange-400"
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

// ══════════════════════════════════════
// ──── Modal Créer / Modifier Tâche ────
// ══════════════════════════════════════
function TaskModal({ isOpen, onClose, authFetch, projectId, task = null, onSaved, onDeleted, projectMembers = [] }) {
  const isEdit = !!task;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('TODO');
  const [assignees, setAssignees] = useState([]);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
      setStatus(task.status || 'TODO');
      const raw = task.assignees || task.taskAssignees || [];
      setAssignees(raw.map((a) => a.user || a));
    } else {
      setTitle(''); setDescription(''); setDueDate(''); setStatus('TODO');
      setAssignees([]);
    }
    setError(''); setConfirmDelete(false);
  }, [task, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');
    if (!title.trim()) { setError('Le titre est requis'); return; }
    setIsSaving(true);
    try {
      const body = { title: title.trim(), description: description.trim(), status, assigneeIds: assignees.map((a) => a.id).filter(Boolean) };
      if (dueDate) body.dueDate = new Date(dueDate).toISOString();
      let res;
      if (isEdit) {
        res = await authFetch(`/projects/${projectId}/tasks/${task.id}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        res = await authFetch(`/projects/${projectId}/tasks`, { method: 'POST', body: JSON.stringify(body) });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur');
      if (onSaved) onSaved();
      onClose();
    } catch (err) { setError(err.message); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await authFetch(`/projects/${projectId}/tasks/${task.id}`, { method: 'DELETE' });
      if (!res.ok) { const data = await res.json(); throw new Error(data.message || 'Erreur'); }
      if (onDeleted) onDeleted(task.id);
      onClose();
    } catch (err) { setError(err.message); }
    finally { setIsDeleting(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-2 absolute top-4 right-4 sm:top-6 sm:right-6">
          {isEdit && (
            <button type="button" onClick={() => setConfirmDelete(true)} className="text-gray-400 hover:text-red-500 transition-colors p-1" title="Supprimer"><Icon.Trash /></button>
          )}
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Fermer"><Icon.Close /></button>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-6 sm:mb-8">{isEdit ? 'Modifier la tâche' : 'Créer une tâche'}</h2>

        {confirmDelete && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-800 font-medium mb-3">Supprimer cette tâche ?</p>
            <p className="text-xs text-red-600 mb-3">Cette action est irréversible.</p>
            <div className="flex gap-2">
              <button type="button" onClick={handleDelete} disabled={isDeleting} className="bg-red-600 text-white text-sm px-4 py-2 rounded-full hover:bg-red-700 disabled:opacity-50">{isDeleting ? 'Suppression...' : 'Confirmer'}</button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="border border-gray-200 text-gray-700 text-sm px-4 py-2 rounded-full hover:bg-gray-50">Annuler</button>
            </div>
          </div>
        )}

        {error && <p className="text-red-600 text-sm mb-4 p-3 bg-red-50 rounded-lg">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 sm:gap-6">
          <div>
            <label htmlFor="task-title" className="block text-sm font-semibold text-gray-900 mb-2">Titre<span className="text-red-500">*</span></label>
            <input id="task-title" type="text" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-orange-400" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre de la tâche" />
          </div>
          <div>
            <label htmlFor="task-desc" className="block text-sm font-semibold text-gray-900 mb-2">Description<span className="text-red-500">*</span></label>
            <textarea id="task-desc" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-orange-400 resize-none" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description de la tâche" />
          </div>
          <div>
            <label htmlFor="task-date" className="block text-sm font-semibold text-gray-900 mb-2">Échéance<span className="text-red-500">*</span></label>
            <input id="task-date" type="date" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:border-orange-400" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Assigné à :</label>
            {/* Tags des assignés */}
            {assignees.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {assignees.map((u) => (
                  <span key={u.id || u.email} className="flex items-center gap-1 bg-orange-50 text-orange-700 text-xs font-medium px-3 py-1.5 rounded-full">
                    {u.name || u.email}
                    <button type="button" onClick={() => setAssignees((prev) => prev.filter((a) => (a.id || a.email) !== (u.id || u.email)))} className="hover:text-orange-900 ml-1 text-base leading-none" aria-label={`Retirer ${u.name || u.email}`}>
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
            {/* Liste des membres du projet disponibles */}
            {(() => {
              const selectedIds = assignees.map((a) => a.id || a.email);
              const available = projectMembers.filter((m) => !selectedIds.includes(m.id) && !selectedIds.includes(m.email));
              if (available.length === 0 && assignees.length > 0) return <p className="text-xs text-gray-400">Tous les membres sont assignés</p>;
              if (projectMembers.length === 0) return <p className="text-xs text-gray-400">Aucun membre dans ce projet</p>;
              return (
                <div className="flex flex-wrap gap-2">
                  {available.map((m) => (
                    <button
                      type="button"
                      key={m.id || m.email}
                      onClick={() => setAssignees((prev) => [...prev, m])}
                      className="flex items-center gap-1.5 border border-gray-200 text-sm text-gray-700 px-3 py-1.5 rounded-full hover:border-orange-300 hover:bg-orange-50 transition-colors"
                    >
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 text-[10px] font-semibold text-gray-700">{getInitials(m)}</span>
                      {m.name || m.email}
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>
          <fieldset>
            <legend className="block text-sm font-semibold text-gray-900 mb-3">Statut :</legend>
            <div className="flex flex-wrap gap-2" role="radiogroup">
              {['TODO', 'IN_PROGRESS', 'DONE'].map((s) => {
                const c = statusConfig[s];
                const isActive = status === s;
                return (
                  <button type="button" key={s} onClick={() => setStatus(s)} role="radio" aria-checked={isActive}
                    className={`text-sm px-5 py-2 rounded-full border transition-colors ${isActive ? `${c.bg} ${c.text} ${c.border} font-medium` : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                    {c.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <button type="submit" disabled={isSaving} className={`font-medium py-3 px-8 rounded-full transition-colors disabled:opacity-50 w-fit ${isEdit ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-gray-100 text-orange-600 hover:bg-gray-200'}`}>
            {isSaving ? 'Enregistrement...' : isEdit ? 'Enregistrer' : '+ Ajouter une tâche'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// ──── Modal Modifier un projet ────
// ══════════════════════════════════════
function EditProjectModal({ isOpen, onClose, authFetch, project, onSaved }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [contributors, setContributors] = useState([]);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Pré-remplir avec les données du projet
  useEffect(() => {
    if (project && isOpen) {
      setName(project.name || '');
      setDescription(project.description || '');
      // Extraire les contributeurs actuels (hors propriétaire)
      const members = project.members || project.contributors || project.projectMembers || [];
      const memberUsers = members.map((m) => m.user || m).filter((u) => u.id !== (project.ownerId || project.owner?.id));
      setContributors(memberUsers);
      setError('');
      setSuccessMsg('');
    }
  }, [project, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');
    setSuccessMsg('');
    if (!name.trim()) { setError('Le nom du projet est requis'); return; }
    setIsSaving(true);
    try {
      // 1. Mettre à jour nom + description
      const res = await authFetch(`/projects/${project.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur lors de la mise à jour');

      // 2. Synchroniser les contributeurs
      // Récupérer les membres actuels
      const currentMembers = (project.members || project.contributors || project.projectMembers || [])
        .map((m) => m.user || m)
        .filter((u) => u.id !== (project.ownerId || project.owner?.id));
      const currentIds = currentMembers.map((m) => m.id);
      const newIds = contributors.map((c) => c.id);

      // Retirer ceux qui ne sont plus dans la liste
      for (const member of currentMembers) {
        if (!newIds.includes(member.id)) {
          try {
            await authFetch(`/projects/${project.id}/contributors/${member.id}`, { method: 'DELETE' });
          } catch (err) { console.error('Erreur retrait contributeur:', err); }
        }
      }

      // Ajouter les nouveaux
      for (const contrib of contributors) {
        if (!currentIds.includes(contrib.id)) {
          try {
            await authFetch(`/projects/${project.id}/contributors`, {
              method: 'POST',
              body: JSON.stringify({ email: contrib.email, role: 'CONTRIBUTOR' }),
            });
          } catch (err) { console.error('Erreur ajout contributeur:', err); }
        }
      }

      setSuccessMsg('Projet mis à jour');
      if (onSaved) onSaved();
      setTimeout(() => onClose(), 800);
    } catch (err) { setError(err.message); }
    finally { setIsSaving(false); }
  };

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} className="absolute top-4 right-4 sm:top-6 sm:right-6 text-gray-400 hover:text-gray-600" aria-label="Fermer">
          <Icon.Close />
        </button>

        <h2 className="text-xl font-bold text-gray-900 mb-6 sm:mb-8">Modifier le projet</h2>

        {error && <p className="text-red-600 text-sm mb-4 p-3 bg-red-50 rounded-lg">{error}</p>}
        {successMsg && <p className="text-green-700 text-sm mb-4 p-3 bg-green-50 rounded-lg">{successMsg}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 sm:gap-6">
          <div>
            <label htmlFor="edit-project-name" className="block text-sm font-medium text-gray-900 mb-2">
              Nom du projet<span className="text-red-500">*</span>
            </label>
            <input
              id="edit-project-name"
              type="text"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-orange-400"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom du projet"
            />
          </div>
          <div>
            <label htmlFor="edit-project-desc" className="block text-sm font-medium text-gray-900 mb-2">
              Description
            </label>
            <textarea
              id="edit-project-desc"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-orange-400 resize-none"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du projet"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Contributeurs
            </label>
            <UserSearchInput
              authFetch={authFetch}
              selected={contributors}
              onAdd={(user) => setContributors((prev) => [...prev, user])}
              onRemove={(user) => setContributors((prev) => prev.filter((c) => c.id !== user.id))}
              placeholder="Ajouter ou retirer des contributeurs"
            />
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="bg-gray-900 text-white font-medium py-3 px-6 rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50 w-fit"
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ══════════════════════════════════
// ──── Page Détail Projet ────
// ══════════════════════════════════
export default function ProjectDetailPage() {
  const { user, loading, authFetch } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id;

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('list');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [confirmDeleteProject, setConfirmDeleteProject] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchProject = useCallback(async () => {
    try {
      const res = await authFetch(`/projects/${projectId}`);
      const data = await res.json();
      if (res.ok && data.success !== false) {
        const proj = data.data?.project || data.data || data.project || data;
        setProject(proj);
        setTasks(proj.tasks || extractArray(data.data?.tasks || data.tasks));
      } else if (res.status === 403) {
        setError('Vous n\'avez pas accès à ce projet');
      } else {
        setError(data.message || 'Projet introuvable');
      }
    } catch (err) {
      console.error('Erreur chargement projet:', err);
      setError('Erreur lors du chargement du projet');
    } finally {
      setLoadingData(false);
    }
  }, [authFetch, projectId]);

  useEffect(() => {
    if (loading || !user || !projectId) return;
    fetchProject();
  }, [loading, user, projectId, fetchProject]);

  const handleTaskSaved = () => fetchProject();
  const handleTaskDeleted = (taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setSelectedTask(null);
  };

  // Suppression rapide de tâche (pour les contributeurs qui n'ont pas accès à la modal d'édition)
  const handleQuickDeleteTask = async (taskId) => {
    try {
      const res = await authFetch(`/projects/${projectId}/tasks/${taskId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erreur lors de la suppression');
      }
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteProject = async () => {
    setIsDeletingProject(true);
    try {
      const res = await authFetch(`/projects/${projectId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erreur lors de la suppression');
      }
      router.push('/projects');
    } catch (err) {
      setError(err.message);
      setConfirmDeleteProject(false);
    } finally {
      setIsDeletingProject(false);
    }
  };

  // Équipe
  const owner = project?.owner || project?.user || null;
  const ownerId = project?.ownerId || owner?.id || null;
  const members = project?.members || project?.contributors || project?.projectMembers || [];
  const team = [];
  if (owner) team.push({ ...owner, _isOwner: true });
  members.forEach((m) => {
    const u = m.user || m;
    if (u.id !== owner?.id) team.push(u);
  });

  // ── Rôle de l'utilisateur dans le projet ──
  // Admin = propriétaire OU membre avec rôle ADMIN
  // Contributeur = membre avec rôle CONTRIBUTOR
  const isOwner = user?.id === ownerId;
  const memberEntry = members.find((m) => {
    const u = m.user || m;
    return u.id === user?.id;
  });
  const memberRole = memberEntry?.role || null;
  const isAdmin = isOwner || memberRole === 'ADMIN';
  const isContributor = memberRole === 'CONTRIBUTOR';
  const canEdit = isAdmin; // Seuls les admins peuvent modifier/supprimer le projet
  const canCreateTask = isAdmin || isContributor; // Admin et contributeurs peuvent créer des tâches

  // Filtrage
  const filteredTasks = tasks.filter((t) => {
    const matchSearch = !search || t.title?.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return <div className="flex min-h-screen items-center justify-center"><p className="text-gray-500">Chargement...</p></div>;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">

        {error ? (
          <div className="text-center py-16">
            {error.includes('accès') ? (
              <>
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-gray-900 mb-2">Accès refusé</p>
                <p className="text-sm text-gray-500 mb-6">Vous n&apos;êtes ni administrateur ni contributeur de ce projet.</p>
              </>
            ) : (
              <p className="text-red-600 mb-4">{error}</p>
            )}
            <button type="button" onClick={() => router.push('/projects')} className="bg-gray-900 text-white text-sm px-5 py-2.5 rounded-full hover:bg-gray-800 transition-colors">Retour aux projets</button>
          </div>
        ) : loadingData ? (
          <p className="text-gray-500 text-center py-16">Chargement du projet...</p>
        ) : (
          <>
            {/* ── En-tête projet ── */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6 sm:mb-8">
              <div className="flex items-start gap-3">
                {/* Flèche retour */}
                <button type="button" onClick={() => router.push('/projects')} className="mt-1 w-10 h-10 border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-colors shrink-0" aria-label="Retour">
                  <Icon.Back />
                </button>
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{project?.name}</h1>
                    {canEdit && (
                      <button type="button" onClick={() => setShowEditModal(true)} className="text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors">Modifier</button>
                    )}
                    {canEdit && (
                      <button type="button" onClick={() => setConfirmDeleteProject(true)} className="text-sm text-red-400 hover:text-red-600 font-medium transition-colors">Supprimer</button>
                    )}
                  </div>
                  {project?.description && <p className="text-sm sm:text-base text-gray-500 mt-1">{project.description}</p>}
                </div>
              </div>
              {/* Boutons action — visibles selon le rôle */}
              <div className="flex items-center gap-2 shrink-0">
                {canCreateTask && (
                  <button type="button" onClick={() => { setSelectedTask(null); setShowTaskModal(true); }} className="bg-gray-900 text-white text-sm px-5 py-2.5 rounded-full hover:bg-gray-800 transition-colors">
                    Créer une tâche
                  </button>
                )}
                <button type="button" className="bg-orange-500 text-white text-sm px-4 py-2.5 rounded-full hover:bg-orange-600 transition-colors flex items-center gap-1.5">
                  <Icon.Sparkle cls="w-4 h-4" /> IA
                </button>
              </div>
            </div>

            {/* Confirmation suppression projet */}
            {confirmDeleteProject && (
              <div className="mb-6 p-5 bg-red-50 border border-red-200 rounded-2xl">
                <p className="text-sm text-red-800 font-semibold mb-2">Supprimer ce projet ?</p>
                <p className="text-xs text-red-600 mb-4">Toutes les tâches et données associées seront définitivement supprimées.</p>
                <div className="flex gap-2">
                  <button type="button" onClick={handleDeleteProject} disabled={isDeletingProject} className="bg-red-600 text-white text-sm px-5 py-2 rounded-full hover:bg-red-700 disabled:opacity-50">
                    {isDeletingProject ? 'Suppression...' : 'Confirmer la suppression'}
                  </button>
                  <button type="button" onClick={() => setConfirmDeleteProject(false)} className="border border-gray-200 text-gray-700 text-sm px-5 py-2 rounded-full hover:bg-gray-50">
                    Annuler
                  </button>
                </div>
              </div>
            )}

            {/* ── Barre contributeurs ── */}
            {team.length > 0 && (
              <div className="bg-gray-50 rounded-2xl px-5 py-4 mb-8 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 shrink-0">
                  <span>Contributeurs</span>
                  <span className="text-gray-500 font-normal">{team.length} personne{team.length > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {team.map((member, i) => (
                    <AvatarWithName key={member.id || member.email || i} user={member} isOwner={!!member._isOwner} />
                  ))}
                </div>
              </div>
            )}

            {/* ── Section tâches ── */}
            <div className="border border-gray-200 rounded-2xl p-4 sm:p-6">
              {/* Barre d'outils */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                  <h2 className="font-semibold text-gray-900">Tâches</h2>
                  <p className="text-sm text-gray-500">Par ordre de priorité</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Tabs */}
                  <div className="flex items-center gap-1">
                    {[
                      { key: 'list', label: 'Liste', icon: <Icon.List /> },
                      { key: 'calendar', label: 'Calendrier', icon: <Icon.CalendarView /> },
                    ].map((tab) => (
                      <button type="button" key={tab.key} onClick={() => setView(tab.key)}
                        className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full transition-colors ${view === tab.key ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}>
                        {tab.icon} {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Filtre statut */}
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="appearance-none border border-gray-200 rounded-full pl-4 pr-8 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:border-orange-400 cursor-pointer"
                    >
                      <option value="ALL">Statut</option>
                      <option value="TODO">À faire</option>
                      <option value="IN_PROGRESS">En cours</option>
                      <option value="DONE">Terminée</option>
                    </select>
                    <Icon.ChevronDown cls="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Recherche */}
                  <div className="relative">
                    <input
                      type="search"
                      aria-label="Rechercher une tâche"
                      placeholder="Rechercher une tâche"
                      className="border border-gray-300 rounded-full pl-4 pr-9 py-1.5 text-sm text-gray-900 placeholder-gray-600 bg-white focus:outline-none focus:border-orange-500 w-44"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <Icon.Search cls="w-4 h-4 text-gray-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* ── Affichage selon la vue ── */}
              {view === 'calendar' ? (
                <CalendarView
                  tasks={filteredTasks}
                  onTaskClick={canEdit ? (task) => { setSelectedTask(task); setShowTaskModal(true); } : null}
                />
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">{search || statusFilter !== 'ALL' ? 'Aucune tâche trouvée' : 'Aucune tâche dans ce projet'}</p>
                  {!search && statusFilter === 'ALL' && canCreateTask && (
                    <button type="button" onClick={() => { setSelectedTask(null); setShowTaskModal(true); }} className="bg-gray-900 text-white text-sm px-5 py-2.5 rounded-full hover:bg-gray-800 transition-colors">
                      + Créer une tâche
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {filteredTasks.map((t) => (
                    <TaskCardDetail
                      key={t.id}
                      task={t}
                      onMenuClick={canEdit ? (task) => { setSelectedTask(task); setShowTaskModal(true); } : null}
                      onDelete={canCreateTask ? handleQuickDeleteTask : null}
                      authFetch={authFetch}
                      projectId={projectId}
                      currentUser={user}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
      <Footer />

      <TaskModal
        isOpen={showTaskModal}
        onClose={() => { setShowTaskModal(false); setSelectedTask(null); }}
        authFetch={authFetch}
        projectId={projectId}
        task={selectedTask}
        onSaved={handleTaskSaved}
        onDeleted={handleTaskDeleted}
        projectMembers={team}
      />

      <EditProjectModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        authFetch={authFetch}
        project={project}
        onSaved={fetchProject}
      />
    </div>
  );
}