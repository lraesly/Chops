import { useState, useRef, useCallback, useEffect } from 'react';

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
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);

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
      } catch (error) {
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

      // Use AudioContext to explicitly mix to mono
      // This ensures centered playback regardless of source channel configuration
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);

      // Create a mono destination (1 channel)
      const destination = audioContext.createMediaStreamDestination();

      // Create a channel merger to mix all input channels to mono
      // We'll use a gain node connected to a single-channel destination
      const splitter = audioContext.createChannelSplitter(2);
      const merger = audioContext.createChannelMerger(1);

      source.connect(splitter);
      // Mix both channels (or just left if mono) into a single output
      splitter.connect(merger, 0, 0); // Left channel to output
      splitter.connect(merger, 1, 0); // Right channel to same output (mixes)
      merger.connect(destination);

      // Use the mono stream for recording
      const monoStream = destination.stream;

      const supportedMimeType = getSupportedMimeType();

      const options = {
        ...(supportedMimeType && { mimeType: supportedMimeType }),
        audioBitsPerSecond: 320000, // 320 kbps for better quality
      };
      mediaRecorderRef.current = new MediaRecorder(monoStream, options);

      const actualMimeType = mediaRecorderRef.current.mimeType || 'audio/webm';
      setMimeType(actualMimeType);

      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: actualMimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));

        // Clean up
        stream.getTracks().forEach(track => track.stop());
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
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
