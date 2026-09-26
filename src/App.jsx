import { useState, useRef, useEffect, useMemo } from 'react';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { message } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { ChopsIcon } from './components/ChopsIcon';
import { useFileStorage, useStorageSetup, flushWrites } from './hooks/useFileStorage';
import { migrateEmbeddedAudio, applyMigratedPaths, hasEmbeddedAudio } from './hooks/audioStorage';
import { trashFile } from './hooks/videoStorage';
import { readTodoInbox, clearTodoInboxFiles, isWebLink } from './hooks/todoInbox';
import { useKeyboardShortcuts, useSpacebarToggle } from './hooks/useKeyboardShortcuts';
import { useMetronome } from './hooks/useMetronome';
import { Navigation } from './components/Navigation';
import { PracticeItemsModal } from './components/PracticeItemsModal';
import { PracticeSession } from './components/PracticeSession';
import { History } from './components/History';
import { Stats } from './components/Stats';
import { ItemsManager } from './components/ItemsManager';
import { TodoList } from './components/TodoList';
import { Templates } from './components/Templates';
import { ThemeToggle } from './components/ThemeToggle';
import { StorageSetup } from './components/StorageSetup';
import { Settings } from './components/Settings';
import { WelcomeModal } from './components/WelcomeModal';
import { HelpModal } from './components/HelpModal';
import { useToast } from './components/Toast';

function App() {
  const { isConfigured, isLoading, setupStorage, chooseFolder, resetStorage, isTauri } = useStorageSetup();

  // Show storage setup for Tauri if not configured
  if (isTauri && !isLoading && !isConfigured) {
    return <StorageSetup onSetup={setupStorage} onChooseFolder={chooseFolder} />;
  }

  // Show loading state until storage path is confirmed
  // This ensures useFileStorage hooks in AppContent only mount
  // after the storage path is available in localStorage
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your practice data...</p>
        </div>
      </div>
    );
  }

  return <AppContent isTauri={isTauri} resetStorage={resetStorage} />;
}

function AppContent({ isTauri, resetStorage }) {
  const { addToast } = useToast();

  const [currentView, setCurrentView] = useState('practice');
  const [practiceItems, setPracticeItems, itemsLoaded] = useFileStorage('practiceItems', []);
  const [archivedItems, setArchivedItems] = useFileStorage('archivedItems', []);
  const [sessionItems, setSessionItems, sessionItemsLoaded] = useFileStorage('sessionQueue', []);
  const [sessions, setSessions, sessionsLoaded] = useFileStorage('practiceSessions', []);
  const [recordings, setRecordings, recordingsLoaded] = useFileStorage('sessionRecordings', []);
  const [sessionNotes, setSessionNotes, sessionNotesLoaded] = useFileStorage('sessionNotes', '');
  const [sessionTotalTime, setSessionTotalTime] = useFileStorage('sessionTotalTime', 0);
  const [userTags, setUserTags] = useFileStorage('userTags', []);
  const [todoItems, setTodoItems, todosLoaded] = useFileStorage('todoItems', []);
  const [archivedTodoItems, setArchivedTodoItems, archivedTodosLoaded] = useFileStorage('archivedTodoItems', []);
  const [practiceTemplates, setPracticeTemplates] = useFileStorage('practiceTemplates', []);
  const [colorTheme, setColorTheme] = useFileStorage('colorTheme', 'violet');
  const [hasSeenWelcome, setHasSeenWelcome] = useFileStorage('hasSeenWelcome', false);
  const [isItemsModalOpen, setIsItemsModalOpen] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const practiceSessionRef = useRef(null);

  // Metronome state (lifted to App for keyboard shortcut access)
  const metronome = useMetronome();

  // Listen for menu events from Tauri. Registered once: re-registering on every render
  // could leave an old listener behind (listen() is async), so actions such as Quit
  // ran twice. Current view and metronome are read through a ref instead.
  const menuStateRef = useRef({ currentView, metronome });
  useEffect(() => {
    menuStateRef.current = { currentView, metronome };
  });
  useEffect(() => {
    let unlisten;
    let cancelled = false;
    listen('menu-action', async (event) => {
      const action = event.payload;
      const { currentView: view, metronome: met } = menuStateRef.current;
      if (action === 'quit') {
        if (await prepareToQuitRef.current()) {
          await invoke('quit_app');
        }
      } else if (action === 'help_shortcuts') {
        setShowHelpModal(true);
      } else if (action === 'metronome_toggle' && view === 'practice') {
        practiceSessionRef.current?.toggleMetronomePopup?.();
      } else if (action === 'metronome_play' && view === 'practice') {
        met.toggle();
      } else if (action === 'metronome_tempo_down' && view === 'practice') {
        const presets = [80, 100, 120, 140, 160, 180];
        const prevPreset = [...presets].reverse().find(p => p < met.bpm);
        if (prevPreset) met.setBpm(prevPreset);
      } else if (action === 'metronome_tempo_up' && view === 'practice') {
        const presets = [80, 100, 120, 140, 160, 180];
        const nextPreset = presets.find(p => p > met.bpm);
        if (nextPreset) met.setBpm(nextPreset);
      }
    }).then((unlistenFn) => {
      if (cancelled) unlistenFn();
      else unlisten = unlistenFn;
    });

    return () => {
      cancelled = true;
      if (unlisten) unlisten();
    };
  }, []);

  // Before the window closes or the app quits (⌘Q): offer to save a session that has
  // something to save. Just quitting keeps the session (queue, times, notes and
  // recordings are restored next launch), so the latest timer values are stored
  // either way, and pending writes are flushed so nothing is cut off.
  const SAVE_AND_QUIT = 'Save & Quit';
  const JUST_QUIT = 'Just Quit';
  const prepareToQuit = async () => {
    const session = practiceSessionRef.current;
    if (session?.canSave) {
      const choice = await message(
        'Save this practice session to History before quitting?\n\nIf you just quit, Chops keeps the session and you can pick up where you left off.',
        {
          title: 'Unsaved Practice Session',
          kind: 'warning',
          buttons: { yes: SAVE_AND_QUIT, no: JUST_QUIT, cancel: 'Cancel' },
        }
      );
      if (choice !== SAVE_AND_QUIT && choice !== 'Yes' && choice !== JUST_QUIT && choice !== 'No') {
        return false; // Cancel or Esc
      }
      try {
        if (choice === SAVE_AND_QUIT || choice === 'Yes') {
          // Shows the usual Session Saved summary; quit once it's dismissed
          await session.saveSessionAndWait();
        } else {
          session.persistProgress();
        }
      } catch (err) {
        console.error('Could not store the session before quitting:', err);
      }
    } else {
      try {
        session?.persistProgress();
      } catch (err) {
        console.error('Could not store session progress before quitting:', err);
      }
    }
    // Let React commit the state changes and queue their writes, then write them now.
    // Never let a failed or slow write stop the app from quitting.
    await new Promise((resolve) => setTimeout(resolve, 200));
    try {
      await Promise.race([flushWrites(), new Promise((resolve) => setTimeout(resolve, 5000))]);
    } catch (err) {
      console.error('Could not flush writes before quitting:', err);
    }
    return true;
  };
  const prepareToQuitRef = useRef(prepareToQuit);
  useEffect(() => {
    prepareToQuitRef.current = prepareToQuit;
  });

  useEffect(() => {
    let unlistenClose;
    let cancelled = false;

    const setupCloseHandler = async () => {
      try {
        const appWindow = getCurrentWindow();
        const unlisten = await appWindow.onCloseRequested(async (event) => {
          event.preventDefault();
          if (await prepareToQuitRef.current()) {
            // Quit through our own command: the window API needs a destroy permission
            // this app doesn't grant, so appWindow.destroy() silently did nothing
            await invoke('quit_app');
          }
        });
        if (cancelled) unlisten();
        else unlistenClose = unlisten;
      } catch (e) {
        // Not running in Tauri, ignore
        console.log('Close handler not available:', e);
      }
    };

    setupCloseHandler();

    return () => {
      cancelled = true;
      if (unlistenClose) unlistenClose();
    };
  }, []);

  // Show welcome modal for new users (no items, no sessions, hasn't dismissed)
  const showWelcome = !hasSeenWelcome && practiceItems.length === 0 && sessions.length === 0;

  // Apply color theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', colorTheme);
  }, [colorTheme]);

  // Spacebar shortcut to toggle timer (only on Practice view)
  useSpacebarToggle(
    () => {
      practiceSessionRef.current?.toggleTimer();
    },
    currentView === 'practice'
  );

  // Tempo presets for metronome keyboard shortcuts
  const tempoPresets = [80, 100, 120, 140, 160, 180];

  // Helper function to snap tempo to nearest preset in a direction
  const adjustTempoToPreset = (direction) => {
    const currentBpm = metronome.bpm;
    if (direction > 0) {
      // Find next higher preset
      const nextPreset = tempoPresets.find(p => p > currentBpm);
      if (nextPreset) {
        metronome.setBpm(nextPreset);
      }
    } else {
      // Find next lower preset
      const prevPreset = [...tempoPresets].reverse().find(p => p < currentBpm);
      if (prevPreset) {
        metronome.setBpm(prevPreset);
      }
    }
  };

  // Keyboard shortcuts for navigation and actions
  const shortcuts = useMemo(() => [
    // View switching: Cmd/Ctrl + 1-6 and comma
    { key: '1', ctrl: true, handler: () => setCurrentView('practice') },
    { key: '2', ctrl: true, handler: () => setCurrentView('items') },
    { key: '3', ctrl: true, handler: () => setCurrentView('todos') },
    { key: '4', ctrl: true, handler: () => setCurrentView('templates') },
    { key: '5', ctrl: true, handler: () => setCurrentView('history') },
    { key: '6', ctrl: true, handler: () => setCurrentView('stats') },
    { key: ',', ctrl: true, handler: () => setCurrentView('settings') },
    // Save session: Cmd/Ctrl + S (only when in practice view and can save)
    {
      key: 's',
      ctrl: true,
      handler: () => {
        if (currentView === 'practice' && practiceSessionRef.current?.canSave) {
          practiceSessionRef.current.saveSession();
        }
      },
    },
    // Metronome popup toggle: M (only when in practice view)
    {
      key: 'm',
      handler: () => {
        if (currentView === 'practice') {
          practiceSessionRef.current?.toggleMetronomePopup?.();
        }
      },
    },
    // Metronome play/stop: K (only when in practice view)
    {
      key: 'k',
      handler: () => {
        if (currentView === 'practice') {
          metronome.toggle();
        }
      },
    },
    // Metronome tempo down: [ (only when in practice view)
    {
      key: '[',
      handler: () => {
        if (currentView === 'practice') {
          adjustTempoToPreset(-1);
        }
      },
    },
    // Metronome tempo up: ] (only when in practice view)
    {
      key: ']',
      handler: () => {
        if (currentView === 'practice') {
          adjustTempoToPreset(1);
        }
      },
    },
    // Recording toggle: R (only when in practice view)
    {
      key: 'r',
      handler: () => {
        if (currentView === 'practice') {
          practiceSessionRef.current?.toggleRecording?.();
        }
      },
    },
    // Video recorder: V (only when in practice view)
    {
      key: 'v',
      handler: () => {
        if (currentView === 'practice') {
          practiceSessionRef.current?.openVideoRecorder?.();
        }
      },
    },
    // Help modal: ? key
    {
      key: '?',
      handler: () => {
        setShowHelpModal(true);
      },
    },
    // adjustTempoToPreset is rebuilt every render but only reads `metronome`, which is listed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [currentView, metronome]);

  useKeyboardShortcuts(shortcuts);

  // One-time move of audio that older versions stored inline in the data file
  // (as base64) out to separate files, which keeps the data file small.
  const audioMigrationStartedRef = useRef(false);
  const allDataLoaded = itemsLoaded && sessionsLoaded && sessionItemsLoaded && recordingsLoaded && sessionNotesLoaded;
  useEffect(() => {
    if (!isTauri || !allDataLoaded || audioMigrationStartedRef.current) return;
    const embedded = [
      ...recordings,
      ...sessions.flatMap((session) => session.recordings || []),
    ].filter(hasEmbeddedAudio);
    if (embedded.length === 0) return;
    audioMigrationStartedRef.current = true;

    (async () => {
      try {
        const { paths, failures } = await migrateEmbeddedAudio(embedded);
        if (Object.keys(paths).length > 0) {
          setSessions((prev) => prev.map((session) =>
            session.recordings?.some(hasEmbeddedAudio)
              ? { ...session, recordings: session.recordings.map((r) => applyMigratedPaths(r, paths)) }
              : session
          ));
          setRecordings((prev) => prev.map((r) => applyMigratedPaths(r, paths)));
          addToast(`Moved ${Object.keys(paths).length} audio recordings out of the data file into "Audio Recordings"`);
        }
        if (failures.length > 0) {
          addToast(`${failures.length} audio recordings could not be moved and were left as they were`, 'error');
        }
      } catch (err) {
        console.error('Audio migration failed; recordings left in the data file:', err);
        addToast('Could not move audio recordings to files; nothing was changed', 'error');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTauri, allDataLoaded]);

  // Pick up to-dos that other tools dropped in the "To Do Inbox" folder (see
  // todoInbox.js): on launch and whenever the window regains focus. Inbox files go
  // to the Trash only after the imported to-dos have been written to the data file.
  const todoListsRef = useRef({ todoItems, archivedTodoItems });
  useEffect(() => {
    todoListsRef.current = { todoItems, archivedTodoItems };
  });
  const inboxBusyRef = useRef(false);
  const inboxFilesToClearRef = useRef([]);
  useEffect(() => {
    if (!isTauri || !todosLoaded || !archivedTodosLoaded) return;
    const checkInbox = async () => {
      if (inboxBusyRef.current) return;
      inboxBusyRef.current = true;
      let waitingForSave = false;
      try {
        const { todos, files } = await readTodoInbox();
        if (files.length === 0) return;
        // A to-do already in the active list gets its details refreshed (e.g. a new link);
        // one that's archived is left alone.
        const { todoItems: active, archivedTodoItems: archived } = todoListsRef.current;
        const activeIds = new Set(active.map((t) => t.id));
        const known = new Set([...active, ...archived].map((t) => t.id));
        const updates = new Map();
        const fresh = [];
        for (const todo of todos) {
          if (activeIds.has(todo.id)) updates.set(todo.id, todo);
          else if (!known.has(todo.id)) {
            known.add(todo.id);
            fresh.push(todo);
          }
        }
        if (fresh.length === 0 && updates.size === 0) {
          await clearTodoInboxFiles(files);
          return;
        }
        inboxFilesToClearRef.current = files;
        waitingForSave = true;
        setTodoItems((prev) => [
          ...prev.map((t) => {
            if (!updates.has(t.id)) return t;
            const { id, createdAt, ...details } = updates.get(t.id);
            return { id: t.id, name: details.name, createdAt: t.createdAt, ...details };
          }),
          ...fresh,
        ]);
        const changed = [...fresh, ...updates.values()];
        const sources = [...new Set(changed.map((t) => t.source).filter(Boolean))];
        const parts = [];
        if (fresh.length) parts.push(`Added ${fresh.length} to-do${fresh.length === 1 ? '' : 's'}`);
        if (updates.size) parts.push(`${fresh.length ? 'updated' : 'Updated'} ${updates.size}`);
        addToast(parts.join(', ') + (sources.length === 1 ? ` from ${sources[0]}` : ''));
      } catch (error) {
        console.error('Could not read the to-do inbox:', error);
      } finally {
        if (!waitingForSave) inboxBusyRef.current = false;
      }
    };
    checkInbox();
    window.addEventListener('focus', checkInbox);
    return () => window.removeEventListener('focus', checkInbox);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTauri, todosLoaded, archivedTodosLoaded]);
  useEffect(() => {
    const files = inboxFilesToClearRef.current;
    if (files.length === 0) return;
    inboxFilesToClearRef.current = [];
    (async () => {
      await flushWrites();
      await clearTodoInboxFiles(files);
      inboxBusyRef.current = false;
    })();
  }, [todoItems]);

  // Show loading state while file data loads
  if (isTauri && !allDataLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your practice data...</p>
        </div>
      </div>
    );
  }

  const handleAddTag = (newTag) => {
    if (!userTags.includes(newTag)) {
      setUserTags([...userTags, newTag]);
    }
  };

  const handleAddToSession = (item) => {
    // Use unique sessionInstanceId for each item added to queue
    const sessionInstanceId = `${item.id}-${Date.now()}`;
    setSessionItems([...sessionItems, { ...item, sessionInstanceId, itemTime: 0 }]);
    addToast(`Added "${item.name}" to session`);
  };

  // Trashes each file unless another session (or the current one) still uses it.
  // Older versions could copy the same recording into several sessions.
  const trashUnreferencedFiles = async (filePaths, remainingSessions, remainingRecordings) => {
    const stillUsed = new Set(
      [...remainingRecordings, ...remainingSessions.flatMap((s) => s.recordings || [])]
        .map((r) => r.filePath)
        .filter(Boolean)
    );
    let failed = 0;
    for (const filePath of new Set(filePaths)) {
      if (stillUsed.has(filePath)) continue;
      try {
        await trashFile(filePath);
      } catch (err) {
        console.error('Could not move file to the Trash:', filePath, err);
        failed++;
      }
    }
    if (failed > 0) {
      addToast(`${failed} recording file${failed === 1 ? '' : 's'} could not be moved to the Trash`, 'error');
    }
  };

  // Audio files are app-managed, so recordings that get dropped take their file
  // with them (to the Trash). Videos are the user's to manage and are left alone.
  const trashDroppedAudio = (dropped, remainingSessions, remainingRecordings) => {
    const files = dropped.filter((r) => r.type !== 'video' && r.filePath).map((r) => r.filePath);
    if (isTauri && files.length > 0) {
      trashUnreferencedFiles(files, remainingSessions, remainingRecordings);
    }
  };

  const handleRemoveFromSession = (index) => {
    // Also remove recordings for this session instance
    const removedItem = sessionItems[index];
    if (removedItem) {
      const remaining = recordings.filter(r => r.sessionInstanceId !== removedItem.sessionInstanceId);
      setRecordings(remaining);
      trashDroppedAudio(recordings.filter(r => r.sessionInstanceId === removedItem.sessionInstanceId), sessions, remaining);
    }
    setSessionItems(sessionItems.filter((_, i) => i !== index));
  };

  const handleRemoveFromSessionByItemId = (itemId) => {
    // Remove all instances of this item from the session
    const itemsToRemove = sessionItems.filter(si => si.id === itemId);
    const itemName = itemsToRemove[0]?.name || 'Item';
    const removedInstances = new Set(itemsToRemove.map(item => item.sessionInstanceId));
    const remaining = recordings.filter(r => !removedInstances.has(r.sessionInstanceId));
    setRecordings(remaining);
    trashDroppedAudio(recordings.filter(r => removedInstances.has(r.sessionInstanceId)), sessions, remaining);
    setSessionItems(prev => prev.filter(si => si.id !== itemId));
    addToast(`Removed "${itemName}" from session`);
  };

  const handleReorderSession = (newItems) => {
    setSessionItems(newItems);
  };

  const handleUpdateSessionItemTime = (index, time) => {
    setSessionItems(items =>
      items.map((item, i) => (i === index ? { ...item, itemTime: time } : item))
    );
  };

  const handleSaveSession = (session) => {
    setSessions([...sessions, session]);
    setSessionItems([]);
    setRecordings([]);
    setSessionNotes('');
    setSessionTotalTime(0);
  };

  const handleResetPracticeSession = () => {
    setSessionItems([]);
    setRecordings([]);
    setSessionNotes('');
    trashDroppedAudio(recordings, sessions, []);
    setSessionTotalTime(0);
  };

  // Deleting a session trashes its audio; videos stay in the user's video folder
  const handleDeleteSession = (sessionId) => {
    const session = sessions.find((s) => s.id === sessionId);
    const remaining = sessions.filter((s) => s.id !== sessionId);
    setSessions(remaining);
    trashDroppedAudio(session?.recordings || [], remaining, recordings);
  };

  const handleCopySessionToQueue = (session) => {
    // Find the actual practice items for each session item
    const itemsToAdd = session.items
      .map(sessionItem => {
        // First try to find in active items
        const activeItem = practiceItems.find(p => p.id === sessionItem.id);
        if (activeItem) return activeItem;
        // Fall back to archived items (user might want to practice archived items)
        const archivedItem = archivedItems.find(a => a.id === sessionItem.id);
        if (archivedItem) return archivedItem;
        // Item was deleted - create a basic item from session data
        return { id: sessionItem.id, name: sessionItem.name };
      })
      .filter(Boolean);

    // Add each item to the session queue
    const newSessionItems = itemsToAdd.map(item => ({
      ...item,
      sessionInstanceId: `${item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      itemTime: 0,
    }));

    setSessionItems(prev => [...prev, ...newSessionItems]);
    addToast(`Added ${itemsToAdd.length} item${itemsToAdd.length !== 1 ? 's' : ''} to session`);
  };

  const handleDeleteSessionsByDateRange = (startDate, endDate) => {
    const inRange = (s) => {
      const sessionDate = new Date(s.date);
      return sessionDate >= startDate && sessionDate <= endDate;
    };
    const remaining = sessions.filter((s) => !inRange(s));
    setSessions(remaining);
    trashDroppedAudio(sessions.filter(inRange).flatMap((s) => s.recordings || []), remaining, recordings);
  };

  const handleClearAllSessions = () => {
    setSessions([]);
    trashDroppedAudio(sessions.flatMap((s) => s.recordings || []), [], recordings);
  };

  const handleSaveRecording = (recording) => {
    setRecordings(prev => [...prev, recording]);
  };

  // Removes the recording and moves its audio or video file to the Trash
  const handleDeleteRecording = (recordingId) => {
    const recording = recordings.find((r) => r.id === recordingId);
    const remaining = recordings.filter((r) => r.id !== recordingId);
    setRecordings(remaining);
    if (isTauri && recording?.filePath) {
      trashUnreferencedFiles([recording.filePath], sessions, remaining);
    }
  };

  const handleArchiveItem = (item) => {
    setPracticeItems(prev => prev.filter((i) => i.id !== item.id));
    setArchivedItems(prev => [...prev, { ...item, archivedAt: new Date().toISOString() }]);
    addToast(`Archived "${item.name}"`);
  };

  const handleRestoreItem = (item) => {
    setArchivedItems(prev => prev.filter((i) => i.id !== item.id));
    const { archivedAt, ...restoredItem } = item;
    setPracticeItems(prev => [...prev, restoredItem]);
    addToast(`Restored "${item.name}"`);
  };

  const handleDeleteArchivedItem = (itemId) => {
    setArchivedItems(prev => prev.filter((i) => i.id !== itemId));
  };

  const handleImportData = (data) => {
    setPracticeItems(data.practiceItems);
    setArchivedItems(data.archivedItems);
    setSessions(data.sessions);
    setUserTags(data.userTags);
    if (data.todoItems) setTodoItems(data.todoItems);
    if (data.archivedTodoItems) setArchivedTodoItems(data.archivedTodoItems);
    if (data.practiceTemplates) setPracticeTemplates(data.practiceTemplates);
  };

  const handleDeleteTag = (tagToDelete) => {
    setUserTags(prev => prev.filter(tag => tag !== tagToDelete));
  };

  const handleAddTodo = (name) => {
    const newTodo = {
      id: Date.now().toString(),
      name,
      createdAt: new Date().toISOString(),
    };
    setTodoItems(prev => [...prev, newTodo]);
    addToast(`Added "${name}" to to-do list`);
  };

  const handleArchiveTodo = (item) => {
    setTodoItems(prev => prev.filter(i => i.id !== item.id));
    setArchivedTodoItems(prev => [...prev, { ...item, archivedAt: new Date().toISOString() }]);
    addToast(`Archived "${item.name}"`);
  };

  const handleRestoreTodo = (item) => {
    setArchivedTodoItems(prev => prev.filter(i => i.id !== item.id));
    const { archivedAt, ...restoredItem } = item;
    setTodoItems(prev => [...prev, restoredItem]);
    addToast(`Restored "${item.name}"`);
  };

  const handleDeleteTodo = (itemId) => {
    setTodoItems(prev => prev.filter(i => i.id !== itemId));
    setArchivedTodoItems(prev => prev.filter(i => i.id !== itemId));
  };

  const handleMoveTodoToItems = (item) => {
    // A to-do's link (e.g. the coach feedback it came from) carries over as an attachment
    const attachments = item.link
      ? [{
          id: `${Date.now()}-link`,
          type: 'link',
          name: item.source
            ? `${item.source}${item.sourceDate ? ` ${item.sourceDate}` : ''}`
            : isWebLink(item.link) ? item.link : item.link.split(/[\\/]/).pop(),
          url: item.link,
        }]
      : [];
    const newPracticeItem = {
      id: Date.now().toString(),
      name: item.name,
      createdAt: new Date().toISOString(),
      category: null,
      tags: [],
      attachments,
    };
    setPracticeItems(prev => [...prev, newPracticeItem]);
    setTodoItems(prev => prev.filter(i => i.id !== item.id));
    addToast(`Moved "${item.name}" to practice items`);
  };

  // ---- Practice templates ----
  // Resolve a template's item references to full practice items (active, then archived,
  // then a bare {id, name} if the item was deleted) and build a fresh session queue.
  const buildSessionItemsFromTemplate = (template) =>
    template.items.map((templateItem) => {
      const source = practiceItems.find((p) => p.id === templateItem.id)
        || archivedItems.find((a) => a.id === templateItem.id)
        || { id: templateItem.id, name: templateItem.name };
      return {
        ...source,
        sessionInstanceId: `${source.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        itemTime: 0,
      };
    });

  const handleCreateTemplate = ({ name, items }) => {
    const template = {
      id: Date.now().toString(),
      name,
      items: items.map((item) => ({ id: item.id, name: item.name })),
      createdAt: new Date().toISOString(),
    };
    setPracticeTemplates((prev) => [...prev, template]);
    addToast(`Saved template "${name}"`);
  };

  const handleUpdateTemplate = (templateId, { name, items }) => {
    setPracticeTemplates((prev) =>
      prev.map((t) =>
        t.id === templateId
          ? {
              ...t,
              name,
              items: items.map((item) => ({ id: item.id, name: item.name })),
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    );
    addToast(`Updated template "${name}"`);
  };

  const handleDeleteTemplate = (templateId) => {
    const template = practiceTemplates.find((t) => t.id === templateId);
    setPracticeTemplates((prev) => prev.filter((t) => t.id !== templateId));
    if (template) addToast(`Deleted template "${template.name}"`);
  };

  // Load a template as the current session: replaces the queue, clears recordings,
  // and resets the session total so every item starts at 0:00.
  const handleLoadTemplate = (template) => {
    setSessionItems(buildSessionItemsFromTemplate(template));
    setRecordings([]);
    setSessionNotes('');
    trashDroppedAudio(recordings, sessions, []);
    setSessionTotalTime(0);
    setCurrentView('practice');
    addToast(`Loaded template "${template.name}"`);
  };

  const handleResetAllData = () => {
    setPracticeItems([]);
    setArchivedItems([]);
    setSessions([]);
    setUserTags([]);
    setSessionItems([]);
    setRecordings([]);
    setSessionNotes('');
    trashDroppedAudio([...recordings, ...sessions.flatMap((s) => s.recordings || [])], [], []);
    setSessionTotalTime(0);
    setTodoItems([]);
    setArchivedTodoItems([]);
    setPracticeTemplates([]);
  };

  const handleWelcomeGetStarted = () => {
    setHasSeenWelcome(true);
    setIsItemsModalOpen(true);
  };

  const handleWelcomeDismiss = () => {
    setHasSeenWelcome(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Welcome modal for new users */}
      {showWelcome && (
        <WelcomeModal
          onGetStarted={handleWelcomeGetStarted}
          onDismiss={handleWelcomeDismiss}
        />
      )}

      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl">
            <ChopsIcon className="text-white" size={24} />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">Chops</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Build your skills, track your progress</p>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <ThemeToggle />
            <span className="text-[10px] text-gray-300 dark:text-gray-600 select-none">
              {__BUILD_NUMBER__}
            </span>
          </div>
        </div>
      </header>

      <div className="hidden md:block">
        <Navigation currentView={currentView} onViewChange={setCurrentView} />
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6">
        {/* Always mounted (just hidden) so a running session, its notes and any
            recording in progress carry on while other tabs are open */}
        <div className={currentView === 'practice' ? 'space-y-6' : 'hidden'}>
            <PracticeItemsModal
              isOpen={isItemsModalOpen}
              onClose={() => setIsItemsModalOpen(false)}
              items={practiceItems}
              sessions={sessions}
              sessionItems={sessionItems}
              onItemsChange={setPracticeItems}
              onAddToSession={handleAddToSession}
              onRemoveFromSession={handleRemoveFromSessionByItemId}
              onArchiveItem={handleArchiveItem}
              userTags={userTags}
              onAddTag={handleAddTag}
            />
            <PracticeSession
              ref={practiceSessionRef}
              sessionItems={sessionItems}
              practiceItems={practiceItems}
              archivedItems={archivedItems}
              onRemoveFromSession={handleRemoveFromSession}
              onReorderSession={handleReorderSession}
              onUpdateSessionItemTime={handleUpdateSessionItemTime}
              onSaveSession={handleSaveSession}
              onResetSession={handleResetPracticeSession}
              recordings={recordings}
              onSaveRecording={handleSaveRecording}
              onDeleteRecording={handleDeleteRecording}
              sessions={sessions}
              onOpenItemsPicker={() => setIsItemsModalOpen(true)}
              initialSessionTime={sessionTotalTime}
              onSessionTimeChange={setSessionTotalTime}
              onSaveTemplate={handleCreateTemplate}
              metronome={metronome}
              practiceNotes={sessionNotes}
              onPracticeNotesChange={setSessionNotes}
            />
        </div>

        {currentView === 'items' && (
          <ItemsManager
            items={practiceItems}
            archivedItems={archivedItems}
            sessions={sessions}
            onItemsChange={setPracticeItems}
            onArchiveItem={handleArchiveItem}
            onRestoreItem={handleRestoreItem}
            onDeleteArchivedItem={handleDeleteArchivedItem}
            userTags={userTags}
            onAddTag={handleAddTag}
          />
        )}

        {currentView === 'todos' && (
          <TodoList
            todoItems={todoItems}
            archivedTodoItems={archivedTodoItems}
            onAddTodo={handleAddTodo}
            onArchiveTodo={handleArchiveTodo}
            onRestoreTodo={handleRestoreTodo}
            onDeleteTodo={handleDeleteTodo}
            onMoveTodoToItems={handleMoveTodoToItems}
          />
        )}

        {currentView === 'templates' && (
          <Templates
            templates={practiceTemplates}
            practiceItems={practiceItems}
            archivedItems={archivedItems}
            sessionItems={sessionItems}
            sessionTotalTime={sessionTotalTime}
            onCreateTemplate={handleCreateTemplate}
            onUpdateTemplate={handleUpdateTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            onLoadTemplate={handleLoadTemplate}
          />
        )}

        {currentView === 'history' && (
          <History
            sessions={sessions}
            onDeleteSession={handleDeleteSession}
            onCopyToSession={handleCopySessionToQueue}
          />
        )}

        {currentView === 'stats' && (
          <Stats
            sessions={sessions}
            practiceItems={practiceItems}
            userTags={userTags}
          />
        )}

        {currentView === 'settings' && (
          <Settings
            practiceItems={practiceItems}
            archivedItems={archivedItems}
            sessions={sessions}
            userTags={userTags}
            todoItems={todoItems}
            archivedTodoItems={archivedTodoItems}
            practiceTemplates={practiceTemplates}
            onImportData={handleImportData}
            onResetStorage={isTauri ? resetStorage : null}
            colorTheme={colorTheme}
            onColorThemeChange={setColorTheme}
            onDeleteSessionsByDateRange={handleDeleteSessionsByDateRange}
            onClearAllSessions={handleClearAllSessions}
            onDeleteTag={handleDeleteTag}
            onResetAllData={handleResetAllData}
          />
        )}
      </main>

      <div className="md:hidden">
        <Navigation currentView={currentView} onViewChange={setCurrentView} />
      </div>

      {/* Help Modal */}
      <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />
    </div>
  );
}

export default App;
