import { useState, useMemo } from 'react';
import {
  LayoutTemplate,
  Plus,
  Play,
  Pencil,
  Trash2,
  X,
  ChevronUp,
  ChevronDown,
  Search,
  Music,
} from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import { CategoryBadge } from './CategoryBadge';

/**
 * Templates tab: reusable sets of practice items that can be loaded
 * into the Practice view as a fresh session (all item times start at 0).
 */
export function Templates({
  templates,
  practiceItems,
  archivedItems = [],
  sessionItems = [],
  sessionTotalTime = 0,
  onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onLoadTemplate,
}) {
  const [editorState, setEditorState] = useState(null); // null | { mode: 'create' } | { mode: 'edit', template }
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [loadConfirm, setLoadConfirm] = useState(null);

  const hasActiveSession = sessionItems.length > 0 || sessionTotalTime > 0;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Look up the current name for an item (in case it was renamed since the template was saved)
  const resolveItemName = (templateItem) => {
    const source = practiceItems.find((p) => p.id === templateItem.id)
      || archivedItems.find((a) => a.id === templateItem.id);
    return source?.name || templateItem.name;
  };

  const handleLoadClick = (template) => {
    if (hasActiveSession) {
      setLoadConfirm(template);
    } else {
      onLoadTemplate(template);
    }
  };

  const handleEditorSave = ({ name, items }) => {
    if (editorState?.mode === 'edit') {
      onUpdateTemplate(editorState.template.id, { name, items });
    } else {
      onCreateTemplate({ name, items });
    }
    setEditorState(null);
  };

  const sortedTemplates = [...templates].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/40 rounded-lg">
            <LayoutTemplate className="text-primary-600 dark:text-primary-400" size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Templates</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {templates.length} template{templates.length !== 1 ? 's' : ''} · load one to start a session
            </p>
          </div>
          <button
            onClick={() => setEditorState({ mode: 'create' })}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shrink-0"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">New Template</span>
          </button>
        </div>

        {/* Template list */}
        {sortedTemplates.length === 0 ? (
          <div className="text-center py-12">
            <LayoutTemplate className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
            <p className="text-gray-400 dark:text-gray-500">No templates yet</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              Create one here, or use "Save Template" on the Practice tab to save your current queue
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-800 dark:text-gray-200 truncate">
                      {template.name}
                    </h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {template.items.length} item{template.items.length !== 1 ? 's' : ''}
                      {template.createdAt && <> · Created {formatDate(template.createdAt)}</>}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => handleLoadClick(template)}
                      disabled={template.items.length === 0}
                      className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                      title="Load this template as the current practice session"
                    >
                      <Play size={16} />
                      Load
                    </button>
                    <button
                      onClick={() => setEditorState({ mode: 'edit', template })}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                      title="Edit template"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(template)}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Delete template"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Items in this template */}
                {template.items.length > 0 && (
                  <ol className="mt-3 space-y-1">
                    {template.items.map((item, index) => (
                      <li
                        key={`${item.id}-${index}`}
                        className="flex items-center gap-2 py-1.5 px-3 bg-white dark:bg-gray-800 rounded-lg text-sm"
                      >
                        <span className="w-5 text-right text-xs text-gray-400 dark:text-gray-500 shrink-0">
                          {index + 1}.
                        </span>
                        <span className="text-gray-700 dark:text-gray-200 truncate">
                          {resolveItemName(item)}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit editor */}
      {editorState && (
        <TemplateEditor
          mode={editorState.mode}
          template={editorState.template}
          practiceItems={practiceItems}
          archivedItems={archivedItems}
          onSave={handleEditorSave}
          onClose={() => setEditorState(null)}
        />
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => onDeleteTemplate(deleteConfirm.id)}
        title="Delete Template"
        message={`Delete the template "${deleteConfirm?.name}"? This does not affect your practice items or history.`}
        confirmText="Delete"
      />

      {/* Replace current session confirmation */}
      <ConfirmDialog
        isOpen={!!loadConfirm}
        onClose={() => setLoadConfirm(null)}
        onConfirm={() => onLoadTemplate(loadConfirm)}
        title="Replace Current Session?"
        message={`Loading "${loadConfirm?.name}" will clear the current session queue, timer, and any unsaved recordings. Save the current session first if you want to keep it.`}
        confirmText="Load Template"
        variant="warning"
      />
    </div>
  );
}

/**
 * Modal for creating or editing a template: name + ordered list of items.
 */
function TemplateEditor({ mode, template, practiceItems, archivedItems, onSave, onClose }) {
  const [name, setName] = useState(template?.name || '');
  const [items, setItems] = useState(() =>
    (template?.items || []).map((item) => ({ id: item.id, name: item.name }))
  );
  const [search, setSearch] = useState('');

  const availableItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = [...practiceItems].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
    if (!query) return list;
    return list.filter((item) =>
      item.name.toLowerCase().includes(query)
      || (item.tags || []).some((tag) => tag.toLowerCase().includes(query))
    );
  }, [practiceItems, search]);

  const resolveItemName = (item) => {
    const source = practiceItems.find((p) => p.id === item.id)
      || archivedItems.find((a) => a.id === item.id);
    return source?.name || item.name;
  };

  const countInTemplate = (itemId) => items.filter((i) => i.id === itemId).length;

  const addItem = (item) => {
    setItems((prev) => [...prev, { id: item.id, name: item.name }]);
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const moveItem = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;
    setItems((prev) => {
      const next = [...prev];
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      return next;
    });
  };

  const canSave = name.trim().length > 0 && items.length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSave) return;
    onSave({
      name: name.trim(),
      // Store the current item name so the template still reads well if the item is later deleted
      items: items.map((item) => ({ id: item.id, name: resolveItemName(item) })),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <form
        onSubmit={handleSubmit}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
          }
        }}
        className="relative w-full max-w-2xl max-h-[90vh] mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            {mode === 'edit' ? 'Edit Template' : 'New Template'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">
              Template name
            </label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Warm-up, Sunday Set, Scales Day"
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Items in template */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Items in template ({items.length})
              </label>
              <span className="text-xs text-gray-400 dark:text-gray-500">Loads with 0:00 on every item</span>
            </div>
            {items.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                Add items from the list below
              </p>
            ) : (
              <div className="space-y-1.5">
                {items.map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    className="flex items-center gap-2 p-2 bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-xl"
                  >
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => moveItem(index, -1)}
                        disabled={index === 0}
                        className="p-0.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem(index, 1)}
                        disabled={index === items.length - 1}
                        className="p-0.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                    <span className="w-5 text-right text-xs text-gray-400 dark:text-gray-500 shrink-0">
                      {index + 1}.
                    </span>
                    <span className="flex-1 text-sm text-gray-800 dark:text-gray-200 truncate">
                      {resolveItemName(item)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Remove from template"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available items */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">
              Add practice items
            </label>
            <div className="relative mb-2">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search items..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            {practiceItems.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                No practice items yet. Add some on the Items tab first.
              </p>
            ) : availableItems.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                No items match "{search}"
              </p>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {availableItems.map((item) => {
                  const count = countInTemplate(item.id);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-xl"
                    >
                      <Music size={16} className="text-gray-400 dark:text-gray-500 shrink-0" />
                      <span className="flex-1 text-sm text-gray-800 dark:text-gray-200 truncate">
                        {item.name}
                      </span>
                      {item.category && <CategoryBadge categoryId={item.category} />}
                      {count > 0 && (
                        <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                          Added{count > 1 ? ` ×${count}` : ''}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => addItem(item)}
                        className="p-1.5 bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/60 transition-colors"
                        title="Add to template"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSave}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {mode === 'edit' ? 'Save Changes' : 'Create Template'}
          </button>
        </div>
      </form>
    </div>
  );
}
