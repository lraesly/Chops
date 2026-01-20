import { Volume2, VolumeX } from 'lucide-react';
import { useMetronome } from '../hooks/useMetronome';

export function Metronome() {
  const { bpm, setBpm, isPlaying, toggle } = useMetronome();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Metronome</h3>
        <button
          onClick={toggle}
          className={`p-3 rounded-full transition-colors ${
            isPlaying
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          {isPlaying ? <Volume2 size={24} /> : <VolumeX size={24} />}
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-4xl font-bold text-primary-600 dark:text-primary-400">{bpm}</span>
          <span className="text-gray-500 dark:text-gray-400">BPM</span>
        </div>

        <input
          type="range"
          min="40"
          max="240"
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          className="w-full cursor-pointer"
        />

        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>40</span>
          <span>140</span>
          <span>240</span>
        </div>

        <div className="flex gap-2 flex-wrap">
          {[60, 80, 100, 120, 140, 160].map((preset) => (
            <button
              key={preset}
              onClick={() => setBpm(preset)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
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
  );
}
