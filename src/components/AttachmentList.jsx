import { FileText, Link as LinkIcon, ExternalLink, Trash2 } from 'lucide-react';
import { open } from '@tauri-apps/plugin-shell';

export function AttachmentList({ attachments = [], onDelete, compact = false }) {
  if (attachments.length === 0) return null;

  const handleOpen = async (attachment) => {
    if (attachment.type === 'link') {
      await open(attachment.url);
    } else if (attachment.type === 'pdf') {
      // Open base64 PDF in new tab
      const pdfWindow = window.open('');
      pdfWindow.document.write(
        `<iframe width='100%' height='100%' src='${attachment.data}' frameborder='0'></iframe>`
      );
    }
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1">
        {attachments.map((attachment) => (
          <button
            key={attachment.id}
            onClick={() => handleOpen(attachment)}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
            title={attachment.name}
          >
            {attachment.type === 'link' ? <LinkIcon size={10} /> : <FileText size={10} />}
            <span className="max-w-[80px] truncate">{attachment.name}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">Attachments</h4>
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
        >
          <div className="p-1.5 bg-primary-100 dark:bg-primary-900/40 rounded">
            {attachment.type === 'link' ? (
              <LinkIcon size={14} className="text-primary-600 dark:text-primary-400" />
            ) : (
              <FileText size={14} className="text-primary-600 dark:text-primary-400" />
            )}
          </div>
          <span className="flex-1 text-sm text-gray-700 dark:text-gray-200 truncate">
            {attachment.name}
          </span>
          <button
            onClick={() => handleOpen(attachment)}
            className="p-1 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            title="Open"
          >
            <ExternalLink size={16} />
          </button>
          {onDelete && (
            <button
              onClick={() => onDelete(attachment.id)}
              className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
