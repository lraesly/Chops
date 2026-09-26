import { useState } from 'react';
import { Calendar, Clock, Music, Trash2, ChevronDown, ChevronUp, Play, Pause, FileText, Copy, Download, Video, FolderOpen } from 'lucide-react';
import { formatTime } from '../hooks/useTimer';
import { ConfirmDialog } from './ConfirmDialog';
import { VideoPlayerModal } from './VideoPlayerModal';
import { revealVideoFile, revealLabel } from '../hooks/videoStorage';
import { loadRecordingBlob } from '../hooks/audioStorage';
import { isTauri } from '../hooks/useFileStorage';
import { useRecordingPlayer } from '../hooks/useRecordingPlayer';
import { isHtmlNotes, sanitizeNotesHtml, notesToText } from '../constants/notes';

export function History({ sessions, onDeleteSession, onCopyToSession }) {
  const [expandedSession, setExpandedSession] = useState(null);
  const { playingId: playingRecording, toggle: handlePlayRecording, register, onEnded } = useRecordingPlayer();
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [openVideo, setOpenVideo] = useState(null);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTimeOfDay = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleExportRecording = async (recording) => {
    try {
      const blob = await loadRecordingBlob(recording);

      // Decode audio using AudioContext
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Convert to WAV
      const wavBlob = audioBufferToWav(audioBuffer);
      audioContext.close();
      const fileName = `${(recording.name || 'recording').replace(/[/\\:*?"<>|]/g, '-')}.wav`;

      if (isTauri()) {
        // The desktop webview ignores <a download>, so ask where to save
        const { save } = await import('@tauri-apps/plugin-dialog');
        const { writeFile } = await import('@tauri-apps/plugin-fs');
        const filePath = await save({
          defaultPath: fileName,
          filters: [{ name: 'WAV audio', extensions: ['wav'] }],
        });
        if (filePath) {
          await writeFile(filePath, new Uint8Array(await wavBlob.arrayBuffer()));
        }
        return;
      }

      const url = URL.createObjectURL(wavBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting recording:', error);
      alert('Failed to export recording. Please try again.');
    }
  };

  // Convert AudioBuffer to WAV blob
  function audioBufferToWav(audioBuffer) {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const samples = audioBuffer.length;
    const dataSize = samples * blockAlign;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Write audio data
    const channelData = [];
    for (let i = 0; i < numChannels; i++) {
      channelData.push(audioBuffer.getChannelData(i));
    }

    let offset = 44;
    for (let i = 0; i < samples; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }

  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  const groupedSessions = sortedSessions.reduce((groups, session) => {
    const date = new Date(session.date).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(session);
    return groups;
  }, {});

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 md:p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Practice History</h2>

        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
            <p className="text-gray-400 dark:text-gray-500">No practice sessions yet</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              Complete a practice session to see it here
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedSessions).map(([date, daySessions]) => (
              <div key={date}>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                  <Calendar size={16} />
                  {formatDate(daySessions[0].date)}
                </h3>

                <div className="space-y-3">
                  {daySessions.map((session) => (
                    <div
                      key={session.id}
                      className="bg-gray-50 dark:bg-gray-700 rounded-xl overflow-hidden"
                    >
                      <div
                        onClick={() =>
                          setExpandedSession(
                            expandedSession === session.id ? null : session.id
                          )
                        }
                        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        <div className="p-2 bg-primary-100 dark:bg-primary-900/40 rounded-lg">
                          <Music className="text-primary-600 dark:text-primary-400" size={20} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 dark:text-white">
                            {session.items.length} item
                            {session.items.length !== 1 ? 's' : ''} practiced
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatTimeOfDay(session.date)}
                          </p>
                          {/* Notes preview - shown in collapsed state */}
                          {session.notes && expandedSession !== session.id && (
                            <p className="text-sm text-primary-600 dark:text-primary-400 mt-1 truncate flex items-center gap-1">
                              <FileText size={12} className="flex-shrink-0" />
                              <span className="truncate">{notesToText(session.notes)}</span>
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                          <Clock size={16} />
                          <span className="font-medium">
                            {formatTime(session.duration)}
                          </span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm(session);
                          }}
                          className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>

                        {expandedSession === session.id ? (
                          <ChevronUp size={20} className="text-gray-400 dark:text-gray-500" />
                        ) : (
                          <ChevronDown size={20} className="text-gray-400 dark:text-gray-500" />
                        )}
                      </div>

                      {expandedSession === session.id && (
                        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-600">
                          <div className="pt-4 space-y-4">
                            {/* Practice Notes */}
                            {session.notes && (
                              <div className="bg-primary-50 dark:bg-primary-900/30 rounded-lg p-3">
                                <p className="text-sm font-medium text-primary-700 dark:text-primary-300 mb-1 flex items-center gap-2">
                                  <FileText size={14} />
                                  Practice Notes
                                </p>
                                {isHtmlNotes(session.notes) ? (
                                  <div
                                    className="text-gray-700 dark:text-gray-200 text-sm [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5"
                                    // Sanitized to the editor's own formatting tags, no attributes
                                    dangerouslySetInnerHTML={{ __html: sanitizeNotesHtml(session.notes) }}
                                  />
                                ) : (
                                  <p className="text-gray-700 dark:text-gray-200 text-sm whitespace-pre-wrap">
                                    {session.notes}
                                  </p>
                                )}
                              </div>
                            )}

                            <div>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                Practice Items:
                              </p>
                              <button
                                onClick={() => onCopyToSession(session)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/60 transition-colors"
                              >
                                <Copy size={14} />
                                Copy to Session
                              </button>
                            </div>
                            {session.items.map((item, index) => (
                              <div
                                key={`${item.id}-${index}`}
                                className="flex items-center justify-between py-2 px-3 bg-white dark:bg-gray-800 rounded-lg"
                              >
                                <span className="text-gray-700 dark:text-gray-200">{item.name}</span>
                                {item.time > 0 && (
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {formatTime(item.time)}
                                  </span>
                                )}
                              </div>
                            ))}

                            {session.recordings && session.recordings.length > 0 && (
                              <div className="mt-4">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                                  Recordings:
                                </p>
                                {session.recordings.map((recording) => recording.type === 'video' ? (
                                  <div
                                    key={recording.id}
                                    className="flex items-center gap-2 py-2 px-3 bg-white dark:bg-gray-800 rounded-lg"
                                  >
                                    <button
                                      onClick={() => setOpenVideo(recording)}
                                      className="p-2 bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/60 transition-colors"
                                      title="Play video"
                                    >
                                      <Video size={14} />
                                    </button>
                                    <span className="flex-1 text-gray-700 dark:text-gray-200 text-sm">
                                      {recording.name}
                                    </span>
                                    <button
                                      onClick={() => revealVideoFile(recording.filePath)}
                                      className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                      title={revealLabel}
                                    >
                                      <FolderOpen size={14} />
                                    </button>
                                  </div>
                                ) : (
                                  <div
                                    key={recording.id}
                                    className="flex items-center gap-2 py-2 px-3 bg-white dark:bg-gray-800 rounded-lg"
                                  >
                                    <audio
                                      ref={register(recording.id)}
                                      src={recording.audio}
                                      onEnded={onEnded}
                                      className="hidden"
                                    />
                                    <button
                                      onClick={() => handlePlayRecording(recording)}
                                      className="p-2 bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/60 transition-colors"
                                    >
                                      {playingRecording === recording.id ? (
                                        <Pause size={14} />
                                      ) : (
                                        <Play size={14} />
                                      )}
                                    </button>
                                    <span className="flex-1 text-gray-700 dark:text-gray-200 text-sm">
                                      {recording.name}
                                    </span>
                                    <button
                                      onClick={() => handleExportRecording(recording)}
                                      className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                      title="Export recording"
                                    >
                                      <Download size={14} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {openVideo && <VideoPlayerModal recording={openVideo} onClose={() => setOpenVideo(null)} />}

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => onDeleteSession(deleteConfirm.id)}
        title="Delete Session"
        message={`Delete this practice session from ${deleteConfirm ? new Date(deleteConfirm.date).toLocaleDateString() : ''}? This action cannot be undone.${
          deleteConfirm?.recordings?.some((r) => r.type !== 'video' && r.filePath) ? ' Its audio recordings will be moved to the Trash.' : ''
        }${deleteConfirm?.recordings?.some((r) => r.type === 'video') ? ' Its videos stay in your video folder.' : ''}`}
        confirmText="Delete"
      />
    </div>
  );
}
