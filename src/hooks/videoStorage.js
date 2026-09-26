// Video recordings are too large for the JSON data file, so they live as
// standalone files in a user-configurable folder. Sessions only store the path.
import { isTauri, loadTauriModules, readAppConfig, writeAppConfig } from './useFileStorage';

export const joinPath = (dir, name) => {
  const separator = dir.endsWith('/') || dir.endsWith('\\') ? '' : '/';
  return `${dir}${separator}${name}`;
};

// Default: ~/Movies/Chops on macOS (the platform's Videos folder elsewhere)
export const getDefaultVideoFolder = async () => {
  if (!isTauri()) return null;
  const { path } = await loadTauriModules();
  if (!path) return null;
  return joinPath(await path.videoDir(), 'Chops');
};

export const getVideoFolder = async () => {
  if (!isTauri()) return null;
  const config = await readAppConfig();
  return config.videoFolder || getDefaultVideoFolder();
};

// Pass null to go back to the default folder
export const setVideoFolder = async (folder) => {
  const config = await readAppConfig();
  if (folder) {
    config.videoFolder = folder;
  } else {
    delete config.videoFolder;
  }
  await writeAppConfig(config);
};

export const pickVideoFolder = async () => {
  if (!isTauri()) return null;
  const { dialog } = await loadTauriModules();
  return dialog.open({
    directory: true,
    multiple: false,
    defaultPath: await getVideoFolder(),
    title: 'Choose where to save video recordings',
  });
};

export const videoExtension = (mimeType) =>
  (mimeType || '').startsWith('video/webm') ? 'webm' : 'mp4';

const pad = (n) => String(n).padStart(2, '0');

export const timestamp = (date = new Date()) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
  `${pad(date.getHours())}.${pad(date.getMinutes())}.${pad(date.getSeconds())}`;

export const safeFileName = (name) =>
  name.replace(/[/\\:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim().slice(0, 80);

// Creates an empty file for a new take and returns its full path
export const createVideoFile = async (mimeType) => {
  const { fs } = await loadTauriModules();
  const folder = await getVideoFolder();
  await fs.mkdir(folder, { recursive: true });
  const filePath = joinPath(folder, `Chops ${timestamp()}.${videoExtension(mimeType)}`);
  await fs.writeFile(filePath, new Uint8Array());
  return filePath;
};

export const appendToVideoFile = async (filePath, blob) => {
  const { fs } = await loadTauriModules();
  await fs.writeFile(filePath, new Uint8Array(await blob.arrayBuffer()), { append: true });
};

// Renames a take to "<date time> <name>.<ext>" in the same folder; returns the new path
export const renameVideoFile = async (filePath, name) => {
  const { fs } = await loadTauriModules();
  const slash = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
  const folder = filePath.slice(0, slash);
  const extension = filePath.slice(filePath.lastIndexOf('.'));
  const base = filePath.slice(slash + 1, filePath.lastIndexOf('.'));
  const cleanName = safeFileName(name);
  if (!cleanName) return filePath;

  let newPath = joinPath(folder, `${base} ${cleanName}${extension}`);
  for (let n = 2; await fs.exists(newPath); n++) {
    newPath = joinPath(folder, `${base} ${cleanName} (${n})${extension}`);
  }
  await fs.rename(filePath, newPath);
  return newPath;
};

export const videoFileExists = async (filePath) => {
  const { fs } = await loadTauriModules();
  return fs.exists(filePath);
};

// Loads a saved video into memory and returns an object URL for <video>.
// Caller must URL.revokeObjectURL() it when done.
export const loadVideoUrl = async (filePath, mimeType) => {
  const { fs } = await loadTauriModules();
  const bytes = await fs.readFile(filePath);
  return URL.createObjectURL(new Blob([bytes], { type: mimeType || 'video/mp4' }));
};

export const revealLabel = /Mac/i.test(navigator.platform)
  ? 'Show in Finder'
  : /Win/i.test(navigator.platform) ? 'Show in Explorer' : 'Show in folder';

export const revealVideoFile = async (filePath) => {
  const { invoke } = await import('@tauri-apps/api/core');
  await invoke('reveal_file', { path: filePath });
};

// Moves a recording's file to the Trash (Recycle Bin on Windows); no-op if it's already gone
export const trashFile = async (filePath) => {
  const { invoke } = await import('@tauri-apps/api/core');
  await invoke('trash_file', { path: filePath });
};

export const openVideoFolder = async () => {
  const { fs } = await loadTauriModules();
  const folder = await getVideoFolder();
  await fs.mkdir(folder, { recursive: true });
  const { invoke } = await import('@tauri-apps/api/core');
  await invoke('open_file', { path: folder });
};

export const openVideoFile = async (filePath) => {
  const { invoke } = await import('@tauri-apps/api/core');
  await invoke('open_file', { path: filePath });
};
