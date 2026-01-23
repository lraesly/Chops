import { useState } from 'react';
import { Archive as ArchiveIcon, RotateCcw, Trash2, Library, Clock, Hash } from 'lucide-react';
import { useItemEditing } from '../hooks/useItemEditing';
import { formatTime } from '../hooks/useTimer';
import { ItemFilters } from './ItemFilters';
import { ItemRow } from './ItemRow';
import { AddItemForm } from './AddItemForm';
import { AttachmentModal } from './AttachmentModal';
import { ConfirmDialog } from './ConfirmDialog';
import { CategoryBadge } from './CategoryBadge';
import { TagBadge } from './TagBadge';

export function ItemsManager({
  items,
  archivedItems,
  sessions,
  onItemsChange,
  onArchiveItem,
  onRestoreItem,
  onDeleteArchivedItem,
  userTags = [],
  onAddTag,
}) {
  const [activeTab, setActiveTab] = useState('active');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const {
    // New item form
    newItemName,
    setNewItemName,
    newItemCategory,
    setNewItemCategory,
    newItemTags,
    setNewItemTags,
    showNewItemOptions,
    setShowNewItemOptions,
    addItem,

    // Editing
    editingId,
    editingName,
    setEditingName,
    editingCategory,
    setEditingCategory,
    editingTags,
    setEditingTags,
    startEditing,
    saveEdit,
    cancelEdit,

    // UI state
    expandedItem,
    toggleExpanded,
    filterCategory,
    setFilterCategory,
    filterTags,
    setFilterTags,
    showFilters,
    setShowFilters,
    attachmentModalItem,
    setAttachmentModalItem,

    // Data
    itemStats,
    filteredItems,

    // Attachment handlers
    handleAddAttachment,
    handleDeleteAttachment,
  } = useItemEditing({ items, sessions, onItemsChange, userTags, onAddTag });

  const formatArchivedDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderArchivedItemStats = (itemId) => {
    const stats = itemStats[itemId];
    if (!stats || stats.useCount === 0) return null;

    return (
      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <Hash size={12} />
          {stats.useCount} session{stats.useCount !== 1 ? 's' : ''}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={12} />
          {formatTime(stats.totalTime)}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/40 rounded-lg">
            <Library className="text-primary-600 dark:text-primary-400" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Practice Items</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {items.length} active, {archivedItems.length} archived
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
            Active ({items.length})
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              activeTab === 'archived'
                ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Archived ({archivedItems.length})
          </button>
        </div>

        {/* Active Items Tab */}
        {activeTab === 'active' && (
          <>
            <AddItemForm
              newItemName={newItemName}
              setNewItemName={setNewItemName}
              newItemCategory={newItemCategory}
              setNewItemCategory={setNewItemCategory}
              newItemTags={newItemTags}
              setNewItemTags={setNewItemTags}
              showNewItemOptions={showNewItemOptions}
              setShowNewItemOptions={setShowNewItemOptions}
              onAddItem={addItem}
              userTags={userTags}
              onAddTag={onAddTag}
            />

            {/* Filters */}
            {items.length > 0 && (
              <div className="mb-4">
                <ItemFilters
                  filterCategory={filterCategory}
                  setFilterCategory={setFilterCategory}
                  filterTags={filterTags}
                  setFilterTags={setFilterTags}
                  allTags={userTags}
                  showFilters={showFilters}
                  setShowFilters={setShowFilters}
                />
              </div>
            )}

            {/* Items list */}
            <div className="space-y-2">
              {items.length === 0 ? (
                <p className="text-gray-400 dark:text-gray-500 text-center py-8">
                  No practice items yet. Add one above!
                </p>
              ) : filteredItems.length === 0 ? (
                <p className="text-gray-400 dark:text-gray-500 text-center py-8">
                  No items match your filters
                </p>
              ) : (
                filteredItems.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    itemStats={itemStats}
                    isEditing={editingId === item.id}
                    editingName={editingName}
                    setEditingName={setEditingName}
                    editingCategory={editingCategory}
                    setEditingCategory={setEditingCategory}
                    editingTags={editingTags}
                    setEditingTags={setEditingTags}
                    onSaveEdit={saveEdit}
                    onCancelEdit={cancelEdit}
                    onStartEditing={() => startEditing(item)}
                    isExpanded={expandedItem === item.id}
                    onToggleExpanded={() => toggleExpanded(item.id)}
                    onArchive={() => onArchiveItem(item)}
                    onAttachment={() => setAttachmentModalItem(item.id)}
                    onDeleteAttachment={handleDeleteAttachment}
                    userTags={userTags}
                    onAddTag={onAddTag}
                    showSessionControls={false}
                    showDragHandle={false}
                  />
                ))
              )}
            </div>
          </>
        )}

        {/* Archived Items Tab */}
        {activeTab === 'archived' && (
          <>
            {archivedItems.length === 0 ? (
              <div className="text-center py-12">
                <ArchiveIcon className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
                <p className="text-gray-400 dark:text-gray-500">No archived items</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm">
                  Archive practice items you no longer use regularly
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {archivedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-700 dark:text-gray-200">{item.name}</h3>
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        {item.category && <CategoryBadge categoryId={item.category} />}
                        {item.tags?.map(tag => (
                          <TagBadge key={tag} tag={tag} />
                        ))}
                      </div>
                      {renderArchivedItemStats(item.id)}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        Archived {formatArchivedDate(item.archivedAt)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onRestoreItem(item)}
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

      {/* Attachment Modal */}
      <AttachmentModal
        isOpen={!!attachmentModalItem}
        onClose={() => setAttachmentModalItem(null)}
        onSave={handleAddAttachment}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => onDeleteArchivedItem(deleteConfirm.id)}
        title="Delete Permanently"
        message={`Permanently delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  );
}
