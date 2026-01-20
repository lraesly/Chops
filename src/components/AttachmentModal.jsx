import { useState, useRef } from 'react';
import { X, Link as LinkIcon, FileText, Upload, AlertTriangle } from 'lucide-react';

const MAX_PDF_SIZE = 2 * 1024 * 1024; // 2MB
const WARN_PDF_SIZE = 500 * 1024; // 500KB

export function AttachmentModal({ isOpen, onClose, onSave }) {
  const [attachmentType, setAttachmentType] = useState('link');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [pdfData, setPdfData] = useState(null);
  const [pdfSize, setPdfSize] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please select a PDF file');
      return;
    }

    if (file.size > MAX_PDF_SIZE) {
      setError('PDF file is too large (max 2MB)');
      return;
    }

    setPdfSize(file.size);
    setError('');

    if (!name) {
      setName(file.name.replace('.pdf', ''));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPdfData(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }

    if (attachmentType === 'link' && !url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (attachmentType === 'pdf' && !pdfData) {
      setError('Please select a PDF file');
      return;
    }

    const attachment = {
      id: Date.now().toString(),
      type: attachmentType,
      name: name.trim(),
      createdAt: new Date().toISOString(),
    };

    if (attachmentType === 'link') {
      // Ensure URL has protocol
      let finalUrl = url.trim();
      if (!finalUrl.match(/^https?:\/\//)) {
        finalUrl = 'https://' + finalUrl;
      }
      attachment.url = finalUrl;
    } else {
      attachment.data = pdfData;
    }

    onSave(attachment);
    handleClose();
  };

  const handleClose = () => {
    setAttachmentType('link');
    setName('');
    setUrl('');
    setPdfData(null);
    setPdfSize(0);
    setError('');
    onClose();
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Add Attachment</h3>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Type selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setAttachmentType('link')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                attachmentType === 'link'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <LinkIcon size={18} />
              Link
            </button>
            <button
              onClick={() => setAttachmentType('pdf')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                attachmentType === 'pdf'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <FileText size={18} />
              PDF
            </button>
          </div>

          {/* Name input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Sheet music, Tutorial video"
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Type-specific input */}
          {attachmentType === 'link' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                URL
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                PDF File
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-primary-400 dark:hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <Upload size={20} />
                {pdfData ? 'Change PDF' : 'Select PDF'}
              </button>
              {pdfData && (
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <FileText size={16} className="text-primary-600 dark:text-primary-400" />
                  <span className="text-gray-600 dark:text-gray-300">{formatSize(pdfSize)}</span>
                  {pdfSize > WARN_PDF_SIZE && (
                    <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                      <AlertTriangle size={14} />
                      Large file
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
