import { useState, useRef, useCallback, useEffect } from 'react';
import { encodeWav } from '../constants/wav';

const MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
  'audio/ogg',
  'audio/wav',
];

// A take whose quieter channel is this far below the louder one (-40 dB) came from a
// one-sided source, such as an interface with the guitar on input 1 only
const ONE_SIDED_RATIO = 0.01;

// Recording goes straight from the mic to MediaRecorder: routing it through Web Audio
// to mix down to mono caused brief dropouts, because Web Audio runs on the output
// device's clock. Instead, a take with sound on only one side is turned into a
// centered mono WAV after recording; everything else keeps the original file.
export async function centerOneSidedTake(blob) {
  // Decode at 48 kHz, the rate recordings are made at, so nothing is resampled
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  let context;
  try {
    context = new AudioCtx({ sampleRate: 48000 });
  } catch {
    context = new AudioCtx();
  }
  try {
    const buffer = await context.decodeAudioData(await blob.arrayBuffer());
    if (buffer.numberOfChannels < 2) return null;
    const rms = (data) => {
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
      return Math.sqrt(sum / data.length);
    };
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    const [l, r] = [rms(left), rms(right)];
    const louder = Math.max(l, r);
    if (louder === 0 || Math.min(l, r) / louder > ONE_SIDED_RATIO) return null;
    return encodeWav([l >= r ? left : right], buffer.sampleRate);
  } catch (error) {
    console.error('Could not check the take for one-sided audio:', error);
    return null;
  } finally {
    context.close().catch(() => {});
  }
}

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

  const startRecording = useCallback(async () => {
    // If permission was denied, show specific message
    if (permissionState === 'denied') {
      alert('Microphone access was denied. Please enable it in System Settings > Privacy & Security > Microphone.');
      return;
    }

    try {
      const audioConstraints = {
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: { ideal: 48000 },
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
      streamRef.current = stream;

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
        const centered = await centerOneSidedTake(recorded);
        const blob = centered || recorded;
        setMimeType(centered ? 'audio/wav' : actualMimeType);
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };

      mediaRecorderRef.current.start(1000);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        alert('Microphone access was denied. Please enable it in System Settings > Privacy & Security > Microphone.');
      } else if (error.name === 'NotFoundError') {
        alert('No microphone found. Please connect a microphone and try again.');
      } else {
        alert('Could not access microphone: ' + error.message);
      }
    }
  }, [permissionState]);

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
