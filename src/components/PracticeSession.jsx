import { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Play, Pause, RotateCcw, X, ChevronUp, ChevronDown, Save, FileText, Timer, CheckCircle, TrendingUp, Calendar, Flame, Paperclip, Link as LinkIcon, Plus } from 'lucide-react';
import { useTimer, formatTime } from '../hooks/useTimer';
import { MetronomePopup } from './MetronomePopup';
import { RecordButton } from './RecordButton';
import { RecordingsList } from './AudioRecorder';
import { AttachmentList } from './AttachmentList';
import { RichTextEditor } from './RichTextEditor';
import { ConfirmDialog } from './ConfirmDialog';

function useItemTimer() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const accumulatedTimeRef = useRef(0);

  const start = useCallback(() => {
    if (!isRunning) {
      startTimeRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        setTime(accumulatedTimeRef.current + elapsed);
      }, 100);
      setIsRunning(true);
    }
  }, [isRunning]);

  const pause = useCallback(() => {
    if (isRunning) {
      clearInterval(intervalRef.current);
      accumulatedTimeRef.current = time;
      setIsRunning(false);
    }
  }, [isRunning, time]);

  const reset = useCallback(() => {
    clearInterval(intervalRef.current);
    setTime(0);
    setIsRunning(false);
    accumulatedTimeRef.current = 0;
    startTimeRef.current = null;
  }, []);

  const setInitialTime = useCallback((initialTime) => {
    setTime(initialTime);
    accumulatedTimeRef.current = initialTime;
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return { time, isRunning, start, pause, reset, setInitialTime };
}

export const PracticeSession = forwardRef(function PracticeSession({
  sessionItems,
  practiceItems = [],
  archivedItems = [],
  onRemoveFromSession,
  onReorderSession,
  onUpdateSessionItemTime,
  onSaveSession,
  onResetSession,
  recordings,
  onSaveRecording,
  onDeleteRecording,
  sessions = [],
  onOpenItemsPicker,
  initialSessionTime = 0,
  onSessionTimeChange,
}, ref) {
  const sessionTimer = useTimer();
  const itemTimer = useItemTimer();
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [practiceNotes, setPracticeNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [savedSessionInfo, setSavedSessionInfo] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const prevItemIndexRef = useRef(null);

  // Helper to get the current/full item data by looking up from practiceItems or archivedItems
  // This ensures we always show the latest item data (name, attachments, etc.)
  const getEnrichedItem = (sessionItem) => {
    if (!sessionItem) return null;
    const sourceItem = practiceItems.find(p => p.id === sessionItem.id)
      || archivedItems.find(a => a.id === sessionItem.id);
    if (sourceItem) {
      // Merge source item data with session-specific data (sessionInstanceId, itemTime)
      return { ...sourceItem, sessionInstanceId: sessionItem.sessionInstanceId, itemTime: sessionItem.itemTime };
    }
    // Fall back to session item data if original was deleted
    return sessionItem;
  };

  const currentSessionItem = sessionItems[currentItemIndex];
  const currentItem = getEnrichedItem(currentSessionItem);
  const shouldAutoStartRef = useRef(false);

  // Expose toggle function to parent via ref
  useImperativeHandle(ref, () => ({
    toggleTimer: () => {
      if (currentItem) {
        handleToggleSessionTimer();
      }
    },
    isRunning: sessionTimer.isRunning,
  }), [currentItem, sessionTimer.isRunning]);

  // Save item time when switching items (but don't pause session timer)
  useEffect(() => {
    if (prevItemIndexRef.current !== null && prevItemIndexRef.current !== currentItemIndex) {
      const prevIndex = prevItemIndexRef.current;
      if (sessionItems[prevIndex]) {
        onUpdateSessionItemTime(prevIndex, itemTimer.time);
      }
      // Pause item timer when switching, but session timer keeps running
      itemTimer.pause();
    }
    prevItemIndexRef.current = currentItemIndex;

    // Load the time for the new current item
    if (currentItem && currentItem.itemTime > 0) {
      itemTimer.setInitialTime(currentItem.itemTime);
    } else {
      itemTimer.reset();
    }

    // Auto-start if flagged
    if (shouldAutoStartRef.current) {
      shouldAutoStartRef.current = false;
      itemTimer.start();
    }
  }, [currentItemIndex]);

  // Sync item time periodically while running
  useEffect(() => {
    if (itemTimer.isRunning && currentItem) {
      const syncInterval = setInterval(() => {
        onUpdateSessionItemTime(currentItemIndex, itemTimer.time);
      }, 1000);
      return () => clearInterval(syncInterval);
    }
  }, [itemTimer.isRunning, itemTimer.time, currentItemIndex, currentItem, onUpdateSessionItemTime]);

  // Initialize session timer from persisted time (on mount only)
  useEffect(() => {
    if (initialSessionTime > 0) {
      sessionTimer.setInitialTime(initialSessionTime);
      setSessionStarted(true);
    } else if (sessionItems.length > 0) {
      // If there are persisted items but no time, still mark session as started
      setSessionStarted(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Persist session time periodically while running
  useEffect(() => {
    if (sessionTimer.isRunning && onSessionTimeChange) {
      const persistInterval = setInterval(() => {
        onSessionTimeChange(sessionTimer.time);
      }, 5000); // Persist every 5 seconds
      return () => clearInterval(persistInterval);
    }
  }, [sessionTimer.isRunning, sessionTimer.time, onSessionTimeChange]);

  // Persist session time when paused
  useEffect(() => {
    if (!sessionTimer.isRunning && sessionTimer.time > 0 && onSessionTimeChange) {
      onSessionTimeChange(sessionTimer.time);
    }
  }, [sessionTimer.isRunning, sessionTimer.time, onSessionTimeChange]);

  // Pause timers if all items are removed from session
  useEffect(() => {
    if (sessionItems.length === 0 && sessionTimer.isRunning) {
      sessionTimer.pause();
      itemTimer.pause();
    }
  }, [sessionItems.length, sessionTimer.isRunning]);

  const moveItem = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < sessionItems.length) {
      const newItems = [...sessionItems];
      [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
      onReorderSession(newItems);
      if (currentItemIndex === index) {
        setCurrentItemIndex(newIndex);
      } else if (currentItemIndex === newIndex) {
        setCurrentItemIndex(index);
      }
    }
  };

  // Toggle session timer (pausing session also pauses item timer)
  const handleToggleSessionTimer = () => {
    if (sessionTimer.isRunning) {
      // Pause both timers
      sessionTimer.pause();
      itemTimer.pause();
    } else {
      // Start or resume session
      sessionTimer.start();
      setSessionStarted(true);
      // If item timer isn't running, start it too
      if (!itemTimer.isRunning && currentItem) {
        itemTimer.start();
      }
    }
  };

  const handleSelectItem = (index) => {
    // Save current item time before switching
    if (currentItem) {
      onUpdateSessionItemTime(currentItemIndex, itemTimer.time);
    }
    // Pause current item timer
    if (itemTimer.isRunning) {
      itemTimer.pause();
    }
    setCurrentItemIndex(index);
  };

  const handleStartItem = (index) => {
    // Save current item time before switching
    if (currentItem) {
      onUpdateSessionItemTime(currentItemIndex, itemTimer.time);
    }
    // Pause current item timer
    if (itemTimer.isRunning) {
      itemTimer.pause();
    }
    // Start session timer if not running
    if (!sessionTimer.isRunning) {
      sessionTimer.start();
      setSessionStarted(true);
    }
    // Flag to auto-start the new item's timer
    shouldAutoStartRef.current = true;
    // Select the new item (this triggers the useEffect which will auto-start)
    if (index === currentItemIndex) {
      // Same item - just start the timer directly
      shouldAutoStartRef.current = false;
      itemTimer.start();
    } else {
      setCurrentItemIndex(index);
    }
  };

  const getMonthStats = (includingNewSession = null) => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthSessions = sessions.filter(s => new Date(s.date) >= monthStart);
    let totalTime = monthSessions.reduce((sum, s) => sum + s.duration, 0);
    let sessionCount = monthSessions.length;

    if (includingNewSession) {
      totalTime += includingNewSession.duration;
      sessionCount += 1;
    }

    return { totalTime, sessionCount };
  };

  const getStreak = (includingNewSession = null) => {
    const allSessions = includingNewSession ? [...sessions, includingNewSession] : sessions;
    if (allSessions.length === 0) return 0;

    const sortedDates = [...new Set(
      allSessions.map((s) => new Date(s.date).toDateString())
    )].sort((a, b) => new Date(b) - new Date(a));

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const dateStr of sortedDates) {
      const sessionDate = new Date(dateStr);
      sessionDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((currentDate - sessionDate) / (1000 * 60 * 60 * 24));
      if (diffDays === streak) {
        streak++;
      } else if (diffDays > streak) {
        break;
      }
    }
    return streak;
  };

  const handleSaveSession = () => {
    if (sessionItems.length === 0 || sessionTimer.time === 0) return;

    // Save current item time
    if (currentItem) {
      onUpdateSessionItemTime(currentItemIndex, itemTimer.time);
    }

    const session = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      duration: sessionTimer.time,
      notes: practiceNotes.trim() || null,
      items: sessionItems.map((item, index) => ({
        id: item.id,
        name: item.name,
        time: index === currentItemIndex ? itemTimer.time : (item.itemTime || 0),
      })),
      recordings: recordings,
    };

    // Calculate stats before saving (include the new session)
    const monthStats = getMonthStats(session);
    const streak = getStreak(session);

    // Store info for confirmation modal
    setSavedSessionInfo({
      duration: session.duration,
      itemCount: session.items.length,
      recordingCount: session.recordings?.length || 0,
      monthTotalTime: monthStats.totalTime,
      monthSessionCount: monthStats.sessionCount,
      streak: streak,
    });

    onSaveSession(session);
    sessionTimer.reset();
    itemTimer.reset();
    setPracticeNotes('');
    setCurrentItemIndex(0);
    setSessionStarted(false);
    setShowConfirmation(true);
  };

  const handleResetSession = () => {
    // Show confirmation if there's anything to reset
    if (sessionItems.length > 0 || sessionTimer.time > 0 || practiceNotes || recordings.length > 0) {
      setShowResetConfirm(true);
    }
  };

  const confirmResetSession = () => {
    // Reset local state
    sessionTimer.reset();
    itemTimer.reset();
    setPracticeNotes('');
    setCurrentItemIndex(0);
    setSessionStarted(false);
    setShowNotes(false);
    // Reset parent state (queue, recordings, persisted time)
    if (onResetSession) {
      onResetSession();
    }
    setShowResetConfirm(false);
  };

  // Filter recordings for current item using sessionInstanceId
  const currentItemRecordings = currentItem
    ? recordings.filter((r) => r.sessionInstanceId === currentItem.sessionInstanceId)
    : [];

  return (
    <div className="space-y-4">
      {/* Main Session Timer */}
      <div className="relative bg-gradient-to-br from-primary-600 to-purple-700 rounded-2xl shadow-lg p-6 text-white">
        {/* Tools (Record & Metronome) - Bottom Left */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2">
          <RecordButton
            onSaveRecording={onSaveRecording}
            sessionInstanceId={currentItem?.sessionInstanceId}
            disabled={!sessionStarted}
          />
          <div className="relative">
            <MetronomePopup />
          </div>
        </div>

        {/* Save Session - Bottom Right (only show if there are items) */}
        {sessionItems.length > 0 && sessionStarted && sessionTimer.time > 0 && (
          <button
            onClick={handleSaveSession}
            className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-all"
          >
            <Save size={18} />
            <span className="hidden sm:inline">Save Session</span>
          </button>
        )}
        <div className="text-center mb-4">
          <p className="text-primary-200 text-sm mb-1">Total Session Time</p>
          <div className="text-5xl font-bold tracking-tight">
            {formatTime(sessionTimer.time)}
          </div>
        </div>

        {/* Item Timer */}
        {currentItem && (
          <div className="bg-white/10 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer size={20} className="text-white/80" />
                <span className="text-lg font-bold">Practicing: {currentItem.name}</span>
              </div>
              <div className="text-2xl font-bold">
                {formatTime(itemTimer.time)}
              </div>
            </div>
            {/* Show attachments for current item */}
            {currentItem.attachments?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/20">
                <div className="flex items-center gap-2 text-primary-200 text-sm mb-2">
                  <Paperclip size={14} />
                  <span>Attachments</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentItem.attachments.map((attachment) => (
                    <button
                      key={attachment.id}
                      onClick={() => {
                        if (attachment.type === 'link') {
                          window.open(attachment.url, '_blank', 'noopener,noreferrer');
                        } else if (attachment.type === 'pdf') {
                          const pdfWindow = window.open('');
                          pdfWindow.document.write(
                            `<iframe width='100%' height='100%' src='${attachment.data}' frameborder='0'></iframe>`
                          );
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm text-white transition-colors"
                    >
                      {attachment.type === 'link' ? (
                        <LinkIcon size={14} />
                      ) : (
                        <FileText size={14} />
                      )}
                      {attachment.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col items-center gap-2">
          <div className="flex justify-center gap-4">
            <button
              onClick={handleToggleSessionTimer}
              disabled={!currentItem}
              className="p-4 bg-white/20 backdrop-blur rounded-full hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title={sessionTimer.isRunning ? "Pause session" : "Start session"}
            >
              {sessionTimer.isRunning ? <Pause size={32} /> : <Play size={32} />}
            </button>
            <button
              onClick={handleResetSession}
              className="p-4 bg-white/20 backdrop-blur rounded-full hover:bg-white/30 transition-colors"
              title="Reset all timers"
            >
              <RotateCcw size={32} />
            </button>
          </div>
          <p className="text-xs text-white/60">Press SPACE to start/pause</p>
        </div>
      </div>

      {/* Session Queue */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Session Queue</h3>
          {sessionItems.length > 0 && (
            <button
              onClick={onOpenItemsPicker}
              className="flex items-center gap-2 px-3 py-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-xl transition-colors"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Add Items</span>
            </button>
          )}
        </div>

        {sessionItems.length === 0 ? (
          <button
            onClick={onOpenItemsPicker}
            className="w-full text-center py-8 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
          >
            <div className="w-16 h-16 mx-auto mb-3 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center group-hover:bg-primary-200 dark:group-hover:bg-primary-900/50 transition-colors">
              <Plus size={32} className="text-primary-500 dark:text-primary-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
              Add items to start practicing
            </p>
          </button>
        ) : (
          <div className="space-y-2">
            {sessionItems.map((sessionItem, index) => {
              const item = getEnrichedItem(sessionItem);
              return (
                <div
                  key={sessionItem.sessionInstanceId}
                  className={`flex items-center gap-2 p-3 rounded-xl transition-all ${
                    index === currentItemIndex
                      ? 'bg-primary-100 dark:bg-primary-900/40 border-2 border-primary-400 dark:border-primary-500'
                      : 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700'
                  }`}
                >
                  <div className="flex flex-col">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveItem(index, -1);
                      }}
                      disabled={index === 0}
                      className="p-0.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveItem(index, 1);
                      }}
                      disabled={index === sessionItems.length - 1}
                      className="p-0.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>

                  {/* Play/Pause button for this item */}
                  <button
                    onClick={() => handleStartItem(index)}
                    disabled={!sessionTimer.isRunning && index === currentItemIndex && itemTimer.isRunning}
                    className={`p-2 rounded-lg transition-colors ${
                      index === currentItemIndex && itemTimer.isRunning
                        ? 'bg-primary-600 text-white'
                        : 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900/60'
                    }`}
                    title={index === currentItemIndex && itemTimer.isRunning ? 'Currently practicing' : 'Start practicing this item'}
                  >
                    {index === currentItemIndex && itemTimer.isRunning ? (
                      <Timer size={18} className="animate-pulse" />
                    ) : (
                      <Play size={18} />
                    )}
                  </button>

                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-gray-700 dark:text-gray-200">{item.name}</span>
                    {index === currentItemIndex && itemTimer.isRunning && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase bg-primary-600 text-white rounded animate-pulse">
                        Now
                      </span>
                    )}
                  </div>

                  {/* Show item time */}
                  <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Timer size={14} />
                    {formatTime(index === currentItemIndex ? itemTimer.time : (sessionItem.itemTime || 0))}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFromSession(index);
                      if (currentItemIndex >= sessionItems.length - 1) {
                        setCurrentItemIndex(Math.max(0, sessionItems.length - 2));
                      }
                    }}
                    className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Practice Notes */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 md:p-6">
        <button
          onClick={() => setShowNotes(!showNotes)}
          className="flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors w-full mb-2"
        >
          <FileText size={18} />
          <span className="font-medium">Practice Notes</span>
          {practiceNotes && <span className="text-xs text-primary-600 dark:text-primary-400 ml-2">(has notes)</span>}
        </button>

        {showNotes && (
          <RichTextEditor
            value={practiceNotes}
            onChange={setPracticeNotes}
            placeholder="Add notes about this practice session..."
          />
        )}
      </div>

      {/* Recordings Card - Always visible */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 md:p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recordings</h3>
        {recordings.length === 0 ? (
          <p className="text-gray-400 dark:text-gray-500 text-center py-4">
            No recordings yet. Press the mic button on the timer to record.
          </p>
        ) : (
          <RecordingsList
            recordings={recordings}
            onDelete={onDeleteRecording}
          />
        )}
      </div>

      {/* Session Saved Confirmation Modal */}
      {showConfirmation && savedSessionInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="text-green-600 dark:text-green-400" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Session Saved!</h3>
            </div>

            {/* This Session */}
            <div className="bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl p-4 text-white mb-4">
              <p className="text-primary-200 text-sm mb-1">This Session</p>
              <p className="text-3xl font-bold">{formatTime(savedSessionInfo.duration)}</p>
              <p className="text-primary-200 text-sm mt-1">
                {savedSessionInfo.itemCount} item{savedSessionInfo.itemCount !== 1 ? 's' : ''} practiced
                {savedSessionInfo.recordingCount > 0 && (
                  <> · {savedSessionInfo.recordingCount} recording{savedSessionInfo.recordingCount !== 1 ? 's' : ''}</>
                )}
              </p>
            </div>

            {/* Month Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                <Calendar size={18} className="text-primary-600 dark:text-primary-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-800 dark:text-white">{savedSessionInfo.monthSessionCount}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">This Month</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                <TrendingUp size={18} className="text-primary-600 dark:text-primary-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-800 dark:text-white">{formatTime(savedSessionInfo.monthTotalTime)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Month Total</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                <Flame size={18} className="text-orange-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-800 dark:text-white">{savedSessionInfo.streak}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Day Streak</p>
              </div>
            </div>

            {/* Motivational Message */}
            {savedSessionInfo.streak >= 7 && (
              <p className="text-sm text-primary-600 dark:text-primary-400 mb-4">
                {savedSessionInfo.streak >= 30 ? "Incredible dedication! You're on fire!" :
                 savedSessionInfo.streak >= 14 ? "Two weeks strong! Keep it up!" :
                 "A week of practice! Great momentum!"}
              </p>
            )}

            <button
              onClick={() => setShowConfirmation(false)}
              className="w-full px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Reset Session Confirmation */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={confirmResetSession}
        title="Reset Session"
        message="This will clear the timer, session queue, notes, and recordings. Are you sure?"
        confirmText="Reset"
        variant="warning"
      />
    </div>
  );
});
