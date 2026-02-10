import { useState } from 'react';
import { ListTodo, Plus, ArrowRightToLine, Archive, Trash2, RotateCcw } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';

export function TodoList({
  todoItems,
  archivedTodoItems,
  onAddTodo,
  onArchiveTodo,
  onRestoreTodo,
  onDeleteTodo,
  onMoveTodoToItems,
}) {
  const [activeTab, setActiveTab] = useState('active');
  const [newTodoName, setNewTodoName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const handleAdd = (e) => {
    e.preventDefault();
    const name = newTodoName.trim();
    if (!name) return;
    onAddTodo(name);
    setNewTodoName('');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/40 rounded-lg">
            <ListTodo className="text-primary-600 dark:text-primary-400" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">To Do</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {todoItems.length} active, {archivedTodoItems.length} archived
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              activeTab === 'active'
                ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Active ({todoItems.length})
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              activeTab === 'archived'
                ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Archived ({archivedTodoItems.length})
          </button>
        </div>

        {/* Active Tab */}
        {activeTab === 'active' && (
          <>
            {/* Add form */}
            <form onSubmit={handleAdd} className="flex gap-2 mb-6">
              <input
                type="text"
                value={newTodoName}
                onChange={(e) => setNewTodoName(e.target.value)}
                placeholder="Something to practice later..."
                className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!newTodoName.trim()}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={18} />
                Add
              </button>
            </form>

            {/* Items list */}
            <div className="space-y-2">
              {todoItems.length === 0 ? (
                <div className="text-center py-12">
                  <ListTodo className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
                  <p className="text-gray-400 dark:text-gray-500">No to-do items yet</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm">
                    Jot down songs, techniques, or ideas to practice later
                  </p>
                </div>
              ) : (
                todoItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-800 dark:text-gray-200 truncate">
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        Added {formatDate(item.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => onMoveTodoToItems(item)}
                        className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                        title="Move to practice items"
                      >
                        <ArrowRightToLine size={18} />
                      </button>
                      <button
                        onClick={() => onArchiveTodo(item)}
                        className="p-2 text-gray-400 dark:text-gray-500 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-colors"
                        title="Archive"
                      >
                        <Archive size={18} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(item)}
                        className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Archived Tab */}
        {activeTab === 'archived' && (
          <>
            {archivedTodoItems.length === 0 ? (
              <div className="text-center py-12">
                <Archive className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
                <p className="text-gray-400 dark:text-gray-500">No archived to-do items</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm">
                  Archived items will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {archivedTodoItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-700 dark:text-gray-200 truncate">
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        Archived {formatDate(item.archivedAt)}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => onRestoreTodo(item)}
                        className="flex items-center gap-1 px-3 py-2 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors text-sm"
                      >
                        <RotateCcw size={16} />
                        Restore
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(item)}
                        className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Delete permanently"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => onDeleteTodo(deleteConfirm.id)}
        title="Delete To-Do Item"
        message={`Permanently delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  );
}
