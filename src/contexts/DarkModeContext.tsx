import React, { createContext, useContext, useEffect, useState } from 'react';
import { settingsRepository } from '../repositories';

type DarkMode = 'light' | 'dark' | 'system';

interface DarkModeContextType {
  darkMode: DarkMode;
  setDarkMode: (mode: DarkMode) => void;
  isDark: boolean;
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkModeState] = useState<DarkMode>('system');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // 加载设置
    settingsRepository.get().then(settings => {
      if (settings) {
        setDarkModeState(settings.darkMode);
      }
    });
  }, []);

  useEffect(() => {
    const updateDarkMode = () => {
      if (darkMode === 'system') {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDark(systemDark);
        document.documentElement.classList.toggle('dark', systemDark);
      } else {
        const isDarkMode = darkMode === 'dark';
        setIsDark(isDarkMode);
        document.documentElement.classList.toggle('dark', isDarkMode);
      }
    };

    updateDarkMode();

    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateDarkMode);

    return () => {
      mediaQuery.removeEventListener('change', updateDarkMode);
    };
  }, [darkMode]);

  const setDarkMode = async (mode: DarkMode) => {
    setDarkModeState(mode);
    
    // 保存到设置
    const settings = await settingsRepository.get();
    if (settings) {
      await settingsRepository.save({
        ...settings,
        darkMode: mode,
        updatedAt: Date.now(),
      });
    }
  };

  return (
    <DarkModeContext.Provider value={{ darkMode, setDarkMode, isDark }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error('useDarkMode must be used within DarkModeProvider');
  }
  return context;
}
