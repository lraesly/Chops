import { Music, Plus, Play, BarChart3 } from 'lucide-react';
import { ChopsIcon } from './ChopsIcon';

export function WelcomeModal({ onGetStarted, onDismiss }) {
  const steps = [
    {
      icon: Plus,
      title: 'Add Practice Items',
      description: 'Create a list of things you want to practice - scales, songs, techniques',
    },
    {
      icon: Play,
      title: 'Start a Session',
      description: 'Add items to your session queue and track time spent on each',
    },
    {
      icon: BarChart3,
      title: 'Track Progress',
      description: 'Review your practice history and watch your skills grow',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl mb-4">
            <ChopsIcon className="text-white" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Welcome to Chops!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Build your skills, track your progress
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-4 mb-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900/40 rounded-lg flex items-center justify-center">
                  <Icon size={18} className="text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 dark:text-white">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={onGetStarted}
            className="w-full px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium"
          >
            Get Started
          </button>
          <button
            onClick={onDismiss}
            className="w-full px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors text-sm"
          >
            I'll explore on my own
          </button>
        </div>
      </div>
    </div>
  );
}
