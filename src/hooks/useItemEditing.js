import { useState, useMemo, useCallback } from 'react';

/**
 * Shared hook for item editing, filtering, and stats calculation
 * Used by both PracticeItems and ItemsManager components
 */
export function useItemEditing({ items, sessions, onItemsChange, userTags, onAddTag }) {
  // New item form state
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState(null);
  const [newItemTags, setNewItemTags] = useState([]);
  const [showNewItemOptions, setShowNewItemOptions] = useState(false);

  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingTags, setEditingTags] = useState([]);

  // UI state
  const [expandedItem, setExpandedItem] = useState(null);
  const [filterCategory, setFilterCategory] = useState(null);
  const [filterTags, setFilterTags] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [attachmentModalItem, setAttachmentModalItem] = useState(null);

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

  const addItem = useCallback((autoAddToSession) => {
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
      return newItem;
    }
    return null;
  }, [newItemName, newItemCategory, newItemTags, items, onItemsChange]);

  const startEditing = useCallback((item) => {
    setEditingId(item.id);
    setEditingName(item.name);
    setEditingCategory(item.category || null);
    setEditingTags(item.tags || []);
    setExpandedItem(item.id);
  }, []);

  const saveEdit = useCallback(() => {
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
  }, [editingId, editingName, editingCategory, editingTags, items, onItemsChange]);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditingName('');
    setEditingCategory(null);
    setEditingTags([]);
  }, []);

  const handleAddAttachment = useCallback((attachment) => {
    if (!attachmentModalItem) return;
    onItemsChange(
      items.map((item) =>
        item.id === attachmentModalItem
          ? { ...item, attachments: [...(item.attachments || []), attachment] }
          : item
      )
    );
  }, [attachmentModalItem, items, onItemsChange]);

  const handleDeleteAttachment = useCallback((itemId, attachmentId) => {
    onItemsChange(
      items.map((item) =>
        item.id === itemId
          ? { ...item, attachments: (item.attachments || []).filter(a => a.id !== attachmentId) }
          : item
      )
    );
  }, [items, onItemsChange]);

  const toggleExpanded = useCallback((itemId) => {
    setExpandedItem(prev => prev === itemId ? null : itemId);
  }, []);

  return {
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
  };
}
