import { useState, useRef } from 'react';
import { Mic, Square, Play, Pause, Trash2, Save } from 'lucide-react';
import { useAudioRecorder, blobToBase64 } from '../hooks/useAudioRecorder';

export function AudioRecorder({ onSaveRecording, sessionInstanceId }) {
  const { isRecording, audioUrl, toggleRecording, clearRecording, audioBlob, mimeType } =
    useAudioRecorder();
  const [recordingName, setRecordingName] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSave = async () => {
    if (audioBlob && recordingName.trim()) {
      const base64 = await blobToBase64(audioBlob);
      onSaveRecording({
        id: Date.now().toString(),
        name: recordingName.trim(),
        audio: base64,
        mimeType: mimeType,
        sessionInstanceId,
        createdAt: new Date().toISOString(),
      });
      clearRecording();
      setRecordingName('');
      setIsPlaying(false);
    }
  };

  const handleDelete = () => {
    clearRecording();
    setRecordingName('');
    setIsPlaying(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-700 dark:text-gray-200">Record Audio</h4>
        <button
          onClick={toggleRecording}
          className={`p-3 rounded-full transition-all ${
            isRecording
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          {isRecording ? <Square size={20} /> : <Mic size={20} />}
        </button>
      </div>

      {isRecording && (
        <div className="flex items-center gap-2 text-red-500 text-sm mb-3">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          Recording...
        </div>
      )}

      {audioUrl && (
        <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />

          <div className="flex items-center gap-2">
            <button
              onClick={handlePlayPause}
              className="p-2 bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/60 transition-colors"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
              <div className="h-full bg-primary-500 w-0" />
            </div>
          </div>

          <input
            type="text"
            value={recordingName}
            onChange={(e) => setRecordingName(e.target.value)}
            placeholder="Name this recording..."
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          />

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!recordingName.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              <Save size={16} />
              Save
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function RecordingsList({ recordings, onDelete }) {
  const [playingId, setPlayingId] = useState(null);
  const audioRefs = useRef({});

  const handlePlay = (recording) => {
    if (playingId === recording.id) {
      audioRefs.current[recording.id]?.pause();
      setPlayingId(null);
    } else {
      if (playingId && audioRefs.current[playingId]) {
        audioRefs.current[playingId].pause();
      }
      audioRefs.current[recording.id]?.play();
      setPlayingId(recording.id);
    }
  };

  if (recordings.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">Recordings</h4>
      {recordings.map((recording) => (
        <div
          key={recording.id}
          className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
        >
          <audio
            ref={(el) => (audioRefs.current[recording.id] = el)}
            src={recording.audio}
            onEnded={() => setPlayingId(null)}
            className="hidden"
          />
          <button
            onClick={() => handlePlay(recording)}
            className="p-2 bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/60 transition-colors"
          >
            {playingId === recording.id ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <span className="flex-1 text-sm text-gray-700 dark:text-gray-200 truncate">
            {recording.name}
          </span>
          <button
            onClick={() => onDelete(recording.id)}
            className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
