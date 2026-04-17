'use client';

import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '../ui/Icon';

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

// Couleur du point de tâche selon son statut
function dotColor(status) {
  if (status === 'DONE') return 'bg-green-500';
  if (status === 'IN_PROGRESS') return 'bg-yellow-500';
  return 'bg-red-500';
}

// Vue calendrier mensuelle qui affiche les tâches sur leur date d'échéance.
//
// Props :
//   - tasks : liste des tâches (avec dueDate)
//   - onTaskClick : callback appelé au clic sur une tâche (optionnel, désactive le clic si null)
export default function CalendarView({ tasks, onTaskClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation mois
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  // Construction de la grille du mois (semaine commence lundi)
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const daysInMonth = lastDay.getDate();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  // Grouper les tâches par date d'échéance (format YYYY-MM-DD)
  const tasksByDate = {};
  tasks.forEach((t) => {
    if (!t.dueDate) return;
    const d = t.dueDate.split('T')[0];
    if (!tasksByDate[d]) tasksByDate[d] = [];
    tasksByDate[d].push(t);
  });

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <div>
      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevMonth}
            aria-label="Mois précédent"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-700"
          >
            <ChevronLeftIcon />
          </button>
          <h3 className="text-sm font-semibold text-gray-900 min-w-[160px] text-center">
            {MONTHS_FR[month]} {year}
          </h3>
          <button
            type="button"
            onClick={nextMonth}
            aria-label="Mois suivant"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-700"
          >
            <ChevronRightIcon />
          </button>
        </div>
        <button
          type="button"
          onClick={goToday}
          className="text-xs text-orange-700 hover:text-orange-800 font-medium px-3 py-1 rounded-full border border-orange-300 hover:bg-orange-50 transition-colors"
        >
          Aujourd&apos;hui
        </button>
      </div>

      {/* Jours de la semaine */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_FR.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-700 py-2">{d}</div>
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
                  <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday ? 'bg-orange-500 text-white' : 'text-gray-700'
                  }`}>
                    {dayNum}
                  </div>

                  <div className="flex flex-col gap-0.5">
                    {dayTasks.slice(0, 3).map((t) => (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => onTaskClick && onTaskClick(t)}
                        className="flex items-center gap-1 text-left w-full group"
                        title={t.title}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor(t.status)}`} aria-hidden="true" />
                        <span className="text-[10px] sm:text-xs text-gray-700 truncate group-hover:text-orange-700 transition-colors">
                          {t.title}
                        </span>
                      </button>
                    ))}
                    {dayTasks.length > 3 && (
                      <span className="text-[10px] text-gray-700">+{dayTasks.length - 3} autre{dayTasks.length - 3 > 1 ? 's' : ''}</span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Légende */}
      <div className="flex items-center gap-4 mt-3 text-xs text-gray-700">
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" aria-hidden="true" /> À faire</div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500" aria-hidden="true" /> En cours</div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" aria-hidden="true" /> Terminée</div>
      </div>
    </div>
  );
}