import { useState, useEffect } from 'react';
import { FolderOpen, Check, HardDrive } from 'lucide-react';
import { getDefaultStoragePath } from '../hooks/useFileStorage';

export function StorageSetup({ onSetup, onChooseFolder }) {
  const [defaultPath, setDefaultPath] = useState('');
  const [isSettingUp, setIsSettingUp] = useState(false);

  useEffect(() => {
    const loadDefaultPath = async () => {
      const path = await getDefaultStoragePath();
      setDefaultPath(path || 'Documents/Chops');
    };
    loadDefaultPath();
  }, []);

  const handleUseDefault = async () => {
    setIsSettingUp(true);
    await onSetup();
    setIsSettingUp(false);
  };

  const handleChooseFolder = async () => {
    setIsSettingUp(true);
    await onChooseFolder();
    setIsSettingUp(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <HardDrive className="text-primary-600 dark:text-primary-400" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Welcome to Practice Log
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Choose where to store your practice data. You can put it in a synced folder (like Dropbox or iCloud) to access it from multiple devices.
          </p>
        </div>

        <div className="space-y-3">
          {/* Default location option */}
          <button
            onClick={handleUseDefault}
            disabled={isSettingUp}
            className="w-full p-4 border-2 border-primary-200 dark:border-primary-700 rounded-xl hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors text-left group disabled:opacity-50"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/40 rounded-lg group-hover:bg-primary-200 dark:group-hover:bg-primary-900/60 transition-colors">
                <Check size={20} className="text-primary-600 dark:text-primary-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800 dark:text-white">Use default location</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 break-all">
                  {defaultPath}
                </p>
              </div>
            </div>
          </button>

          {/* Custom location option */}
          <button
            onClick={handleChooseFolder}
            disabled={isSettingUp}
            className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left group disabled:opacity-50"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors">
                <FolderOpen size={20} className="text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800 dark:text-white">Choose a folder</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Pick a custom location (e.g., Dropbox, iCloud Drive)
                </p>
              </div>
            </div>
          </button>
        </div>

        {isSettingUp && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
            Setting up...
          </p>
        )}
      </div>
    </div>
  );
}
