import { CATEGORIES } from '../constants/categories';

export function CategorySelect({ value, onChange, includeAll = false, className = '' }) {
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value || null)}
      className={`px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm ${className}`}
    >
      {includeAll ? (
        <option value="">All Categories</option>
      ) : (
        <option value="">No Category</option>
      )}
      {CATEGORIES.map((cat) => (
        <option key={cat.id} value={cat.id}>
          {cat.label}
        </option>
      ))}
    </select>
  );
}
