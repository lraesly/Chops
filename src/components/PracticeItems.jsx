import { useState, useMemo } from 'react';
import { Plus, Archive, Edit2, Check, X, GripVertical, Clock, Hash, ChevronDown, ChevronUp, Paperclip, CheckCircle } from 'lucide-react';
import { formatTime } from '../hooks/useTimer';
import { CategoryBadge } from './CategoryBadge';
import { TagBadge } from './TagBadge';
import { CategorySelect } from './CategorySelect';
import { TagInput } from './TagInput';
import { ItemFilters } from './ItemFilters';
import { AttachmentList } from './AttachmentList';
import { AttachmentModal } from './AttachmentModal';

export function PracticeItems({
  items,
  sessions,
  sessionItems = [],
  onItemsChange,
  onAddToSession,
  onArchiveItem,
  userTags = [],
  onAddTag,
  isModal = false,
}) {
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState(null);
  const [newItemTags, setNewItemTags] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingTags, setEditingTags] = useState([]);
  const [expandedItem, setExpandedItem] = useState(null);
  const [filterCategory, setFilterCategory] = useState(null);
  const [filterTags, setFilterTags] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showNewItemOptions, setShowNewItemOptions] = useState(false);
  const [attachmentModalItem, setAttachmentModalItem] = useState(null);
  const [recentlyAdded, setRecentlyAdded] = useState(new Set());

  // Check if item is in current session
  const isItemInSession = (itemId) => {
    return sessionItems.some(si => si.id === itemId);
  };

  // Handle adding to session with visual feedback
  const handleAddToSession = (item) => {
    onAddToSession(item);
    setRecentlyAdded(prev => new Set(prev).add(item.id));
  };

  // Calculate stats for each item from session history
  const itemStats = useMemo(() => {
    const stats = {};
    sessions.forEach((session) => {
      session.items.forEach((sessionItem) => {
        if (!stats[sessionItem.id]) {
          stats[sessionItem.id] = { totalTime: 0, useCount: 0 };
        }
        stats[sessionItem.id].totalTime += sessionItem.time || 0;
        stats[sessionItem.id].useCount += 1;
      });
    });
    return stats;
  }, [sessions]);

  // Filter items based on category and tags
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchCategory = !filterCategory || item.category === filterCategory;
      const matchTags = filterTags.length === 0 || filterTags.every(tag => item.tags?.includes(tag));
      return matchCategory && matchTags;
    });
  }, [items, filterCategory, filterTags]);

  const addItem = () => {
    if (newItemName.trim()) {
      const newItem = {
        id: Date.now().toString(),
        name: newItemName.trim(),
        createdAt: new Date().toISOString(),
        category: newItemCategory,
        tags: newItemTags,
        attachments: [],
      };
      onItemsChange([...items, newItem]);
      setNewItemName('');
      setNewItemCategory(null);
      setNewItemTags([]);
      setShowNewItemOptions(false);
    }
  };

  const startEditing = (item) => {
    setEditingId(item.id);
    setEditingName(item.name);
    setEditingCategory(item.category || null);
    setEditingTags(item.tags || []);
    setExpandedItem(item.id);
  };

  const saveEdit = () => {
    if (editingName.trim()) {
      onItemsChange(
        items.map((item) =>
          item.id === editingId
            ? { ...item, name: editingName.trim(), category: editingCategory, tags: editingTags }
            : item
        )
      );
    }
    setEditingId(null);
    setEditingName('');
    setEditingCategory(null);
    setEditingTags([]);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setEditingCategory(null);
    setEditingTags([]);
  };

  const handleAddAttachment = (attachment) => {
    if (!attachmentModalItem) return;
    onItemsChange(
      items.map((item) =>
        item.id === attachmentModalItem
          ? { ...item, attachments: [...(item.attachments || []), attachment] }
          : item
      )
    );
  };

  const handleDeleteAttachment = (itemId, attachmentId) => {
    onItemsChange(
      items.map((item) =>
        item.id === itemId
          ? { ...item, attachments: (item.attachments || []).filter(a => a.id !== attachmentId) }
          : item
      )
    );
  };

  const renderItemStats = (itemId) => {
    const stats = itemStats[itemId];
    if (!stats || stats.useCount === 0) return null;

    return (
      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <Hash size={12} />
          {stats.useCount}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={12} />
          {formatTime(stats.totalTime)}
        </span>
      </div>
    );
  };

  const content = (
    <>
      {/* Add new item form */}
      <div className="space-y-2 mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !showNewItemOptions && addItem()}
            placeholder="Add new practice item..."
            className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            onClick={() => setShowNewItemOptions(!showNewItemOptions)}
            className={`px-3 py-2 rounded-xl transition-colors ${
              showNewItemOptions
                ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            title="Add category/tags"
          >
            {showNewItemOptions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          <button
            onClick={addItem}
            disabled={!newItemName.trim()}
            className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>

        {showNewItemOptions && (
          <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <CategorySelect
              value={newItemCategory}
              onChange={setNewItemCategory}
              className="w-auto"
            />
            <div className="flex-1 min-w-[200px]">
              <TagInput
                selectedTags={newItemTags}
                allTags={userTags}
                onChange={setNewItemTags}
                onCreateTag={onAddTag}
              />
            </div>
          </div>
        )}
      </div>

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
            <div
              key={item.id}
              className="bg-gray-50 dark:bg-gray-700 rounded-xl group hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-center gap-2 p-3">
                <GripVertical size={16} className="text-gray-300 dark:text-gray-500" />

                {editingId === item.id ? (
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        className="flex-1 px-2 py-1 border border-primary-300 dark:border-primary-500 rounded-lg bg-white dark:bg-gray-600 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        autoFocus
                      />
                      <button
                        onClick={saveEdit}
                        className="p-1 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <CategorySelect
                        value={editingCategory}
                        onChange={setEditingCategory}
                        className="w-auto"
                      />
                      <div className="flex-1 min-w-[200px]">
                        <TagInput
                          selectedTags={editingTags}
                          allTags={userTags}
                          onChange={setEditingTags}
                          onCreateTag={onAddTag}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-gray-700 dark:text-gray-200">{item.name}</span>
                        {item.category && <CategoryBadge categoryId={item.category} />}
                        {item.tags?.map(tag => (
                          <TagBadge key={tag} tag={tag} />
                        ))}
                        {item.attachments?.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <Paperclip size={12} />
                            {item.attachments.length}
                          </span>
                        )}
                      </div>
                      {renderItemStats(item.id)}
                    </div>
                    {isItemInSession(item.id) || recentlyAdded.has(item.id) ? (
                      <span className="px-3 py-1 text-sm bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-lg flex items-center gap-1">
                        <CheckCircle size={14} />
                        Added
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAddToSession(item)}
                        className="px-3 py-1 text-sm bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/60 transition-colors"
                      >
                        Add to Session
                      </button>
                    )}
                    <button
                      onClick={() => setAttachmentModalItem(item.id)}
                      className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                      title="Add attachment"
                    >
                      <Paperclip size={16} />
                    </button>
                    <button
                      onClick={() => startEditing(item)}
                      className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                      title="Edit item"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => onArchiveItem(item)}
                      className="p-1 text-gray-400 dark:text-gray-500 hover:text-orange-600 dark:hover:text-orange-400"
                      title="Archive item"
                    >
                      <Archive size={16} />
                    </button>
                  </>
                )}
              </div>

              {/* Expanded section for attachments */}
              {expandedItem === item.id && !editingId && item.attachments?.length > 0 && (
                <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-600 pt-2">
                  <AttachmentList
                    attachments={item.attachments}
                    onDelete={(attachmentId) => handleDeleteAttachment(item.id, attachmentId)}
                  />
                </div>
              )}
            </div>
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
