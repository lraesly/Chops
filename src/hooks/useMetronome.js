import { useState, useRef, useCallback, useEffect } from 'react';

export function useMetronome() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef(null);
  const nextNoteTimeRef = useRef(0);
  const timerIdRef = useRef(null);
  const isPlayingRef = useRef(false); // Track playing state for device change handler
  const schedulerRef = useRef(null); // Track current scheduler for device change handler

  // Create or recreate the AudioContext
  const ensureAudioContext = useCallback(() => {
    if (audioContextRef.current) {
      // Remove old listener and close
      audioContextRef.current.onstatechange = null;
      try {
        audioContextRef.current.close();
      } catch (e) {
        // Ignore errors when closing
      }
    }
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    // Auto-resume if the OS/WebView suspends the context while we're playing
    ctx.onstatechange = () => {
      if (ctx.state === 'suspended' && isPlayingRef.current) {
        ctx.resume();
      }
    };
    audioContextRef.current = ctx;
    return ctx;
  }, []);

  const createClick = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      ensureAudioContext();
    }

    const ctx = audioContextRef.current;

    // Resume if suspended (OS/WebView can suspend AudioContext at any time)
    if (ctx.state === 'suspended') {
      ctx.resume();
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

  // Keep schedulerRef updated so device change handler always uses latest scheduler
  schedulerRef.current = scheduler;

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

  // Handle audio device changes and app visibility changes
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
        schedulerRef.current();
      }
    };

    // When app regains focus, ensure AudioContext is running
    const handleVisibilityChange = () => {
      if (!document.hidden && isPlayingRef.current && audioContextRef.current) {
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
        }
        // If context was closed/interrupted, restart playback entirely
        if (audioContextRef.current.state === 'closed') {
          ensureAudioContext();
          if (timerIdRef.current) {
            clearTimeout(timerIdRef.current);
            timerIdRef.current = null;
          }
          nextNoteTimeRef.current = audioContextRef.current.currentTime;
          schedulerRef.current();
        }
      }
    };

    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timerIdRef.current) {
        clearTimeout(timerIdRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.onstatechange = null;
        try {
          audioContextRef.current.close();
        } catch (e) {
          // Ignore errors when closing
        }
      }
      if (navigator.mediaDevices && navigator.mediaDevices.removeEventListener) {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [ensureAudioContext]);

  // Restart metronome when BPM changes (if currently playing)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isPlaying) {
      stop();
      start();
    }
  }, [bpm]); // Intentionally only depends on bpm - we want to restart only when tempo changes

  return {
    bpm,
    setBpm,
    isPlaying,
    start,
    stop,
    toggle,
  };
}
