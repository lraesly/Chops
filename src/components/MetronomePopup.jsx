import { useState, forwardRef, useImperativeHandle } from 'react';
import { Play, Pause, X } from 'lucide-react';
import { useMetronome } from '../hooks/useMetronome';

// Metronome icon SVG
function MetronomeIcon({ size = 24, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2L8 22h8L12 2z" />
      <path d="M12 12l4-8" />
      <circle cx="12" cy="18" r="2" />
    </svg>
  );
}

export const MetronomePopup = forwardRef(function MetronomePopup({ metronome: externalMetronome } = {}, ref) {
  // Use external metronome state if provided, otherwise use internal
  const internalMetronome = useMetronome();
  const { bpm, setBpm, isPlaying, toggle, stop } = externalMetronome || internalMetronome;
  const [isOpen, setIsOpen] = useState(false);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    toggle: handleIconClick,  // Same behavior as clicking the icon
    open: () => setIsOpen(true),
    close: handleClose,
    isOpen,
  }), [isOpen, isPlaying]);

  const handleIconClick = () => {
    if (isOpen && isPlaying) {
      // If popup is open and playing, stop and close
      stop();
      setIsOpen(false);
    } else if (isOpen) {
      // If popup is open but not playing, just close
      setIsOpen(false);
    } else {
      // Open popup
      setIsOpen(true);
    }
  };

  const handleClose = () => {
    if (isPlaying) {
      stop();
    }
    setIsOpen(false);
  };

  return (
    <>
      {/* Metronome Icon Button */}
      <button
        onClick={handleIconClick}
        className={`p-2 rounded-full transition-all ${
          isPlaying
            ? 'bg-white text-primary-600 shadow-lg animate-pulse'
            : 'bg-white/20 text-white hover:bg-white/30'
        }`}
        title={isPlaying ? 'Stop metronome' : 'Open metronome'}
      >
        <MetronomeIcon size={24} />
        <span className="absolute -bottom-1 -right-1 text-xs bg-primary-600 text-white px-1.5 rounded-full">
          {bpm}
        </span>
      </button>

      {/* Popup */}
      {isOpen && (
        <div className="absolute bottom-12 left-0 z-50 w-52 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-3 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-800 dark:text-white">Metronome</h3>
            <div className="flex items-center gap-1">
              <button
                onClick={toggle}
                className={`p-1.5 rounded-full transition-colors ${
                  isPlaying
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button
                onClick={handleClose}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">{bpm}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">BPM</span>
            </div>

            <input
              type="range"
              min="40"
              max="240"
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-full cursor-pointer"
            />

            <div className="grid grid-cols-6 gap-1">
              {[80, 100, 120, 140, 160, 180].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setBpm(preset)}
                  className={`px-1 py-1 text-xs rounded-md transition-colors ${
                    bpm === preset
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
});
