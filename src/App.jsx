import { useState, useRef, useEffect, useMemo } from 'react';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { confirm } from '@tauri-apps/plugin-dialog';
import { ChopsIcon } from './components/ChopsIcon';
import { useFileStorage, useStorageSetup } from './hooks/useFileStorage';
import { useKeyboardShortcuts, useSpacebarToggle } from './hooks/useKeyboardShortcuts';
import { useMetronome } from './hooks/useMetronome';
import { Navigation } from './components/Navigation';
import { PracticeItemsModal } from './components/PracticeItemsModal';
import { PracticeSession } from './components/PracticeSession';
import { History } from './components/History';
import { Stats } from './components/Stats';
import { ItemsManager } from './components/ItemsManager';
import { ThemeToggle } from './components/ThemeToggle';
import { StorageSetup } from './components/StorageSetup';
import { Settings } from './components/Settings';
import { WelcomeModal } from './components/WelcomeModal';
import { HelpModal } from './components/HelpModal';
import { useToast } from './components/Toast';

function App() {
  const { isConfigured, isLoading, setupStorage, chooseFolder, resetStorage, isTauri } = useStorageSetup();
  const { addToast } = useToast();

  const [currentView, setCurrentView] = useState('practice');
  const [practiceItems, setPracticeItems, itemsLoaded] = useFileStorage('practiceItems', []);
  const [archivedItems, setArchivedItems] = useFileStorage('archivedItems', []);
  const [sessionItems, setSessionItems, sessionItemsLoaded] = useFileStorage('sessionQueue', []);
  const [sessions, setSessions, sessionsLoaded] = useFileStorage('practiceSessions', []);
  const [recordings, setRecordings, recordingsLoaded] = useFileStorage('sessionRecordings', []);
  const [sessionTotalTime, setSessionTotalTime] = useFileStorage('sessionTotalTime', 0);
  const [userTags, setUserTags] = useFileStorage('userTags', []);
  const [colorTheme, setColorTheme] = useFileStorage('colorTheme', 'violet');
  const [hasSeenWelcome, setHasSeenWelcome] = useFileStorage('hasSeenWelcome', false);
  const [isItemsModalOpen, setIsItemsModalOpen] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const practiceSessionRef = useRef(null);

  // Metronome state (lifted to App for keyboard shortcut access)
  const metronome = useMetronome();

  // Listen for menu events from Tauri
  useEffect(() => {
    let unlisten;
    listen('menu-action', (event) => {
      const action = event.payload;
      if (action === 'help_shortcuts') {
        setShowHelpModal(true);
      } else if (action === 'metronome_toggle' && currentView === 'practice') {
        practiceSessionRef.current?.toggleMetronomePopup?.();
      } else if (action === 'metronome_play' && currentView === 'practice') {
        metronome.toggle();
      } else if (action === 'metronome_tempo_down' && currentView === 'practice') {
        const currentBpm = metronome.bpm;
        const presets = [80, 100, 120, 140, 160, 180];
        const prevPreset = [...presets].reverse().find(p => p < currentBpm);
        if (prevPreset) metronome.setBpm(prevPreset);
      } else if (action === 'metronome_tempo_up' && currentView === 'practice') {
        const currentBpm = metronome.bpm;
        const presets = [80, 100, 120, 140, 160, 180];
        const nextPreset = presets.find(p => p > currentBpm);
        if (nextPreset) metronome.setBpm(nextPreset);
      }
    }).then((unlistenFn) => {
      unlisten = unlistenFn;
    });

    return () => {
      if (unlisten) unlisten();
    };
  }, [currentView, metronome]);

  // Quit protection: prompt to save when there's an active session
  useEffect(() => {
    let unlistenClose;

    const setupCloseHandler = async () => {
      try {
        const appWindow = getCurrentWindow();
        unlistenClose = await appWindow.onCloseRequested(async (event) => {
          // Check if there's an active session (timer has been started and has time)
          if (sessionTotalTime > 0) {
            // Prevent the window from closing immediately
            event.preventDefault();

            // Show confirmation dialog
            const confirmed = await confirm(
              'You have an unsaved practice session. Are you sure you want to quit?',
              { title: 'Unsaved Session', kind: 'warning' }
            );

            if (confirmed) {
              // User confirmed, force close
              await appWindow.destroy();
            }
            // If not confirmed, do nothing (window stays open)
          }
          // If no active session, allow normal close
        });
      } catch (e) {
        // Not running in Tauri, ignore
        console.log('Close handler not available:', e);
      }
    };

    setupCloseHandler();

    return () => {
      if (unlistenClose) unlistenClose();
    };
  }, [sessionTotalTime]);

  // Show welcome modal for new users (no items, no sessions, hasn't dismissed)
  const showWelcome = !hasSeenWelcome && practiceItems.length === 0 && sessions.length === 0;

  // Apply color theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', colorTheme);
  }, [colorTheme]);

  // Spacebar shortcut to toggle timer (only on Practice view)
  // NOTE: All hooks must be called before any early returns
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
    // View switching: Cmd/Ctrl + 1-4 and comma
    { key: '1', ctrl: true, handler: () => setCurrentView('practice') },
    { key: '2', ctrl: true, handler: () => setCurrentView('items') },
    { key: '3', ctrl: true, handler: () => setCurrentView('history') },
    { key: '4', ctrl: true, handler: () => setCurrentView('stats') },
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
    // Help modal: ? key
    {
      key: '?',
      handler: () => {
        setShowHelpModal(true);
      },
    },
  ], [currentView, metronome]);

  useKeyboardShortcuts(shortcuts);

  // Show storage setup for Tauri if not configured
  if (isTauri && !isLoading && !isConfigured) {
    return <StorageSetup onSetup={setupStorage} onChooseFolder={chooseFolder} />;
  }

  // Show loading state
  if (isLoading || (isTauri && (!itemsLoaded || !sessionsLoaded || !sessionItemsLoaded || !recordingsLoaded))) {
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

  const handleRemoveFromSession = (index) => {
    // Also remove recordings for this session instance
    const removedItem = sessionItems[index];
    if (removedItem) {
      setRecordings(recordings.filter(r => r.sessionInstanceId !== removedItem.sessionInstanceId));
    }
    setSessionItems(sessionItems.filter((_, i) => i !== index));
  };

  const handleRemoveFromSessionByItemId = (itemId) => {
    // Remove all instances of this item from the session
    const itemsToRemove = sessionItems.filter(si => si.id === itemId);
    const itemName = itemsToRemove[0]?.name || 'Item';
    itemsToRemove.forEach(item => {
      setRecordings(prev => prev.filter(r => r.sessionInstanceId !== item.sessionInstanceId));
    });
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
    setSessionTotalTime(0);
  };

  const handleResetPracticeSession = () => {
    setSessionItems([]);
    setRecordings([]);
    setSessionTotalTime(0);
  };

  const handleDeleteSession = (sessionId) => {
    setSessions(sessions.filter((s) => s.id !== sessionId));
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
    setSessions(sessions.filter((s) => {
      const sessionDate = new Date(s.date);
      return sessionDate < startDate || sessionDate > endDate;
    }));
  };

  const handleClearAllSessions = () => {
    setSessions([]);
  };

  const handleSaveRecording = (recording) => {
    setRecordings(prev => [...prev, recording]);
  };

  const handleDeleteRecording = (recordingId) => {
    setRecordings(prev => prev.filter((r) => r.id !== recordingId));
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
  };

  const handleDeleteTag = (tagToDelete) => {
    setUserTags(prev => prev.filter(tag => tag !== tagToDelete));
  };

  const handleResetAllData = () => {
    setPracticeItems([]);
    setArchivedItems([]);
    setSessions([]);
    setUserTags([]);
    setSessionItems([]);
    setRecordings([]);
    setSessionTotalTime(0);
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
          <ThemeToggle />
        </div>
      </header>

      <div className="hidden md:block">
        <Navigation currentView={currentView} onViewChange={setCurrentView} />
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6">
        {currentView === 'practice' && (
          <div className="space-y-6">
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
              metronome={metronome}
            />
          </div>
        )}

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
