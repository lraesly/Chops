import { useState, useRef, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { TagBadge } from './TagBadge';

export function TagInput({ selectedTags = [], allTags = [], onChange, onCreateTag }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Filter available tags
  const availableTags = allTags.filter(
    (tag) => !selectedTags.includes(tag) && tag.toLowerCase().includes(inputValue.toLowerCase())
  );

  const canCreateNew = inputValue.trim() &&
    !allTags.some(t => t.toLowerCase() === inputValue.toLowerCase()) &&
    !selectedTags.some(t => t.toLowerCase() === inputValue.toLowerCase());

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddTag = (tag) => {
    onChange([...selectedTags, tag]);
    setInputValue('');
    setIsOpen(false);
  };

  const handleCreateTag = () => {
    const newTag = inputValue.trim();
    if (newTag) {
      onCreateTag(newTag);
      handleAddTag(newTag);
    }
  };

  const handleRemoveTag = (tag) => {
    onChange(selectedTags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (canCreateNew) {
        handleCreateTag();
      } else if (availableTags.length > 0) {
        handleAddTag(availableTags[0]);
      }
    }
    if (e.key === 'Backspace' && !inputValue && selectedTags.length > 0) {
      handleRemoveTag(selectedTags[selectedTags.length - 1]);
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex flex-wrap items-center gap-1 p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 min-h-[42px]">
        {selectedTags.map((tag) => (
          <TagBadge key={tag} tag={tag} onRemove={handleRemoveTag} />
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length === 0 ? "Add tags..." : ""}
          className="flex-1 min-w-[80px] outline-none bg-transparent text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm"
        />
      </div>

      {isOpen && (inputValue || availableTags.length > 0) && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {canCreateNew && (
            <button
              onClick={handleCreateTag}
              className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-primary-600 dark:text-primary-400"
            >
              <Plus size={14} />
              Create "{inputValue}"
            </button>
          )}
          {availableTags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleAddTag(tag)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
            >
              #{tag}
            </button>
          ))}
          {!canCreateNew && availableTags.length === 0 && inputValue && (
            <div className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">
              No matching tags
            </div>
          )}
        </div>
      )}
    </div>
  );
}
