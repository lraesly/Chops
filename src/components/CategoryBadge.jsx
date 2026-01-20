import { getCategoryById, getCategoryColor } from '../constants/categories';

export function CategoryBadge({ categoryId, size = 'sm' }) {
  if (!categoryId) return null;

  const category = getCategoryById(categoryId);
  const colors = getCategoryColor(categoryId);

  const sizeClasses = size === 'sm'
    ? 'text-xs px-2 py-0.5'
    : 'text-sm px-2.5 py-1';

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${colors.bg} ${colors.text} ${sizeClasses}`}>
      {category?.label || categoryId}
    </span>
  );
}
