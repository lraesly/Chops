// Other tools (e.g. a script that pulls action items out of a coach's feedback)
// can't write to the data file while Chops is open: the app holds to-dos in memory
// and would overwrite them on the next save. Instead they drop JSON files into
// "<data folder>/To Do Inbox/". Chops picks them up on launch and whenever the
// window regains focus, then moves each imported file to the Trash.
//
// File format: { "todos": [{ "id", "name", "source", "sourceDate", "note", "link" }] }
// Only "name" is required. Supplying a stable "id" makes re-imports harmless.
import { isTauri, loadTauriModules, getStoragePath } from './useFileStorage';
import { joinPath } from './videoStorage';

export const TODO_INBOX_FOLDER = 'To Do Inbox';

const OPTIONAL_FIELDS = ['source', 'sourceDate', 'note', 'link'];

const toTodo = (raw, index) => {
  if (!raw || typeof raw.name !== 'string' || !raw.name.trim()) return null;
  const todo = {
    id: typeof raw.id === 'string' && raw.id ? raw.id : `${Date.now()}-${index}`,
    name: raw.name.trim(),
    createdAt: new Date().toISOString(),
  };
  for (const field of OPTIONAL_FIELDS) {
    if (typeof raw[field] === 'string' && raw[field].trim()) todo[field] = raw[field].trim();
  }
  return todo;
};

// Reads every *.json file in the inbox. Returns { todos, files } where files are
// the paths that parsed cleanly (a half-written file is left for next time).
export const readTodoInbox = async () => {
  if (!isTauri()) return { todos: [], files: [] };
  const storagePath = getStoragePath();
  if (!storagePath) return { todos: [], files: [] };

  const { fs } = await loadTauriModules();
  if (!fs) return { todos: [], files: [] };

  const folder = joinPath(storagePath, TODO_INBOX_FOLDER);
  if (!(await fs.exists(folder))) return { todos: [], files: [] };

  const entries = await fs.readDir(folder);
  const names = entries
    .filter((e) => e.isFile && e.name.toLowerCase().endsWith('.json'))
    .map((e) => e.name)
    .sort();

  const todos = [];
  const files = [];
  for (const name of names) {
    const filePath = joinPath(folder, name);
    try {
      const data = JSON.parse(await fs.readTextFile(filePath));
      const list = Array.isArray(data) ? data : data?.todos;
      if (!Array.isArray(list)) throw new Error('no "todos" array');
      list.forEach((raw, i) => {
        const todo = toTodo(raw, todos.length + i);
        if (todo) todos.push(todo);
      });
      files.push(filePath);
    } catch (error) {
      console.warn(`Skipping to-do inbox file ${name}:`, error.message);
    }
  }
  return { todos, files };
};

export const clearTodoInboxFiles = async (files) => {
  const { invoke } = await import('@tauri-apps/api/core');
  for (const filePath of files) {
    try {
      await invoke('trash_file', { path: filePath });
    } catch (error) {
      console.error(`Could not move ${filePath} to the Trash:`, error);
    }
  }
};

// True for web links; anything else is treated as a local file path
export const isWebLink = (link) => /^https?:\/\//i.test(link || '');

export const openLink = async (link) => {
  if (!link) return;
  if (isWebLink(link)) {
    const { open } = await import('@tauri-apps/plugin-shell');
    await open(link);
  } else {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('open_file', { path: link });
  }
};
