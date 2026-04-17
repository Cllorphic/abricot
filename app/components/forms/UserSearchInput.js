'use client';

import { useState, useEffect, useRef, useId } from 'react';

/**
 * Composant réutilisable de recherche d'utilisateurs dans la BDD
 * Appelle GET /users/search?q=...
 */
export default function UserSearchInput({ authFetch, selected = [], onAdd, onRemove, placeholder = 'Rechercher un utilisateur...', label = 'Rechercher un utilisateur' }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const timeout = useRef(null);
  const containerRef = useRef(null);
  const inputId = useId();

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recherche avec debounce
  useEffect(() => {
    if (search.trim().length < 1) {
      setResults([]);
      setShowDropdown(false);
      setSearchError('');
      return;
    }

    if (timeout.current) clearTimeout(timeout.current);

    timeout.current = setTimeout(async () => {
      setLoading(true);
      setSearchError('');
      try {
        const res = await authFetch(`/users/search?query=${encodeURIComponent(search.trim())}`);
        const data = await res.json();

        let users = [];

        if (res.ok) {
          if (Array.isArray(data)) {
            users = data;
          } else if (data.success !== undefined) {
            if (Array.isArray(data.data)) {
              users = data.data;
            } else if (data.data && typeof data.data === 'object') {
              for (const key of Object.keys(data.data)) {
                if (Array.isArray(data.data[key])) {
                  users = data.data[key];
                  break;
                }
              }
            }
          } else if (Array.isArray(data.users)) {
            users = data.users;
          }
        } else {
          setSearchError('Erreur de recherche');
        }

        const selectedIds = selected.map((s) => s.id || s.email);
        const filtered = users.filter(
          (u) => !selectedIds.includes(u.id) && !selectedIds.includes(u.email)
        );

        setResults(filtered);
        setShowDropdown(true);
      } catch (err) {
        console.error('Erreur recherche utilisateurs:', err);
        setSearchError('Erreur réseau');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout.current);
  }, [search, selected, authFetch]);

  return (
    <div ref={containerRef} className="relative">
      {/* Tags des utilisateurs sélectionnés */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selected.map((u) => (
            <span
              key={u.id || u.email}
              className="flex items-center gap-1 bg-orange-50 text-orange-800 text-xs font-medium px-3 py-1.5 rounded-full"
            >
              {u.name || u.email}
              <button
                type="button"
                onClick={() => onRemove(u)}
                className="hover:text-orange-900 ml-1 text-base leading-none"
                aria-label={`Retirer ${u.name || u.email}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Champ de recherche */}
      <div className="relative">
        <input
          id={inputId}
          type="text"
          aria-label={label}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-10 text-sm text-gray-900 placeholder-gray-600 bg-white focus:outline-none focus:border-orange-500"
          placeholder={placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
        />
        <svg
          aria-hidden="true"
          focusable="false"
          className="w-5 h-5 text-gray-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Dropdown résultats */}
      {showDropdown && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {loading ? (
            <p className="px-4 py-3 text-sm text-gray-700">Recherche...</p>
          ) : searchError ? (
            <p className="px-4 py-3 text-sm text-red-800">{searchError}</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-700">Aucun résultat pour &quot;{search}&quot;</p>
          ) : (
            results.map((u) => (
              <button
                key={u.id || u.email}
                type="button"
                onClick={() => {
                  onAdd(u);
                  setSearch('');
                  setShowDropdown(false);
                }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 flex items-center justify-between gap-2"
              >
                <span className="font-medium text-gray-900 truncate">{u.name || u.email}</span>
                <span className="text-xs text-gray-700 shrink-0">{u.email}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}