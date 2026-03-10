import { useState } from 'react';
import { Layout } from './components/Layout';
import { TransactionsPage } from './pages/TransactionsPage';
import { StatsPage } from './pages/StatsPage';
import { RecurringPage } from './pages/RecurringPage';
import { SettingsPage } from './pages/SettingsPage';
import { DarkModeProvider } from './contexts/DarkModeContext';
import { useInitializeData } from './hooks/useInitializeData';

type Tab = 'transactions' | 'stats' | 'recurring' | 'settings';

function AppContent() {
  const { isInitialized, isLoading } = useInitializeData();
  const [activeTab, setActiveTab] = useState<Tab>('transactions');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-4xl mb-4">💰</div>
          <div className="text-gray-600 dark:text-gray-400">加载中...</div>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center text-red-600">
          <div className="text-4xl mb-4">⚠️</div>
          <div>初始化失败，请刷新页面重试</div>
        </div>
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'transactions' && <TransactionsPage />}
      {activeTab === 'stats' && <StatsPage />}
      {activeTab === 'recurring' && <RecurringPage />}
      {activeTab === 'settings' && <SettingsPage />}
    </Layout>
  );
}

function App() {
  return (
    <DarkModeProvider>
      <AppContent />
    </DarkModeProvider>
  );
}

export default App;
