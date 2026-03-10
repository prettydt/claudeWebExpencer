import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'transactions' | 'stats' | 'recurring' | 'settings';
  onTabChange: (tab: 'transactions' | 'stats' | 'recurring' | 'settings') => void;
}

export function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const tabs = [
    { id: 'transactions' as const, label: '账单', icon: '📝' },
    { id: 'stats' as const, label: '统计', icon: '📊' },
    { id: 'recurring' as const, label: '重复', icon: '🔄' },
    { id: 'settings' as const, label: '设置', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16">
      {/* Content */}
      <div className="max-w-2xl mx-auto">
        {children}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 safe-area-inset-bottom">
        <div className="max-w-2xl mx-auto flex justify-around items-center h-16">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                activeTab === tab.id
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <span className="text-2xl mb-1">{tab.icon}</span>
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
