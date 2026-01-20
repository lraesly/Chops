import { useState, useRef, useCallback, useEffect } from 'react';

export function useMetronome() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef(null);
  const nextNoteTimeRef = useRef(0);
  const timerIdRef = useRef(null);

  const createClick = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioContextRef.current;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = 1000;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  }, []);

  const scheduler = useCallback(() => {
    if (!audioContextRef.current) return;

    const secondsPerBeat = 60.0 / bpm;

    while (nextNoteTimeRef.current < audioContextRef.current.currentTime + 0.1) {
      createClick();
      nextNoteTimeRef.current += secondsPerBeat;
    }

    timerIdRef.current = setTimeout(scheduler, 25);
  }, [bpm, createClick]);

  const start = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    nextNoteTimeRef.current = audioContextRef.current.currentTime;
    scheduler();
    setIsPlaying(true);
  }, [scheduler]);

  const stop = useCallback(() => {
    if (timerIdRef.current) {
      clearTimeout(timerIdRef.current);
      timerIdRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) {
      stop();
    } else {
      start();
    }
  }, [isPlaying, start, stop]);

  useEffect(() => {
    return () => {
      if (timerIdRef.current) {
        clearTimeout(timerIdRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      stop();
      start();
    }
  }, [bpm]);

  return {
    bpm,
    setBpm,
    isPlaying,
    start,
    stop,
    toggle,
  };
}
