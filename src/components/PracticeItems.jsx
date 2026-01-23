import { useState } from 'react';
import { useItemEditing } from '../hooks/useItemEditing';
import { ItemFilters } from './ItemFilters';
import { ItemRow } from './ItemRow';
import { AddItemForm } from './AddItemForm';
import { AttachmentModal } from './AttachmentModal';

export function PracticeItems({
  items,
  sessions,
  sessionItems = [],
  onItemsChange,
  onAddToSession,
  onRemoveFromSession,
  onArchiveItem,
  userTags = [],
  onAddTag,
  isModal = false,
}) {
  const [recentlyAdded, setRecentlyAdded] = useState(new Set());

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

  // Check if item is in current session
  const isItemInSession = (itemId) => {
    return sessionItems.some(si => si.id === itemId);
  };

  // Handle adding to session with visual feedback
  const handleAddToSession = (item) => {
    onAddToSession(item);
    setRecentlyAdded(prev => new Set(prev).add(item.id));
  };

  // Handle adding a new item (and optionally add to session in modal mode)
  const handleAddItem = () => {
    const newItem = addItem();
    if (newItem && isModal && onAddToSession) {
      handleAddToSession(newItem);
    }
  };

  const handleRemoveFromSession = (itemId) => {
    if (onRemoveFromSession) {
      onRemoveFromSession(itemId);
      setRecentlyAdded(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const clearRecentlyAdded = (itemId) => {
    if (recentlyAdded.has(itemId)) {
      setRecentlyAdded(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const content = (
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
        onAddItem={handleAddItem}
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
      <div className="space-y-2 max-h-96 overflow-y-auto">
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
              // Session controls
              showSessionControls={true}
              showDragHandle={true}
              isInSession={isItemInSession(item.id)}
              isRecentlyAdded={recentlyAdded.has(item.id)}
              onAddToSession={() => handleAddToSession(item)}
              onRemoveFromSession={() => handleRemoveFromSession(item.id)}
              onClearRecentlyAdded={() => clearRecentlyAdded(item.id)}
            />
          ))
        )}
      </div>

      {/* Attachment Modal */}
      <AttachmentModal
        isOpen={!!attachmentModalItem}
        onClose={() => setAttachmentModalItem(null)}
        onSave={handleAddAttachment}
      />
    </>
  );

  if (isModal) {
    return content;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 md:p-6">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Practice Items</h2>
      {content}
    </div>
  );
}
