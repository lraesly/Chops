import { useState, useRef, useCallback } from 'react';

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
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = useCallback(async () => {
    try {
      // Disable voice processing for better music quality
      // Using 'exact' to force browser to honor these settings
      const audioConstraints = {
        audio: {
          echoCancellation: { exact: false },
          noiseSuppression: { exact: false },
          autoGainControl: { exact: false },
          sampleRate: { ideal: 96000 },
          channelCount: { ideal: 2 },
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);

      // Log actual settings for debugging
      const track = stream.getAudioTracks()[0];
      const settings = track.getSettings();
      console.log('Audio track settings:', settings);
      console.log('Audio constraints supported:', track.getCapabilities?.() || 'N/A');

      const supportedMimeType = getSupportedMimeType();
      console.log('Using MIME type:', supportedMimeType);

      const options = {
        ...(supportedMimeType && { mimeType: supportedMimeType }),
        audioBitsPerSecond: 320000, // 320 kbps for better quality
      };
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      console.log('MediaRecorder audioBitsPerSecond:', mediaRecorderRef.current.audioBitsPerSecond);

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

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start(1000);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
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
