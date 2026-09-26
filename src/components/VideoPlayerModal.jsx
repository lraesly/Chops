import { useState, useEffect } from 'react';
import { X, FolderOpen, ExternalLink, AlertCircle } from 'lucide-react';
import { loadVideoUrl, revealVideoFile, revealLabel, openVideoFile, videoFileExists } from '../hooks/videoStorage';

export function VideoPlayerModal({ recording, onClose }) {
  const [url, setUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let objectUrl = null;
    let cancelled = false;
    (async () => {
      try {
        if (!(await videoFileExists(recording.filePath))) {
          setError('The video file was moved or deleted.');
          return;
        }
        objectUrl = await loadVideoUrl(recording.filePath, recording.mimeType);
        if (cancelled) {
          URL.revokeObjectURL(objectUrl);
        } else {
          setUrl(objectUrl);
        }
      } catch (err) {
        console.error('Error loading video:', err);
        if (!cancelled) setError(`Could not load the video: ${err.message || err}`);
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [recording.filePath, recording.mimeType]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [onClose]);

  const actionClass =
    'flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm disabled:opacity-50';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-6 w-full max-w-3xl max-h-full overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 gap-2">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white truncate">{recording.name}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded">
            <X size={20} />
          </button>
        </div>

        {error ? (
          <div className="flex items-start gap-2 p-3 mb-4 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="bg-black rounded-xl overflow-hidden aspect-video mb-4 flex items-center justify-center">
            {url ? (
              <video src={url} controls autoPlay playsInline className="w-full h-full" />
            ) : (
              <span className="text-white/60 text-sm">Loading…</span>
            )}
          </div>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 break-all">{recording.filePath}</p>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => revealVideoFile(recording.filePath)} disabled={!!error} className={actionClass}>
            <FolderOpen size={16} />
            {revealLabel}
          </button>
          <button onClick={() => openVideoFile(recording.filePath)} disabled={!!error} className={actionClass}>
            <ExternalLink size={16} />
            Open
          </button>
        </div>
      </div>
    </div>
  );
}
