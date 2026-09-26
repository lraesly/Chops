import { useState, useRef, useEffect } from 'react';
import { loadRecordingUrl } from './audioStorage';

// Play/pause for a list of audio recordings. File-backed recordings are only
// read from disk the first time they're played.
export function useRecordingPlayer() {
  const [playingId, setPlayingId] = useState(null);
  const audioRefs = useRef({});
  const objectUrls = useRef([]);

  useEffect(() => () => objectUrls.current.forEach((url) => URL.revokeObjectURL(url)), []);

  const toggle = async (recording) => {
    const el = audioRefs.current[recording.id];
    if (!el) return;
    if (playingId === recording.id) {
      el.pause();
      setPlayingId(null);
      return;
    }
    if (playingId) audioRefs.current[playingId]?.pause();

    try {
      if (!el.getAttribute('src')) {
        const url = await loadRecordingUrl(recording);
        if (url !== recording.audio) objectUrls.current.push(url);
        el.src = url;
      }
      setPlayingId(recording.id);
      await el.play();
    } catch (error) {
      if (error.name === 'AbortError') return; // paused before playback started
      console.error('Error playing recording:', error);
      setPlayingId(null);
      alert(`Could not play "${recording.name}". The audio file may have been moved or deleted.`);
    }
  };

  const register = (id) => (el) => {
    audioRefs.current[id] = el;
  };

  return { playingId, toggle, register, onEnded: () => setPlayingId(null) };
}
