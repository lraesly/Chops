import { useState, useRef, useCallback, useEffect } from 'react';
import { createVideoFile, appendToVideoFile } from './videoStorage';

// WebKit (macOS) records H.264/AAC MP4; WebView2 (Windows) falls back to WebM
const MIME_TYPES = [
  'video/mp4;codecs=avc1,mp4a',
  'video/mp4',
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
];

const DEVICES_KEY = 'chops_videoDevices';

function getSupportedMimeType() {
  return MIME_TYPES.find((t) => MediaRecorder.isTypeSupported(t)) || '';
}

function loadSavedDevices() {
  try {
    return JSON.parse(localStorage.getItem(DEVICES_KEY)) || {};
  } catch {
    return {};
  }
}

function saveDevices(devices) {
  try {
    localStorage.setItem(DEVICES_KEY, JSON.stringify(devices));
  } catch {
    // Remembering devices is a convenience only
  }
}

// Device IDs can change (e.g. after an OS update), so fall back to the label
function resolveDevice(list, id, label) {
  return list.find((d) => d.deviceId === id) || list.find((d) => label && d.label === label) || null;
}

export function useVideoRecorder() {
  const [cameras, setCameras] = useState([]);
  const [audioInputs, setAudioInputs] = useState([]);
  const [cameraId, setCameraId] = useState(() => loadSavedDevices().cameraId || '');
  const [audioInputId, setAudioInputId] = useState(() => loadSavedDevices().audioInputId || '');
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0); // ms, excluding paused time
  const [level, setLevel] = useState(0);

  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const writeChainRef = useRef(Promise.resolve());
  const writeErrorRef = useRef(null);
  const takeRef = useRef(null);
  const meterRef = useRef(null);
  const timerRef = useRef(null);
  // Bumped on every open/close so a slow getUserMedia can't revive a stale stream
  const openGenerationRef = useRef(0);

  // Recorded time so far, in ms, not counting paused stretches
  const takeElapsed = () => {
    const take = takeRef.current;
    if (!take) return 0;
    return take.recordedMs + (take.segmentStart ? Date.now() - take.segmentStart : 0);
  };

  const stopMeter = () => {
    if (meterRef.current) {
      cancelAnimationFrame(meterRef.current.frame);
      meterRef.current.context.close().catch(() => {});
      meterRef.current = null;
    }
    setLevel(0);
  };

  const startMeter = (mediaStream) => {
    stopMeter();
    if (mediaStream.getAudioTracks().length === 0) return;
    const context = new (window.AudioContext || window.webkitAudioContext)();
    context.resume().catch(() => {});
    const analyser = context.createAnalyser();
    analyser.fftSize = 1024;
    context.createMediaStreamSource(mediaStream).connect(analyser);
    const samples = new Float32Array(analyser.fftSize);
    const tick = () => {
      analyser.getFloatTimeDomainData(samples);
      let peak = 0;
      for (const s of samples) peak = Math.max(peak, Math.abs(s));
      setLevel(peak);
      meterRef.current.frame = requestAnimationFrame(tick);
    };
    meterRef.current = { context, frame: 0 };
    meterRef.current.frame = requestAnimationFrame(tick);
  };

  const releaseStream = () => {
    stopMeter();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
  };

  const refreshDevices = async () => {
    const all = await navigator.mediaDevices.enumerateDevices();
    const videoList = all.filter((d) => d.kind === 'videoinput');
    const audioList = all.filter((d) => d.kind === 'audioinput');
    setCameras(videoList);
    setAudioInputs(audioList);
    return { videoList, audioList };
  };

  // Opens the camera + audio input and starts the preview. Pass IDs to switch devices.
  const startPreview = useCallback(async (nextCameraId = cameraId, nextAudioInputId = audioInputId) => {
    if (recorderRef.current) return;
    const generation = ++openGenerationRef.current;
    setError(null);
    releaseStream();

    const saved = loadSavedDevices();
    // Before the first permission grant, labels are hidden; enumerate anyway to match saved IDs
    const { videoList, audioList } = await refreshDevices();
    const camera = resolveDevice(videoList, nextCameraId, nextCameraId === saved.cameraId ? saved.cameraLabel : null);
    const audioInput = resolveDevice(audioList, nextAudioInputId, nextAudioInputId === saved.audioInputId ? saved.audioInputLabel : null);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          ...(camera && { deviceId: { exact: camera.deviceId } }),
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        // Leave the signal untouched and in stereo so a Loopback/DAW mix comes through as-is
        audio: {
          ...(audioInput && { deviceId: { exact: audioInput.deviceId } }),
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: { ideal: 2 },
          sampleRate: { ideal: 48000 },
        },
      });
      if (generation !== openGenerationRef.current) {
        mediaStream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = mediaStream;
      setStream(mediaStream);
      startMeter(mediaStream);

      // Labels are available now, so remember what was actually opened
      await refreshDevices();
      const videoTrack = mediaStream.getVideoTracks()[0];
      const audioTrack = mediaStream.getAudioTracks()[0];
      const openedCameraId = videoTrack?.getSettings().deviceId || '';
      const openedAudioId = audioTrack?.getSettings().deviceId || '';
      setCameraId(openedCameraId);
      setAudioInputId(openedAudioId);
      saveDevices({
        cameraId: openedCameraId,
        cameraLabel: videoTrack?.label || '',
        audioInputId: openedAudioId,
        audioInputLabel: audioTrack?.label || '',
      });
    } catch (err) {
      if (generation !== openGenerationRef.current) return;
      console.error('Error opening camera:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera or microphone access was denied. Enable Chops in System Settings > Privacy & Security > Camera and Microphone.');
      } else if (err.name === 'NotFoundError' || err.name === 'OverconstrainedError') {
        setError('The selected camera or audio input is not available. Pick another device.');
      } else {
        setError(`Could not open the camera: ${err.message}`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraId, audioInputId]);

  const startRecording = useCallback(async () => {
    const mediaStream = streamRef.current;
    if (!mediaStream || recorderRef.current) return;
    setError(null);

    const requestedType = getSupportedMimeType();
    let recorder;
    try {
      recorder = new MediaRecorder(mediaStream, {
        ...(requestedType && { mimeType: requestedType }),
        videoBitsPerSecond: 10_000_000,
        audioBitsPerSecond: 256_000,
      });
    } catch (err) {
      setError(`Could not start recording: ${err.message}`);
      return;
    }

    const mimeType = recorder.mimeType || requestedType || 'video/mp4';
    let filePath;
    try {
      filePath = await createVideoFile(mimeType);
    } catch (err) {
      console.error('Error creating video file:', err);
      setError(`Could not create the video file: ${err.message || err}. Check the video folder in Settings.`);
      return;
    }

    takeRef.current = { filePath, mimeType, segmentStart: Date.now(), recordedMs: 0, size: 0 };
    writeErrorRef.current = null;
    writeChainRef.current = Promise.resolve();

    // Stream each chunk to disk so long takes don't pile up in memory
    recorder.ondataavailable = (e) => {
      if (e.data.size === 0) return;
      takeRef.current.size += e.data.size;
      writeChainRef.current = writeChainRef.current
        .then(() => appendToVideoFile(filePath, e.data))
        .catch((err) => {
          console.error('Error writing video chunk:', err);
          writeErrorRef.current = err;
        });
    };
    recorder.onerror = (e) => {
      console.error('MediaRecorder error:', e.error);
      setError(`Recording error: ${e.error?.message || 'unknown error'}`);
    };

    recorderRef.current = recorder;
    recorder.start(1000);
    setIsRecording(true);
    setIsPaused(false);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(takeElapsed()), 200);
  }, []);

  const pauseRecording = useCallback(() => {
    const recorder = recorderRef.current;
    const take = takeRef.current;
    if (!recorder || recorder.state !== 'recording') return;
    recorder.pause();
    take.recordedMs = takeElapsed();
    take.segmentStart = null;
    setElapsed(take.recordedMs);
    setIsPaused(true);
  }, []);

  const resumeRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== 'paused') return;
    recorder.resume();
    takeRef.current.segmentStart = Date.now();
    setIsPaused(false);
  }, []);

  // Resolves once every chunk is on disk
  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder) return Promise.resolve(null);

    return new Promise((resolve) => {
      const duration = Math.round(takeElapsed() / 1000);
      clearInterval(timerRef.current);
      recorder.onstop = async () => {
        await writeChainRef.current;
        recorderRef.current = null;
        setIsRecording(false);
        setIsPaused(false);
        const take = takeRef.current;
        takeRef.current = null;
        resolve({
          filePath: take.filePath,
          mimeType: take.mimeType,
          duration,
          size: take.size,
          writeError: writeErrorRef.current,
        });
      };
      recorder.stop();
    });
  }, []);

  const selectCamera = useCallback((id) => {
    setCameraId(id);
    startPreview(id, audioInputId);
  }, [startPreview, audioInputId]);

  const selectAudioInput = useCallback((id) => {
    setAudioInputId(id);
    startPreview(cameraId, id);
  }, [startPreview, cameraId]);

  const close = useCallback(() => {
    openGenerationRef.current++;
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    clearInterval(timerRef.current);
    setIsRecording(false);
    setIsPaused(false);
    releaseStream();
    // releaseStream only touches refs and state setters, so the first one is always valid
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => close, [close]);

  return {
    cameras,
    audioInputs,
    cameraId,
    audioInputId,
    stream,
    error,
    isRecording,
    isPaused,
    elapsed,
    level,
    startPreview,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    selectCamera,
    selectAudioInput,
    close,
  };
}
