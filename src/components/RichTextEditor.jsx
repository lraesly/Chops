import { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, List, ListOrdered } from 'lucide-react';

export function RichTextEditor({ value, onChange, placeholder }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const handleKeyDown = (e) => {
    // Allow tab for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      execCommand('insertHTML', '&nbsp;&nbsp;&nbsp;&nbsp;');
    }
  };

  const ToolbarButton = ({ onClick, active, children, title }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        active
          ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden bg-white dark:bg-gray-700">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
        <ToolbarButton onClick={() => execCommand('bold')} title="Bold (Ctrl+B)">
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => execCommand('italic')} title="Italic (Ctrl+I)">
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => execCommand('underline')} title="Underline (Ctrl+U)">
          <Underline size={16} />
        </ToolbarButton>
        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
        <ToolbarButton onClick={() => execCommand('insertUnorderedList')} title="Bullet list">
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => execCommand('insertOrderedList')} title="Numbered list">
          <ListOrdered size={16} />
        </ToolbarButton>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        className="min-h-[8rem] max-h-64 overflow-y-auto px-4 py-3 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 dark:empty:before:text-gray-500 [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5"
      />
    </div>
  );
}
