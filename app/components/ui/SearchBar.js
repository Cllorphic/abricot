import { SearchIcon } from './Icon';

// Barre de recherche générique avec icône loupe.
// Props :
//   - value : valeur contrôlée
//   - onChange : (value: string) => void
//   - id : id unique de l'input (important si plusieurs SearchBar sur la même page)
//   - placeholder : texte du placeholder
//   - label : texte utilisé pour aria-label (invisible mais lu par les lecteurs d'écran)
export default function SearchBar({
  value,
  onChange,
  id = 'search',
  placeholder = 'Rechercher',
  label = 'Rechercher',
}) {
  return (
    <div className="relative w-full sm:w-64">
      <input
        id={id}
        type="search"
        aria-label={label}
        placeholder={placeholder}
        className="border border-gray-300 rounded-full pl-4 pr-10 py-2 text-sm text-gray-900 placeholder-gray-600 bg-white focus:outline-none focus:border-orange-500 w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <SearchIcon cls="w-4 h-4 text-gray-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}