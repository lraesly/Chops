import { useState, useEffect, useRef } from 'react';
import { X, Circle, Square, Save, Trash2, FolderOpen, AlertCircle, Pause, Play } from 'lucide-react';
import { useVideoRecorder } from '../hooks/useVideoRecorder';
import { renameVideoFile, trashFile, loadVideoUrl, revealVideoFile, revealLabel, openVideoFile } from '../hooks/videoStorage';
import { formatTime } from '../hooks/useTimer';
import { ConfirmDialog } from './ConfirmDialog';

const COUNT_IN_KEY = 'chops_videoCountInBars';
const BEATS_PER_BAR = 4;

function loadCountInBars() {
  try {
    const saved = parseInt(localStorage.getItem(COUNT_IN_KEY), 10);
    return [0, 1, 2].includes(saved) ? saved : 1;
  } catch {
    return 1;
  }
}

function saveCountInBars(bars) {
  try {
    localStorage.setItem(COUNT_IN_KEY, String(bars));
  } catch {
    // Remembering the count-in is a convenience only
  }
}

const OPEN_ON_SAVE_KEY = 'chops_openVideoOnSave';

function loadOpenOnSave() {
  try {
    return localStorage.getItem(OPEN_ON_SAVE_KEY) === 'true';
  } catch {
    return false;
  }
}

const selectClass =
  'w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

function LevelMeter({ level }) {
  // Peak level in dBFS mapped onto -60..0
  const db = level > 0 ? 20 * Math.log10(level) : -Infinity;
  const percent = Math.max(0, Math.min(100, ((db + 60) / 60) * 100));
  const color = db > -1 ? 'bg-red-500' : db > -12 ? 'bg-yellow-400' : 'bg-green-500';
  return (
    <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden" title="Input level">
      <div className={`h-full ${color} transition-[width] duration-75`} style={{ width: `${percent}%` }} />
    </div>
  );
}

export function VideoRecorderModal({ onClose, onSaveRecording, sessionInstanceId, metronome }) {
  const recorder = useVideoRecorder();
  const [take, setTake] = useState(null);
  const [takeUrl, setTakeUrl] = useState(null);
  const [recordingName, setRecordingName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [takeError, setTakeError] = useState(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const [countInBars, setCountInBars] = useState(loadCountInBars);
  const [openOnSave, setOpenOnSave] = useState(loadOpenOnSave);
  const [countInBeat, setCountInBeat] = useState(null); // 1-based beat shown during the count-in
  const countInRef = useRef(null);
  const previewRef = useRef(null);
  const { startPreview, startRecording, stopRecording, pauseRecording, resumeRecording, isRecording, isPaused } = recorder;
  const bpm = metronome?.bpm || 120;

  useEffect(() => {
    startPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    // WebKit won't restart playback on its own when srcObject is swapped
    el.srcObject = recorder.stream;
    if (recorder.stream) el.play().catch(() => {});
  }, [recorder.stream, take]);

  useEffect(() => () => takeUrl && URL.revokeObjectURL(takeUrl), [takeUrl]);

  const handleStop = async () => {
    const result = await stopRecording();
    if (!result) return;
    setTake(result);
    if (result.writeError) {
      setTakeError(`Part of the video could not be written to disk: ${result.writeError.message || result.writeError}`);
    }
    try {
      setTakeUrl(await loadVideoUrl(result.filePath, result.mimeType));
    } catch (err) {
      console.error('Error loading take:', err);
      setTakeError(`Saved to disk, but the preview could not be loaded: ${err.message || err}`);
    }
  };

  const cancelCountIn = () => {
    const countIn = countInRef.current;
    if (!countIn) return;
    countIn.timeouts.forEach(clearTimeout);
    countIn.context.close().catch(() => {});
    countInRef.current = null;
    setCountInBeat(null);
  };

  useEffect(() => cancelCountIn, []);

  // Clicks out the count-in, then records. The recorder starts one beat early so
  // the downbeat isn't clipped while MediaRecorder spins up.
  const startCountIn = () => {
    const totalBeats = countInBars * BEATS_PER_BAR;
    if (totalBeats === 0) {
      startRecording();
      return;
    }
    const context = new (window.AudioContext || window.webkitAudioContext)();
    context.resume().catch(() => {});
    const secondsPerBeat = 60 / bpm;
    const startAt = context.currentTime + 0.1;
    for (let i = 0; i < totalBeats; i++) {
      const at = startAt + i * secondsPerBeat;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.frequency.value = i % BEATS_PER_BAR === 0 ? 1500 : 1000;
      gain.gain.setValueAtTime(0.5, at);
      gain.gain.exponentialRampToValueAtTime(0.001, at + 0.1);
      oscillator.start(at);
      oscillator.stop(at + 0.1);
    }

    const beatMs = secondsPerBeat * 1000;
    const timeouts = [];
    for (let i = 0; i < totalBeats; i++) {
      timeouts.push(setTimeout(() => setCountInBeat((i % BEATS_PER_BAR) + 1), 100 + i * beatMs));
    }
    timeouts.push(setTimeout(() => startRecording(), 100 + (totalBeats - 1) * beatMs));
    timeouts.push(setTimeout(() => {
      context.close().catch(() => {});
      countInRef.current = null;
      setCountInBeat(null);
    }, 100 + totalBeats * beatMs));
    countInRef.current = { context, timeouts };
    setCountInBeat(0);
  };

  const isCountingIn = countInBeat !== null;

  const handleToggleRecording = () => {
    if (take) return;
    if (isCountingIn && !isRecording) {
      cancelCountIn();
    } else if (isRecording) {
      cancelCountIn();
      handleStop();
    } else {
      startCountIn();
    }
  };

  const handleTogglePause = () => {
    if (!isRecording || isCountingIn) return;
    if (isPaused) {
      resumeRecording();
    } else {
      pauseRecording();
    }
  };

  // Space/R start and stop the take, P pauses. Handled in the capture phase so the
  // practice timer and audio recorder behind this window don't react too.
  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = e.target.tagName;
      // Stay on this window: switching tabs (⌘1–6, ⌘,) would hide it mid-take
      if ((e.metaKey || e.ctrlKey) && (/^[1-6]$/.test(e.key) || e.key === ',')) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (take) {
        // Reviewing: leave Space to the video player, but keep it from the practice timer
        if (e.key === ' ') e.stopImmediatePropagation();
        return;
      }
      if (e.key === ' ' || e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (!e.repeat) handleToggleRecording();
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (!e.repeat) handleTogglePause();
      } else if (e.key === 'Escape' && !isRecording && !isCountingIn) {
        e.stopImmediatePropagation();
        closeNow();
      }
    };
    // Keep a focused button from also "clicking" on Space release
    const onKeyUp = (e) => {
      if (e.key === ' ' && !take && e.target.tagName === 'BUTTON') e.preventDefault();
    };
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
    };
  });

  const resetTake = () => {
    if (takeUrl) URL.revokeObjectURL(takeUrl);
    setTakeUrl(null);
    setTake(null);
    setRecordingName('');
    setTakeError(null);
  };

  const handleSave = async () => {
    if (!take || !recordingName.trim() || isSaving) return;
    setIsSaving(true);
    let filePath = take.filePath;
    try {
      filePath = await renameVideoFile(take.filePath, recordingName.trim());
    } catch (err) {
      // Keep the timestamped name rather than losing the take
      console.error('Error renaming video file:', err);
    }
    onSaveRecording({
      id: Date.now().toString(),
      type: 'video',
      name: recordingName.trim(),
      filePath,
      mimeType: take.mimeType,
      duration: take.duration,
      size: take.size,
      sessionInstanceId,
      createdAt: new Date().toISOString(),
    });
    setIsSaving(false);
    recorder.close();
    onClose();
    if (openOnSave) {
      // Hands the file to the system's default player (e.g. QuickTime for trimming)
      openVideoFile(filePath).catch((err) => console.error('Error opening saved video:', err));
    }
  };

  const handleDiscard = async () => {
    try {
      await trashFile(take.filePath);
    } catch (err) {
      console.error('Error deleting discarded take:', err);
    }
    resetTake();
  };

  const closeNow = () => {
    recorder.close();
    onClose();
  };

  const handleClose = () => {
    if (isRecording) return;
    cancelCountIn();
    if (take) {
      setConfirmClose(true);
      return;
    }
    closeNow();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      {/* Fills the window so the preview gets whatever height the controls leave */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-5 w-full max-w-5xl h-full max-h-[960px] flex flex-col">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            {take ? 'Save Video' : 'Record Video'}
          </h3>
          <button
            onClick={handleClose}
            disabled={isRecording || isCountingIn}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded disabled:opacity-30"
            title={isRecording ? 'Stop recording first' : 'Close'}
          >
            <X size={20} />
          </button>
        </div>

        {(recorder.error || takeError) && (
          <div className="flex items-start gap-2 p-3 mb-3 shrink-0 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{takeError || recorder.error}</span>
          </div>
        )}

        <div className="relative flex-1 min-h-[160px] bg-black rounded-xl overflow-hidden mb-3">
          {take ? (
            takeUrl && <video src={takeUrl} controls playsInline className="absolute inset-0 w-full h-full object-contain" />
          ) : (
            <video ref={previewRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-contain" />
          )}
          {isRecording && (
            <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/60 text-white text-sm font-mono">
              {isPaused ? (
                <Pause size={12} className="text-yellow-400" fill="currentColor" />
              ) : (
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              )}
              {formatTime(recorder.elapsed)}
              {isPaused && <span className="text-yellow-400 font-sans text-xs">Paused</span>}
            </div>
          )}
          {isCountingIn && countInBeat > 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span
                key={countInBeat}
                className={`text-8xl font-bold drop-shadow-lg animate-pulse ${countInBeat === 1 ? 'text-red-400' : 'text-white'}`}
              >
                {countInBeat}
              </span>
            </div>
          )}
        </div>

        {!take && (
          <div className="shrink-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <label className="text-sm text-gray-600 dark:text-gray-300">
                Camera
                <select
                  className={`${selectClass} mt-1`}
                  value={recorder.cameraId}
                  disabled={isRecording || isCountingIn}
                  onChange={(e) => recorder.selectCamera(e.target.value)}
                >
                  {recorder.cameras.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>{d.label || 'Camera'}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-gray-600 dark:text-gray-300">
                Audio input
                <select
                  className={`${selectClass} mt-1`}
                  value={recorder.audioInputId}
                  disabled={isRecording || isCountingIn}
                  onChange={(e) => recorder.selectAudioInput(e.target.value)}
                >
                  {recorder.audioInputs.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>{d.label || 'Audio input'}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mb-3">
              <LevelMeter level={recorder.level} />
            </div>
            <div className="flex flex-wrap items-center gap-3 mb-3 text-sm text-gray-600 dark:text-gray-300">
              <label className="flex items-center gap-2">
                Count-in
                <select
                  className={`${selectClass} w-auto`}
                  value={countInBars}
                  disabled={isRecording || isCountingIn}
                  onChange={(e) => {
                    const bars = parseInt(e.target.value, 10);
                    setCountInBars(bars);
                    saveCountInBars(bars);
                  }}
                >
                  <option value={0}>Off</option>
                  <option value={1}>1 bar</option>
                  <option value={2}>2 bars</option>
                </select>
              </label>
              {countInBars > 0 && metronome && (
                <label className="flex items-center gap-2">
                  at
                  <input
                    type="number"
                    min={30}
                    max={300}
                    value={bpm}
                    disabled={isRecording || isCountingIn}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      if (value >= 30 && value <= 300) metronome.setBpm(value);
                    }}
                    className={`${selectClass} w-20`}
                  />
                  BPM
                </label>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleToggleRecording}
                disabled={!recorder.stream}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white transition-colors disabled:opacity-50 ${
                  isRecording || isCountingIn ? 'bg-gray-700 hover:bg-gray-800' : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {isRecording || isCountingIn ? <Square size={18} /> : <Circle size={18} fill="currentColor" />}
                {isRecording ? 'Stop' : isCountingIn ? 'Cancel' : 'Record'}
                <span className="text-xs opacity-70 ml-1">(Space)</span>
              </button>
              {isRecording && (
                <button
                  onClick={handleTogglePause}
                  disabled={isCountingIn}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  {isPaused ? <Play size={18} /> : <Pause size={18} />}
                  {isPaused ? 'Resume' : 'Pause'}
                  <span className="text-xs opacity-70 ml-1">(P)</span>
                </button>
              )}
            </div>
          </div>
        )}

        {take && (
          <div className="shrink-0">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 break-all">
              {formatTime(take.duration * 1000)} · {(take.size / 1e6).toFixed(1)} MB · {take.filePath}
            </p>
            <input
              type="text"
              value={recordingName}
              onChange={(e) => setRecordingName(e.target.value)}
              placeholder="Name this video..."
              autoFocus
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
            />
            <label className="flex items-center gap-2 mb-3 text-sm text-gray-600 dark:text-gray-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={openOnSave}
                onChange={(e) => {
                  setOpenOnSave(e.target.checked);
                  try {
                    localStorage.setItem(OPEN_ON_SAVE_KEY, String(e.target.checked));
                  } catch {
                    // Remembering this is a convenience only
                  }
                }}
                className="w-4 h-4 accent-primary-600"
              />
              Open in default video app after saving
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={!recordingName.trim() || isSaving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save size={18} />
                Save
              </button>
              <button
                onClick={() => revealVideoFile(take.filePath)}
                className="px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title={revealLabel}
              >
                <FolderOpen size={18} />
              </button>
              <button
                onClick={handleDiscard}
                className="px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                title="Discard this take and record again"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Unsaved take: keep the file rather than silently deleting a performance */}
      <ConfirmDialog
        isOpen={confirmClose}
        onClose={() => setConfirmClose(false)}
        onConfirm={closeNow}
        title="Close Without Saving?"
        message="This take won't be added to the session. The video file stays in your video folder."
        confirmText="Close"
        variant="warning"
      />
    </div>
  );
}
