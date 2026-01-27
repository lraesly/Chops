import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Mic, Square, Play, Pause, Save, Trash2, X } from 'lucide-react';
import { useAudioRecorder, blobToBase64 } from '../hooks/useAudioRecorder';

export const RecordButton = forwardRef(function RecordButton({ onSaveRecording, sessionInstanceId, disabled }, ref) {
  const { isRecording, audioUrl, toggleRecording, clearRecording, audioBlob, mimeType } =
    useAudioRecorder();
  const [showModal, setShowModal] = useState(false);
  const [recordingName, setRecordingName] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const handleToggleRecording = () => {
    if (disabled) return;

    if (isRecording) {
      // Stopping recording - show modal
      toggleRecording();
      setShowModal(true);
    } else {
      // Starting recording
      toggleRecording();
    }
  };

  // Expose toggle function to parent via ref
  useImperativeHandle(ref, () => ({
    toggle: handleToggleRecording,
    isRecording,
  }), [disabled, isRecording]);

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
      handleClose();
    }
  };

  const handleClose = () => {
    clearRecording();
    setRecordingName('');
    setIsPlaying(false);
    setShowModal(false);
  };

  const handleDiscard = () => {
    handleClose();
  };

  return (
    <>
      {/* Record Button */}
      <button
        onClick={handleToggleRecording}
        disabled={disabled}
        className={`p-2 rounded-full transition-all ${
          isRecording
            ? 'bg-red-500 text-white animate-pulse'
            : disabled
            ? 'bg-white/10 text-white/40 cursor-not-allowed'
            : 'bg-white/20 text-white hover:bg-white/30'
        }`}
        title={disabled ? 'Start session to record' : isRecording ? 'Stop recording' : 'Start recording'}
      >
        {isRecording ? <Square size={24} /> : <Mic size={24} />}
      </button>

      {/* Recording Name Modal */}
      {showModal && audioUrl && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Save Recording</h3>
              <button
                onClick={handleClose}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
              >
                <X size={20} />
              </button>
            </div>

            {/* Audio Preview */}
            <div className="mb-4">
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
                <span className="text-sm text-gray-600 dark:text-gray-300">Preview recording</span>
              </div>
            </div>

            {/* Name Input */}
            <input
              type="text"
              value={recordingName}
              onChange={(e) => setRecordingName(e.target.value)}
              placeholder="Name this recording..."
              autoFocus
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && recordingName.trim()) {
                  handleSave();
                }
              }}
            />

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={!recordingName.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save size={18} />
                Save
              </button>
              <button
                onClick={handleDiscard}
                className="px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});
