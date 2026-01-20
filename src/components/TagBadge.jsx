import { X } from 'lucide-react';

export function TagBadge({ tag, onRemove, size = 'sm' }) {
  const sizeClasses = size === 'sm'
    ? 'text-xs px-2 py-0.5'
    : 'text-sm px-2.5 py-1';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 ${sizeClasses}`}>
      #{tag}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(tag);
          }}
          className="hover:text-primary-900 dark:hover:text-primary-100 transition-colors"
        >
          <X size={12} />
        </button>
      )}
    </span>
  );
}
