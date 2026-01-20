export const CATEGORIES = [
  { id: 'scales', label: 'Scales', color: 'blue' },
  { id: 'technique', label: 'Technique', color: 'green' },
  { id: 'repertoire', label: 'Repertoire', color: 'purple' },
  { id: 'sight-reading', label: 'Sight Reading', color: 'orange' },
  { id: 'theory', label: 'Theory', color: 'pink' },
  { id: 'ear-training', label: 'Ear Training', color: 'cyan' },
];

export const CATEGORY_COLORS = {
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-700',
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-900/40',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-700',
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/40',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-700',
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-900/40',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-700',
  },
  pink: {
    bg: 'bg-pink-100 dark:bg-pink-900/40',
    text: 'text-pink-700 dark:text-pink-300',
    border: 'border-pink-200 dark:border-pink-700',
  },
  cyan: {
    bg: 'bg-cyan-100 dark:bg-cyan-900/40',
    text: 'text-cyan-700 dark:text-cyan-300',
    border: 'border-cyan-200 dark:border-cyan-700',
  },
  gray: {
    bg: 'bg-gray-100 dark:bg-gray-700',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-200 dark:border-gray-600',
  },
};

export function getCategoryById(id) {
  return CATEGORIES.find(c => c.id === id);
}

export function getCategoryColor(categoryId) {
  const category = getCategoryById(categoryId);
  return category ? CATEGORY_COLORS[category.color] : CATEGORY_COLORS.gray;
}
