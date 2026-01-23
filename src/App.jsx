import { useState, useRef, useEffect } from 'react';
import { ChopsIcon } from './components/ChopsIcon';
import { useFileStorage, useStorageSetup } from './hooks/useFileStorage';
import { useSpacebarToggle } from './hooks/useKeyboardShortcuts';
import { Navigation } from './components/Navigation';
import { PracticeItemsModal } from './components/PracticeItemsModal';
import { PracticeSession } from './components/PracticeSession';
import { History } from './components/History';
import { Statistics } from './components/Statistics';
import { ItemsManager } from './components/ItemsManager';
import { ThemeToggle } from './components/ThemeToggle';
import { StorageSetup } from './components/StorageSetup';
import { Settings } from './components/Settings';
import { Reports } from './components/Reports';
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
  const [isItemsModalOpen, setIsItemsModalOpen] = useState(false);

  const practiceSessionRef = useRef(null);

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

  const handleDeleteSession = (sessionId) => {
    setSessions(sessions.filter((s) => s.id !== sessionId));
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
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
              onRemoveFromSession={handleRemoveFromSession}
              onReorderSession={handleReorderSession}
              onUpdateSessionItemTime={handleUpdateSessionItemTime}
              onSaveSession={handleSaveSession}
              recordings={recordings}
              onSaveRecording={handleSaveRecording}
              onDeleteRecording={handleDeleteRecording}
              sessions={sessions}
              onOpenItemsPicker={() => setIsItemsModalOpen(true)}
              initialSessionTime={sessionTotalTime}
              onSessionTimeChange={setSessionTotalTime}
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
          <History sessions={sessions} onDeleteSession={handleDeleteSession} />
        )}

        {currentView === 'stats' && (
          <Statistics
            sessions={sessions}
            onDeleteSessionsByDateRange={handleDeleteSessionsByDateRange}
            onClearAllSessions={handleClearAllSessions}
          />
        )}

        {currentView === 'reports' && (
          <Reports sessions={sessions} />
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
          />
        )}
      </main>

      <div className="md:hidden">
        <Navigation currentView={currentView} onViewChange={setCurrentView} />
      </div>
    </div>
  );
}

export default App;
