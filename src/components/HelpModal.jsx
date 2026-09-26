import { useEffect, useState } from 'react';
import { X, Keyboard, BookOpen, ExternalLink } from 'lucide-react';
import { open } from '@tauri-apps/plugin-shell';

const USER_GUIDE_URL = 'https://github.com/lraesly/Chops/blob/main/docs/USER-GUIDE.md';

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
const cmdKey = isMac ? '⌘' : 'Ctrl';

const shortcuts = [
  {
    category: 'Practice Session',
    items: [
      { keys: ['Space'], description: 'Start/Pause timer' },
      { keys: [cmdKey, 'S'], description: 'Save session' },
      { keys: ['R'], description: 'Start/Stop audio recording (once the session has started)' },
      { keys: ['V'], description: 'Open the video recorder (once the session has started)' },
    ],
  },
  {
    category: 'Video Recorder',
    items: [
      { keys: ['Space'], description: 'Record/Stop (R works too; cancels a count-in)' },
      { keys: ['P'], description: 'Pause/Resume the take' },
      { keys: ['Esc'], description: 'Close (when not recording)' },
    ],
  },
  {
    category: 'Metronome',
    items: [
      { keys: ['M'], description: 'Open/Close metronome' },
      { keys: ['K'], description: 'Start/Stop metronome' },
      { keys: ['['], description: 'Decrease tempo' },
      { keys: [']'], description: 'Increase tempo' },
    ],
  },
  {
    category: 'Navigation',
    items: [
      { keys: [cmdKey, '1'], description: 'Go to Practice' },
      { keys: [cmdKey, '2'], description: 'Go to Items' },
      { keys: [cmdKey, '3'], description: 'Go to To Do' },
      { keys: [cmdKey, '4'], description: 'Go to Templates' },
      { keys: [cmdKey, '5'], description: 'Go to History' },
      { keys: [cmdKey, '6'], description: 'Go to Statistics' },
      { keys: [cmdKey, ','], description: 'Go to Settings' },
      { keys: ['?'], description: 'Show this help' },
    ],
  },
];

// Short version of docs/USER-GUIDE.md; keep the two in step
const guide = [
  {
    title: 'Practice',
    body: 'Add items to the queue, then press Space to start. ▶ on a queue item switches to it; the session clock keeps running. Pause to click an item\'s time and correct it. Save Session (⌘S) stores times, notes and recordings. The session keeps running while you visit other tabs, and notes are kept even if you quit.',
  },
  {
    title: 'Recording audio',
    body: 'Once the session has started, click the mic or press R to record and again to stop, then name and save the take. Recordings belong to the item you were practicing. Deleting one moves its file to the Trash.',
  },
  {
    title: 'Recording video',
    body: 'Click the camera or press V. Pick a camera and audio input (for example a Loopback device carrying your rig and backing track), check the level meter, and set a count-in. Space records and stops, P pauses. After stopping, name the take and Save; tick "Open in default video app" to trim it straight away. Videos are saved to the Video Folder set in Settings.',
  },
  {
    title: 'Metronome',
    body: 'Click the metronome icon or press M. K starts and stops it, [ and ] step between tempo presets. Closing the popup stops it.',
  },
  {
    title: 'Items, To Do and Templates',
    body: 'Items is your practice library: categories, tags, and link or PDF attachments. To Do holds ideas for later; move one to Items when you\'re ready. The pencil adds a note, a link or a label to a to-do. Templates are saved queues, such as a warm-up; Load replaces the queue with one.',
  },
  {
    title: 'History and Stats',
    body: 'History shows every saved session with its notes, item times and recordings. Copy to Session reuses a session\'s items. Stats shows totals, your streak, a 30-day calendar, and time by category and item; filter it by tag.',
  },
  {
    title: 'Your files',
    body: 'Practice data lives in your data folder (Settings > Storage Location). Videos go to your Video Folder. Chops keeps audio recordings in its own app folder. Export Backup saves your data but not recordings, so back those up too. Deleted recordings go to the Trash, never straight to deletion.',
  },
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

  const [tab, setTab] = useState('guide');

  if (!isOpen) return null;

  const tabClass = (name) =>
    `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
      tab === name
        ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
    }`;

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

        <div className="flex gap-2 mb-5">
          <button onClick={() => setTab('guide')} className={tabClass('guide')}>
            <BookOpen size={16} />
            Guide
          </button>
          <button onClick={() => setTab('shortcuts')} className={tabClass('shortcuts')}>
            <Keyboard size={16} />
            Keyboard Shortcuts
          </button>
        </div>

        {tab === 'guide' && (
          <div className="space-y-4">
            {guide.map((section) => (
              <div key={section.title}>
                <h4 className="font-semibold text-gray-800 dark:text-white mb-1">{section.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{section.body}</p>
              </div>
            ))}
            <button
              onClick={() => open(USER_GUIDE_URL).catch((err) => console.error('Could not open the user guide:', err))}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors text-sm"
            >
              <ExternalLink size={16} />
              Open the full user guide
            </button>
          </div>
        )}

        {tab === 'shortcuts' && (
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Single-key shortcuts work on the Practice tab and don't fire while you're typing.
          </p>

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
        )}

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
            Chops — Build your skills, track your progress
          </p>
        </div>
      </div>
    </div>
  );
}
