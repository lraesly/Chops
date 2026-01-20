import { useState, useRef } from 'react';
import { FolderOpen, Download, Upload, HardDrive, Check, AlertCircle, RotateCcw, Palette } from 'lucide-react';
import {
  getStoragePath,
  setStoragePath,
  pickStorageFolder,
  readDataFromFile,
  writeDataToFile,
  isTauri,
  clearStoragePath,
} from '../hooks/useFileStorage';

const THEMES = [
  { id: 'violet', name: 'Purple Rain' },
  { id: 'emerald', name: 'Green Room' },
  { id: 'sky', name: 'Blue Note' },
  { id: 'amber', name: 'Golden Hour' },
  { id: 'rose', name: 'La Vie en Rose' },
  { id: 'indigo', name: 'Mood Indigo' },
];

export function Settings({
  practiceItems,
  archivedItems,
  sessions,
  userTags,
  onImportData,
  onResetStorage,
  colorTheme,
  onColorThemeChange,
}) {
  const [currentPath, setCurrentPath] = useState(getStoragePath());
  const [message, setMessage] = useState(null);
  const [isChangingLocation, setIsChangingLocation] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const fileInputRef = useRef(null);
  const inTauri = isTauri();

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleResetStorage = async () => {
    if (isResetting) return;
    setIsResetting(true);

    try {
      const { ask } = await import('@tauri-apps/plugin-dialog');
      const confirmed = await ask(
        'This will reset your storage configuration. You will need to set it up again on the next app restart. Continue?',
        { title: 'Reset Storage', kind: 'warning' }
      );

      if (confirmed) {
        onResetStorage();
        setCurrentPath(null);
        showMessage('Storage configuration reset. The app will reload.');
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (error) {
      console.error('Error showing dialog:', error);
    }
    setIsResetting(false);
  };

  const handleChangeLocation = async () => {
    if (!inTauri) return;

    setIsChangingLocation(true);
    try {
      const newPath = await pickStorageFolder();
      if (newPath) {
        // Read current data
        const oldPath = getStoragePath();
        let currentData = {};
        if (oldPath) {
          currentData = await readDataFromFile(oldPath) || {};
        }

        // Write to new location
        await writeDataToFile(newPath, currentData);

        // Update stored path
        setStoragePath(newPath);
        setCurrentPath(newPath);

        showMessage('Storage location changed successfully!');
      }
    } catch (error) {
      console.error('Error changing location:', error);
      showMessage('Failed to change storage location', 'error');
    }
    setIsChangingLocation(false);
  };

  const handleExport = async () => {
    const data = {
      practiceItems,
      archivedItems,
      practiceSessions: sessions,
      userTags,
      colorTheme,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };

    const jsonContent = JSON.stringify(data, null, 2);
    const defaultFileName = `practice-log-backup-${new Date().toISOString().split('T')[0]}.json`;

    if (inTauri) {
      try {
        const { save } = await import('@tauri-apps/plugin-dialog');
        const { writeTextFile } = await import('@tauri-apps/plugin-fs');

        const filePath = await save({
          defaultPath: defaultFileName,
          filters: [{ name: 'JSON', extensions: ['json'] }],
          title: 'Save Backup File',
        });

        if (filePath) {
          await writeTextFile(filePath, jsonContent);
          showMessage('Backup saved successfully!');
        }
      } catch (error) {
        console.error('Error exporting:', error);
        showMessage('Failed to export backup', 'error');
      }
    } else {
      // Browser fallback
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showMessage('Data exported successfully!');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate the data structure
      if (!data.practiceItems || !data.practiceSessions) {
        throw new Error('Invalid backup file format');
      }

      // Confirm import
      const confirmed = window.confirm(
        'This will replace all your current data with the imported data. Are you sure you want to continue?'
      );

      if (confirmed) {
        onImportData({
          practiceItems: data.practiceItems || [],
          archivedItems: data.archivedItems || [],
          sessions: data.practiceSessions || [],
          userTags: data.userTags || [],
        });
        showMessage('Data imported successfully!');
      }
    } catch (error) {
      console.error('Error importing data:', error);
      showMessage('Failed to import data. Please check the file format.', 'error');
    }

    // Reset file input
    event.target.value = '';
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Settings</h2>

      {/* Message */}
      {message && (
        <div
          className={`flex items-center gap-2 p-4 rounded-xl ${
            message.type === 'error'
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
          }`}
        >
          {message.type === 'error' ? <AlertCircle size={20} /> : <Check size={20} />}
          {message.text}
        </div>
      )}

      {/* Color Theme */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 md:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/40 rounded-lg">
            <Palette size={20} className="text-primary-600 dark:text-primary-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 dark:text-white">Color Theme</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Set the vibe for your practice sessions
            </p>
          </div>
          <select
            value={colorTheme}
            onChange={(e) => onColorThemeChange(e.target.value)}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
          >
            {THEMES.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Storage Location (Tauri only) */}
      {inTauri && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 md:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/40 rounded-lg">
              <HardDrive size={20} className="text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-white">Storage Location</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Where your practice data is saved
              </p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 mb-4">
            <p className="text-sm text-gray-700 dark:text-gray-300 break-all font-mono">
              {currentPath || 'Not configured'}
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleChangeLocation}
              disabled={isChangingLocation}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              <FolderOpen size={18} />
              {isChangingLocation ? 'Changing...' : 'Change Location'}
            </button>
            {onResetStorage && (
              <button
                onClick={handleResetStorage}
                disabled={isResetting}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-xl hover:bg-red-200 dark:hover:bg-red-800/40 transition-colors disabled:opacity-50"
              >
                <RotateCcw size={18} />
                {isResetting ? 'Resetting...' : 'Reset Storage'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Backup & Restore */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 md:p-6">
        <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Backup & Restore</h3>

        <div className="space-y-4">
          {/* Export */}
          <div className="flex items-start gap-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
              <Download size={20} className="text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-800 dark:text-white">Export Data</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Download all your practice data as a JSON file
              </p>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
              >
                <Download size={18} />
                Export Backup
              </button>
            </div>
          </div>

          <hr className="border-gray-200 dark:border-gray-700" />

          {/* Import */}
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
              <Upload size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-800 dark:text-white">Import Data</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Restore from a previously exported backup file
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
              <button
                onClick={handleImportClick}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Upload size={18} />
                Import Backup
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Data Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 md:p-6">
        <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Data Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {practiceItems.length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Practice Items</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {sessions.length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Sessions</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {archivedItems.length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Archived Items</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {userTags.length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tags</p>
          </div>
        </div>
      </div>
    </div>
  );
}
