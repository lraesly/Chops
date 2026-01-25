import { useState, useRef, useCallback, useEffect } from 'react';

export function useMetronome() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef(null);
  const nextNoteTimeRef = useRef(0);
  const timerIdRef = useRef(null);
  const isPlayingRef = useRef(false); // Track playing state for device change handler

  // Create or recreate the AudioContext
  const ensureAudioContext = useCallback(() => {
    if (audioContextRef.current) {
      // Close existing context if it exists
      try {
        audioContextRef.current.close();
      } catch (e) {
        // Ignore errors when closing
      }
    }
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    return audioContextRef.current;
  }, []);

  const createClick = useCallback(() => {
    if (!audioContextRef.current) {
      ensureAudioContext();
    }
    const ctx = audioContextRef.current;

    // Check if context is in a bad state and recreate if needed
    if (ctx.state === 'closed') {
      ensureAudioContext();
    }

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
  }, [ensureAudioContext]);

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
      ensureAudioContext();
    }

    // Recreate context if it was closed
    if (audioContextRef.current.state === 'closed') {
      ensureAudioContext();
    }

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    nextNoteTimeRef.current = audioContextRef.current.currentTime;
    scheduler();
    setIsPlaying(true);
    isPlayingRef.current = true;
  }, [scheduler, ensureAudioContext]);

  const stop = useCallback(() => {
    if (timerIdRef.current) {
      clearTimeout(timerIdRef.current);
      timerIdRef.current = null;
    }
    setIsPlaying(false);
    isPlayingRef.current = false;
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) {
      stop();
    } else {
      start();
    }
  }, [isPlaying, start, stop]);

  // Handle audio device changes (e.g., switching speakers, connecting Bluetooth)
  useEffect(() => {
    const handleDeviceChange = () => {
      if (isPlayingRef.current) {
        // Stop current playback
        if (timerIdRef.current) {
          clearTimeout(timerIdRef.current);
          timerIdRef.current = null;
        }
        // Recreate audio context for new device
        ensureAudioContext();
        // Resume playback with new context
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
        }
        nextNoteTimeRef.current = audioContextRef.current.currentTime;
        scheduler();
      }
    };

    // Listen for device changes
    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    }

    return () => {
      if (timerIdRef.current) {
        clearTimeout(timerIdRef.current);
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (e) {
          // Ignore errors when closing
        }
      }
      if (navigator.mediaDevices && navigator.mediaDevices.removeEventListener) {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      }
    };
  }, [ensureAudioContext, scheduler]);

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
