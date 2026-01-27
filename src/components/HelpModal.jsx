import { useEffect } from 'react';
import { X, Keyboard, BookOpen } from 'lucide-react';

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
const cmdKey = isMac ? '⌘' : 'Ctrl';

const shortcuts = [
  {
    category: 'Practice Session',
    items: [
      { keys: ['Space'], description: 'Start/Pause timer' },
      { keys: [cmdKey, 'S'], description: 'Save session' },
      { keys: ['M'], description: 'Open metronome' },
      { keys: ['R'], description: 'Start/Stop recording (when timer running)' },
    ],
  },
  {
    category: 'Navigation',
    items: [
      { keys: [cmdKey, '1'], description: 'Go to Practice' },
      { keys: [cmdKey, '2'], description: 'Go to Items' },
      { keys: [cmdKey, '3'], description: 'Go to History' },
      { keys: [cmdKey, '4'], description: 'Go to Statistics' },
      { keys: [cmdKey, ','], description: 'Go to Settings' },
      { keys: ['?'], description: 'Show this help' },
    ],
  },
];

const tips = [
  'Add practice items first, then start a session from the Practice tab.',
  'Use the metronome to keep time while practicing.',
  'Record yourself to track progress over time.',
  'Check Statistics to see your practice streaks and trends.',
  'Export backups regularly from Settings to keep your data safe.',
];

export function HelpModal({ isOpen, onClose }) {
  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Help</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Keyboard size={20} className="text-primary-600 dark:text-primary-400" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Keyboard Shortcuts</h3>
          </div>

          <div className="space-y-5">
            {shortcuts.map((group) => (
              <div key={group.category}>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  {group.category}
                </h4>
                <div className="space-y-1.5">
                  {group.items.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-1.5 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <span className="text-gray-700 dark:text-gray-200 text-sm">{shortcut.description}</span>
                      <div className="flex items-center gap-0.5">
                        {shortcut.keys.map((key, keyIndex) => (
                          <span key={keyIndex} className="flex items-center">
                            <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded shadow-sm min-w-[24px] text-center">
                              {key}
                            </kbd>
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className="text-gray-400 mx-0.5 text-xs">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={20} className="text-primary-600 dark:text-primary-400" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Quick Tips</h3>
          </div>

          <ul className="space-y-2">
            {tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                <span className="text-primary-500 mt-1">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
            Chops — Build your skills, track your progress
          </p>
        </div>
      </div>
    </div>
  );
}
