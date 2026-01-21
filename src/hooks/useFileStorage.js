import { useState, useEffect, useCallback } from 'react';

// Check if running in Tauri (supports both Tauri 1.x and 2.x)
const isTauri = () => {
  if (typeof window === 'undefined') return false;
  // Tauri 2.x uses __TAURI_INTERNALS__, Tauri 1.x uses __TAURI__
  return !!(window.__TAURI_INTERNALS__ || window.__TAURI__);
};

// Timeout wrapper for async operations
const withTimeout = (promise, ms = 5000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), ms)
    )
  ]);
};

// Dynamic imports for Tauri APIs (only load when in Tauri)
let tauriFs = null;
let tauriDialog = null;
let tauriPath = null;
let modulesLoading = null;

const loadTauriModules = async () => {
  if (!isTauri()) {
    return { fs: null, dialog: null, path: null };
  }

  if (tauriFs) {
    return { fs: tauriFs, dialog: tauriDialog, path: tauriPath };
  }

  // Prevent multiple concurrent loads
  if (modulesLoading) {
    return modulesLoading;
  }

  modulesLoading = (async () => {
    try {
      console.log('Loading Tauri modules...');
      const [fs, dialog, path] = await withTimeout(Promise.all([
        import('@tauri-apps/plugin-fs'),
        import('@tauri-apps/plugin-dialog'),
        import('@tauri-apps/api/path'),
      ]), 10000);
      console.log('Tauri modules loaded successfully');
      tauriFs = fs;
      tauriDialog = dialog;
      tauriPath = path;
      return { fs: tauriFs, dialog: tauriDialog, path: tauriPath };
    } catch (error) {
      console.error('Failed to load Tauri modules:', error);
      modulesLoading = null;
      return { fs: null, dialog: null, path: null };
    }
  })();

  return modulesLoading;
};

const STORAGE_PATH_KEY = 'practiceLog_storagePath';
const DATA_FILENAME = 'practice-log-data.json';
const CONFIG_FILENAME = 'config.json';

// Cache for app config
let appConfigCache = null;
let appConfigDir = null;

// Get the app config directory (platform-specific app data location)
const getAppConfigDir = async () => {
  if (appConfigDir) return appConfigDir;
  if (!isTauri()) return null;

  try {
    const { path } = await loadTauriModules();
    if (!path) return null;
    appConfigDir = await withTimeout(path.appConfigDir(), 5000);
    console.log('App config dir:', appConfigDir);
    return appConfigDir;
  } catch (error) {
    console.error('Error getting app config dir:', error);
    return null;
  }
};

// Read app config from the app data directory
const readAppConfig = async () => {
  if (appConfigCache) return appConfigCache;
  if (!isTauri()) return {};

  try {
    const { fs } = await loadTauriModules();
    const configDir = await getAppConfigDir();
    if (!fs || !configDir) return {};

    const configPath = `${configDir}${CONFIG_FILENAME}`;
    try {
      const content = await withTimeout(fs.readTextFile(configPath), 5000);
      appConfigCache = JSON.parse(content);
      console.log('App config loaded:', appConfigCache);
      return appConfigCache;
    } catch (readError) {
      // Config doesn't exist yet
      console.log('No config file yet, using defaults');
      return {};
    }
  } catch (error) {
    console.error('Error reading app config:', error);
    return {};
  }
};

// Write app config to the app data directory
const writeAppConfig = async (config) => {
  if (!isTauri()) return;

  try {
    const { fs } = await loadTauriModules();
    const configDir = await getAppConfigDir();
    if (!fs || !configDir) return;

    // Ensure config directory exists
    try {
      await withTimeout(fs.mkdir(configDir, { recursive: true }), 5000);
    } catch (e) {
      // Directory might already exist
    }

    const configPath = `${configDir}${CONFIG_FILENAME}`;
    await withTimeout(fs.writeTextFile(configPath, JSON.stringify(config, null, 2)), 5000);
    appConfigCache = config;
    console.log('App config saved:', config);
  } catch (error) {
    console.error('Error writing app config:', error);
  }
};

// Write queue to prevent concurrent file writes from overwriting each other
let writeQueue = Promise.resolve();
let pendingWrites = {};
let writeTimeout = null;

const queueWrite = (key, value) => {
  console.log(`queueWrite called for key: ${key}, value:`, value);

  // Store the pending write
  pendingWrites[key] = value;

  // Debounce writes - wait 100ms for more changes before writing
  if (writeTimeout) {
    clearTimeout(writeTimeout);
  }

  writeTimeout = setTimeout(() => {
    const writesToProcess = { ...pendingWrites };
    pendingWrites = {};
    writeTimeout = null;

    console.log('Processing writes for keys:', Object.keys(writesToProcess));

    // Chain this write onto the queue
    writeQueue = writeQueue.then(async () => {
      const storagePath = getStoragePath();
      if (!storagePath) {
        console.log('No storage path, skipping write');
        return;
      }

      try {
        // Read current data
        const allData = await readDataFromFile(storagePath) || {};
        console.log('Current data before write:', allData);

        // Apply all pending writes
        Object.assign(allData, writesToProcess);
        console.log('Data after merge:', allData);

        // Write back
        await writeDataToFile(storagePath, allData);
        console.log('Batch write completed for keys:', Object.keys(writesToProcess));
      } catch (error) {
        console.error('Error in queued write:', error);
      }
    });
  }, 100);
};

// Get the configured storage path (sync - from localStorage cache)
export const getStoragePath = () => {
  return localStorage.getItem(STORAGE_PATH_KEY);
};

// Set the storage path (updates both localStorage and app config)
export const setStoragePath = async (path) => {
  localStorage.setItem(STORAGE_PATH_KEY, path);
  // Also save to app config for persistence across reinstalls
  if (isTauri()) {
    const config = await readAppConfig();
    config.storagePath = path;
    await writeAppConfig(config);
  }
};

// Clear the storage path (for reset functionality)
export const clearStoragePath = async () => {
  localStorage.removeItem(STORAGE_PATH_KEY);
  appConfigCache = null;
  // Also clear from app config
  if (isTauri()) {
    const config = await readAppConfig();
    delete config.storagePath;
    await writeAppConfig(config);
  }
};

// Load storage path from app config (call on startup)
export const loadStoragePathFromConfig = async () => {
  if (!isTauri()) return null;

  const config = await readAppConfig();
  if (config.storagePath) {
    // Sync to localStorage for quick access
    localStorage.setItem(STORAGE_PATH_KEY, config.storagePath);
    return config.storagePath;
  }
  return null;
};

// Get default storage path
export const getDefaultStoragePath = async () => {
  if (!isTauri()) return null;
  try {
    console.log('getDefaultStoragePath: Loading modules...');
    const { path } = await loadTauriModules();

    if (!path) {
      console.log('getDefaultStoragePath: No path module available');
      return null;
    }

    const documentsDir = await withTimeout(path.documentDir(), 5000);
    console.log('Documents dir:', documentsDir);
    // Ensure proper path separator
    const separator = documentsDir.endsWith('/') || documentsDir.endsWith('\\') ? '' : '/';
    const fullPath = `${documentsDir}${separator}Music Practice Log`;
    console.log('Default path:', fullPath);
    return fullPath;
  } catch (error) {
    console.error('Error getting default path:', error);
    return null;
  }
};

// Open folder picker dialog
export const pickStorageFolder = async () => {
  if (!isTauri()) return null;

  const { dialog } = await loadTauriModules();
  const defaultPath = await getDefaultStoragePath();

  const selected = await dialog.open({
    directory: true,
    multiple: false,
    defaultPath: defaultPath,
    title: 'Choose where to store your practice data',
  });

  return selected;
};

// Ensure the storage directory exists
const ensureStorageDir = async (storagePath) => {
  if (!isTauri()) return;

  try {
    const { fs } = await loadTauriModules();

    if (!fs) {
      console.log('ensureStorageDir: No fs module available');
      return;
    }

    console.log('Creating directory (if needed):', storagePath);
    // Just try to create it - mkdir with recursive:true won't error if it exists
    await withTimeout(fs.mkdir(storagePath, { recursive: true }), 5000);
    console.log('Directory ensured:', storagePath);
  } catch (error) {
    // Don't throw - try to continue anyway (might already exist or have permission)
    console.log('Directory may already exist or creation skipped:', error.message);
  }
};

// Read all data from file
export const readDataFromFile = async (storagePath) => {
  if (!isTauri()) return null;

  try {
    console.log('readDataFromFile: Loading modules...');
    const { fs } = await loadTauriModules();

    if (!fs) {
      console.log('readDataFromFile: No fs module available');
      return {};
    }

    const filePath = `${storagePath}/${DATA_FILENAME}`;
    console.log('Reading from:', filePath);

    // Try to read the file directly with timeout - it will throw if it doesn't exist
    try {
      const content = await withTimeout(fs.readTextFile(filePath), 5000);
      console.log('File read successfully');
      return JSON.parse(content);
    } catch (readError) {
      // File doesn't exist, can't be read, or timed out - that's OK, return empty
      console.log('File does not exist or cannot be read:', readError.message);
      return {};
    }
  } catch (error) {
    console.error('Error in readDataFromFile:', error);
    return {};
  }
};

// Write all data to file
export const writeDataToFile = async (storagePath, data) => {
  if (!isTauri()) return;

  try {
    const { fs } = await loadTauriModules();

    if (!fs) {
      console.log('writeDataToFile: No fs module available');
      return;
    }

    await ensureStorageDir(storagePath);

    const filePath = `${storagePath}/${DATA_FILENAME}`;
    const content = JSON.stringify(data, null, 2);

    await withTimeout(fs.writeTextFile(filePath, content), 5000);
    console.log('File written successfully to:', filePath);
  } catch (error) {
    console.error('Error writing data file:', error);
    // Don't throw - let app continue working
  }
};

// Hook for checking if storage is configured
export function useStorageSetup() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [storagePath, setStoragePathState] = useState(null);

  useEffect(() => {
    const checkSetup = async () => {
      // If not in Tauri, we'll use localStorage - always "configured"
      if (!isTauri()) {
        setIsConfigured(true);
        setIsLoading(false);
        return;
      }

      // First, try to load from app config (persists across reinstalls)
      const configPath = await loadStoragePathFromConfig();
      if (configPath) {
        setStoragePathState(configPath);
        setIsConfigured(true);
        setIsLoading(false);
        return;
      }

      // Fall back to localStorage (for backwards compatibility)
      const savedPath = getStoragePath();
      if (savedPath) {
        setStoragePathState(savedPath);
        setIsConfigured(true);
        // Migrate to app config
        await setStoragePath(savedPath);
      }
      setIsLoading(false);
    };

    checkSetup();
  }, []);

  const setupStorage = useCallback(async (customPath = null) => {
    try {
      let pathToUse = customPath;

      if (!pathToUse) {
        // Use default path
        pathToUse = await getDefaultStoragePath();
      }

      if (pathToUse) {
        // Save the path to both localStorage and app config
        await setStoragePath(pathToUse);
        setStoragePathState(pathToUse);
        setIsConfigured(true);
        console.log('Storage configured:', pathToUse);
      }

      return pathToUse;
    } catch (error) {
      console.error('Error setting up storage:', error);
      // Fall back to configured anyway so app can work
      setIsConfigured(true);
      return null;
    }
  }, []);

  const chooseFolder = useCallback(async () => {
    const selected = await pickStorageFolder();
    if (selected) {
      await setupStorage(selected);
      return selected;
    }
    return null;
  }, [setupStorage]);

  const resetStorage = useCallback(async () => {
    await clearStoragePath();
    setStoragePathState(null);
    setIsConfigured(false);
    console.log('Storage configuration reset');
  }, []);

  return {
    isConfigured,
    isLoading,
    storagePath,
    setupStorage,
    chooseFolder,
    resetStorage,
    isTauri: isTauri(),
  };
}

// Hook that replaces useLocalStorage with file-based storage
export function useFileStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasUserModified, setHasUserModified] = useState(false);

  // Load initial value (only once on mount)
  useEffect(() => {
    const loadValue = async () => {
      if (!isTauri()) {
        // Fallback to localStorage in browser
        try {
          const item = window.localStorage.getItem(key);
          if (item) {
            setStoredValue(JSON.parse(item));
          }
        } catch (error) {
          console.error(`Error reading localStorage key "${key}":`, error);
        }
        setIsLoaded(true);
        return;
      }

      const storagePath = getStoragePath();
      if (!storagePath) {
        setIsLoaded(true);
        return;
      }

      try {
        const allData = await readDataFromFile(storagePath);
        if (allData && key in allData) {
          setStoredValue(allData[key]);
        }
      } catch (error) {
        console.error(`Error reading file storage key "${key}":`, error);
      }
      setIsLoaded(true);
    };

    loadValue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]); // Only depend on key, not initialValue (which creates new refs each render)

  // Save value when it changes (only after user modification)
  useEffect(() => {
    if (!isLoaded || !hasUserModified) return;

    if (!isTauri()) {
      // Fallback to localStorage in browser
      try {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
      return;
    }

    const storagePath = getStoragePath();
    if (!storagePath) return;

    // Use the write queue to prevent race conditions
    queueWrite(key, storedValue);
  }, [key, storedValue, isLoaded, hasUserModified]);

  // Wrapper to track user modifications
  const setValue = useCallback((valueOrFn) => {
    setHasUserModified(true);
    setStoredValue(valueOrFn);
  }, [key]);

  return [storedValue, setValue, isLoaded];
}

export { isTauri };
