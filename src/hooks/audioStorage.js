// Audio recordings are saved as standalone files in Chops' private app data folder
// (~/Library/Application Support/com.chops.practice/Audio Recordings on macOS),
// out of the user's way; videos go to a user-chosen folder instead.
// Older recordings kept the audio inline as a base64 data URL in the JSON data file;
// migrateEmbeddedAudio() moves those out. Outside Tauri (browser dev) audio stays inline.
import { isTauri, loadTauriModules, getStoragePath } from './useFileStorage';
import { joinPath, timestamp, safeFileName } from './videoStorage';
import { blobToBase64, base64ToBlob } from './useAudioRecorder';

const AUDIO_FOLDER_NAME = 'Audio Recordings';
const DATA_FILENAME = 'practice-log-data.json';
const BACKUP_FILENAME = 'practice-log-data.before-audio-migration.json';

const audioExtension = (mimeType = '') => {
  if (mimeType.startsWith('audio/mp4')) return 'm4a';
  if (mimeType.startsWith('audio/ogg')) return 'ogg';
  if (mimeType.startsWith('audio/wav')) return 'wav';
  return 'webm';
};

const getAudioFolder = async () => {
  const { path } = await loadTauriModules();
  return path ? joinPath(await path.appDataDir(), AUDIO_FOLDER_NAME) : null;
};

// Writes the bytes to a new file named "Chops <date time> <name>.<ext>"; returns its path.
// With reuseExisting, an identical-size file already at that name is taken as a
// previous (interrupted) migration's copy instead of writing a duplicate.
const writeAudioFile = async (bytes, mimeType, name, date, { reuseExisting = false } = {}) => {
  const { fs } = await loadTauriModules();
  const folder = await getAudioFolder();
  await fs.mkdir(folder, { recursive: true });
  const cleanName = safeFileName(name || '');
  const base = `Chops ${timestamp(date)}${cleanName ? ` ${cleanName}` : ''}`;
  const extension = audioExtension(mimeType);
  let filePath = joinPath(folder, `${base}.${extension}`);
  if (reuseExisting && (await fs.exists(filePath)) && (await fs.stat(filePath)).size === bytes.length) {
    return filePath;
  }
  for (let n = 2; await fs.exists(filePath); n++) {
    filePath = joinPath(folder, `${base} (${n}).${extension}`);
  }
  await fs.writeFile(filePath, bytes);
  const info = await fs.stat(filePath);
  if (info.size !== bytes.length) {
    throw new Error(`Wrote ${info.size} of ${bytes.length} bytes to ${filePath}`);
  }
  return filePath;
};

// Builds the recording entry for a new take: file-backed in the app, inline in a browser
export const createAudioRecording = async ({ blob, mimeType, name, sessionInstanceId }) => {
  const createdAt = new Date();
  const recording = {
    id: createdAt.getTime().toString(),
    type: 'audio',
    name,
    mimeType,
    sessionInstanceId,
    createdAt: createdAt.toISOString(),
  };
  if (isTauri()) {
    recording.filePath = await writeAudioFile(new Uint8Array(await blob.arrayBuffer()), mimeType, name, createdAt);
  } else {
    recording.audio = await blobToBase64(blob);
  }
  return recording;
};

export const loadRecordingBlob = async (recording) => {
  if (recording.audio) {
    return base64ToBlob(recording.audio, recording.mimeType);
  }
  const { fs } = await loadTauriModules();
  const bytes = await fs.readFile(recording.filePath);
  return new Blob([bytes], { type: recording.mimeType || 'audio/webm' });
};

// Returns something an <audio> element can play. File-backed recordings get an
// object URL the caller must revoke.
export const loadRecordingUrl = async (recording) => {
  if (recording.audio) return recording.audio;
  return URL.createObjectURL(await loadRecordingBlob(recording));
};

export const hasEmbeddedAudio = (recording) =>
  typeof recording?.audio === 'string' && recording.audio.startsWith('data:');

// Writes every inline recording to its own file, once per recording id.
// Returns a map of recording id -> file path for the ones that were written
// and verified; anything that failed stays inline and is reported in `failures`.
// A copy of the data file is made first, before anything changes.
export const migrateEmbeddedAudio = async (recordings) => {
  const { fs } = await loadTauriModules();
  const storagePath = getStoragePath();
  if (!fs || !storagePath) return { paths: {}, failures: [] };

  const backupPath = joinPath(storagePath, BACKUP_FILENAME);
  if (!(await fs.exists(backupPath))) {
    await fs.copyFile(joinPath(storagePath, DATA_FILENAME), backupPath);
  }

  const paths = {};
  const failures = [];
  for (const recording of recordings) {
    if (!hasEmbeddedAudio(recording) || paths[recording.id]) continue;
    try {
      const base64 = recording.audio.slice(recording.audio.indexOf(',') + 1);
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const mimeType = recording.mimeType || recording.audio.slice(5, recording.audio.indexOf(';'));
      const date = recording.createdAt ? new Date(recording.createdAt) : new Date(Number(recording.id));
      paths[recording.id] = await writeAudioFile(bytes, mimeType, recording.name, date, { reuseExisting: true });
    } catch (err) {
      console.error(`Could not move recording "${recording.name}" to a file:`, err);
      failures.push(recording.name || recording.id);
    }
  }
  return { paths, failures, backupPath };
};

// Swaps the inline audio for the file path on any recording that was migrated
export const applyMigratedPaths = (recording, paths) => {
  if (!hasEmbeddedAudio(recording) || !paths[recording.id]) return recording;
  // eslint-disable-next-line no-unused-vars
  const { audio, ...rest } = recording;
  return { ...rest, type: 'audio', filePath: paths[recording.id] };
};
