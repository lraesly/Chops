import { useState, useRef, useCallback, useEffect } from 'react';
import { takeToWav } from './takeToWav';
import { loadSavedDevices, saveDevices, resolveSavedAudioInput, listAudioInputs } from './mediaDevices';

const MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
  'audio/ogg',
  'audio/wav',
];

function getSupportedMimeType() {
  for (const mimeType of MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }
  return '';
}

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [mimeType, setMimeType] = useState(null);
  const [permissionState, setPermissionState] = useState('prompt');
  const [audioInputs, setAudioInputs] = useState([]);
  const [audioInputId, setAudioInputId] = useState(() => loadSavedDevices().audioInputId || '');
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  // Check and monitor microphone permission status
  useEffect(() => {
    let permissionStatus = null;

    const checkPermission = async () => {
      try {
        permissionStatus = await navigator.permissions.query({ name: 'microphone' });
        setPermissionState(permissionStatus.state);

        permissionStatus.onchange = () => {
          setPermissionState(permissionStatus.state);
        };
      } catch {
        // Permissions API not supported, assume we need to request
        console.log('Permissions API not available, will request on first use');
      }
    };

    checkPermission();

    return () => {
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, []);

  // Lists the audio inputs for the picker. Before the first permission grant the labels
  // are hidden, so open the default mic once to get them; a list of blank entries is no
  // use for choosing a device. The stream is closed again straight away.
  const refreshAudioInputs = useCallback(async () => {
    let list = await listAudioInputs();
    if (list.length > 0 && list.every((d) => !d.label)) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        list = await listAudioInputs();
      } catch {
        // Denied or no device: the picker shows what it can
      }
    }
    setAudioInputs(list);
    return list;
  }, []);

  // The choice takes effect on the next take; a recording in progress keeps its input
  const selectAudioInput = useCallback((id) => {
    setAudioInputId(id);
    const device = audioInputs.find((d) => d.deviceId === id);
    saveDevices({ audioInputId: id, audioInputLabel: device?.label || '' });
  }, [audioInputs]);

  const startRecording = useCallback(async () => {
    // If permission was denied, show specific message
    if (permissionState === 'denied') {
      alert('Microphone access was denied. Please enable it in System Settings > Privacy & Security > Microphone.');
      return;
    }

    try {
      // A saved input that is gone (unplugged, ID changed) falls back to the default mic
      const audioInput = resolveSavedAudioInput(await listAudioInputs(), audioInputId);
      // Leave the signal untouched so a Loopback/DAW mix comes through as-is
      const audioConstraints = {
        audio: {
          ...(audioInput && { deviceId: { exact: audioInput.deviceId } }),
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: { ideal: 48000 },
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
      streamRef.current = stream;

      // Labels are available now, so remember what was actually opened
      const track = stream.getAudioTracks()[0];
      const openedId = track?.getSettings().deviceId || '';
      if (openedId) {
        setAudioInputId(openedId);
        saveDevices({ audioInputId: openedId, audioInputLabel: track.label || '' });
      }
      listAudioInputs().then(setAudioInputs).catch(() => {});

      const supportedMimeType = getSupportedMimeType();

      const options = {
        ...(supportedMimeType && { mimeType: supportedMimeType }),
        audioBitsPerSecond: 320000, // 320 kbps for better quality
      };
      mediaRecorderRef.current = new MediaRecorder(stream, options);

      const actualMimeType = mediaRecorderRef.current.mimeType || 'audio/webm';
      setMimeType(actualMimeType);

      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const recorded = new Blob(chunksRef.current, { type: actualMimeType });
        // Takes are kept as WAV; if the decode fails the compressed take is kept rather
        // than losing the performance
        let blob = recorded;
        let type = actualMimeType;
        try {
          const wav = await takeToWav(recorded);
          blob = new Blob([wav.bytes], { type: wav.mimeType });
          type = wav.mimeType;
        } catch (error) {
          console.error('Could not convert the take to WAV, keeping the original:', error);
        }
        setMimeType(type);
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };

      mediaRecorderRef.current.start(1000);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        alert('Microphone access was denied. Please enable it in System Settings > Privacy & Security > Microphone.');
      } else if (error.name === 'NotFoundError' || error.name === 'OverconstrainedError') {
        alert('The selected audio input is not available. Pick another input and try again.');
      } else {
        alert('Could not access microphone: ' + error.message);
      }
    }
  }, [permissionState, audioInputId]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    // Clean up original stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  }, [isRecording]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const clearRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setMimeType(null);
  }, [audioUrl]);

  return {
    isRecording,
    audioBlob,
    audioUrl,
    mimeType,
    permissionState,
    audioInputs,
    audioInputId,
    refreshAudioInputs,
    selectAudioInput,
    startRecording,
    stopRecording,
    toggleRecording,
    clearRecording,
  };
}

export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function base64ToBlob(base64, mimeType = 'audio/webm') {
  try {
    const parts = base64.split(',');
    const detectedMimeType = parts[0].match(/:(.*?);/)?.[1] || mimeType;
    const byteCharacters = atob(parts[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: detectedMimeType });
  } catch (error) {
    console.error('Error converting base64 to blob:', error);
    return null;
  }
}
