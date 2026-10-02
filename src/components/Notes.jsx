import { useState } from 'react';
import { NotebookPen, Plus, Archive, Trash2, RotateCcw, Check, Pencil } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import { RichTextEditor } from './RichTextEditor';
import { isHtmlNotes, sanitizeNotesHtml, notesToText } from '../constants/notes';

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const displayTitle = (note) => note.title?.trim() || 'Untitled note';

// A note opened for editing: the title and body save as you type
function NoteEditor({ note, onChange, onClose }) {
  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
    }
  };
  return (
    <div onKeyDown={onKeyDown} className="flex-1 min-w-0 space-y-2">
      <div className="flex gap-2">
        <input
          autoFocus
          type="text"
          value={note.title || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Title, e.g. Questions for my next lesson"
          className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg font-medium text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
          title="Close the editor (Esc). Changes are already saved."
        >
          <Check size={16} />
          Done
        </button>
      </div>
      <RichTextEditor
        value={note.body || ''}
        onChange={(body) => onChange({ body })}
        placeholder="Write anything: questions that come up while practicing, songs to learn, ideas..."
      />
    </div>
  );
}

// The body rendered read-only (notes are HTML from the editor; older ones may be plain text)
function NoteBody({ body, clamp }) {
  if (!body || !notesToText(body)) return null;
  if (clamp) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{notesToText(body)}</p>
    );
  }
  return isHtmlNotes(body) ? (
    <div
      className="text-sm text-gray-700 dark:text-gray-200 mt-1 [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5"
      dangerouslySetInnerHTML={{ __html: sanitizeNotesHtml(body) }}
    />
  ) : (
    <p className="text-sm text-gray-700 dark:text-gray-200 mt-1 whitespace-pre-wrap">{body}</p>
  );
}

export function Notes({
  notes,
  archivedNotes,
  onAddNote,
  onUpdateNote,
  onArchiveNote,
  onRestoreNote,
  onDeleteNote,
}) {
  const [activeTab, setActiveTab] = useState('active');
  const [editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Newest first
  const activeList = [...notes].reverse();
  const archivedList = [...archivedNotes].reverse();

  const handleNew = () => {
    const note = onAddNote();
    setActiveTab('active');
    setEditingId(note.id);
    setExpandedId(null);
  };

  const tabButton = (id, label, count, color) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
        activeTab === id
          ? color
          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
      }`}
    >
      {label} ({count})
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/40 rounded-lg">
              <NotebookPen className="text-primary-600 dark:text-primary-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Notes</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {notes.length} active, {archivedNotes.length} archived
              </p>
            </div>
          </div>
          <button
            onClick={handleNew}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">New Note</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-6">
          {tabButton('active', 'Active', notes.length, 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300')}
          {tabButton('archived', 'Archived', archivedNotes.length, 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300')}
        </div>

        {/* Active Tab */}
        {activeTab === 'active' && (
          <div className="space-y-2">
            {activeList.length === 0 ? (
              <div className="text-center py-12">
                <NotebookPen className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
                <p className="text-gray-400 dark:text-gray-500">No notes yet</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm">
                  Keep free-form notes: questions for your teacher, songs to learn, anything
                </p>
              </div>
            ) : (
              activeList.map((note) => (
                <div
                  key={note.id}
                  className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
                >
                  {editingId === note.id ? (
                    <NoteEditor
                      note={note}
                      onChange={(changes) => onUpdateNote(note.id, changes)}
                      onClose={() => {
                        setEditingId(null);
                        setExpandedId(note.id);
                      }}
                    />
                  ) : (
                    <>
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => setExpandedId(expandedId === note.id ? null : note.id)}
                        onDoubleClick={() => setEditingId(note.id)}
                        title={expandedId === note.id ? 'Click to collapse, double-click to edit' : 'Click to expand, double-click to edit'}
                      >
                        <h3 className="font-medium text-gray-800 dark:text-gray-200 break-words">
                          {displayTitle(note)}
                        </h3>
                        <NoteBody body={note.body} clamp={expandedId !== note.id} />
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {note.updatedAt && note.updatedAt !== note.createdAt
                            ? `Edited ${formatDate(note.updatedAt)}`
                            : `Added ${formatDate(note.createdAt)}`}
                        </p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => setEditingId(note.id)}
                          className="p-2 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => onArchiveNote(note)}
                          className="p-2 text-gray-400 dark:text-gray-500 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-colors"
                          title="Archive"
                        >
                          <Archive size={18} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(note)}
                          className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Archived Tab */}
        {activeTab === 'archived' && (
          <>
            {archivedList.length === 0 ? (
              <div className="text-center py-12">
                <Archive className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
                <p className="text-gray-400 dark:text-gray-500">No archived notes</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm">
                  Archived notes will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {archivedList.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
                  >
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => setExpandedId(expandedId === note.id ? null : note.id)}
                    >
                      <h3 className="font-medium text-gray-700 dark:text-gray-200 break-words">
                        {displayTitle(note)}
                      </h3>
                      <NoteBody body={note.body} clamp={expandedId !== note.id} />
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Archived {formatDate(note.archivedAt)}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => onRestoreNote(note)}
                        className="flex items-center gap-1 px-3 py-2 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors text-sm"
                      >
                        <RotateCcw size={16} />
                        Restore
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(note)}
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

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => onDeleteNote(deleteConfirm.id)}
        title="Delete Note"
        message={`Permanently delete "${deleteConfirm ? displayTitle(deleteConfirm) : ''}"? This action cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  );
}
