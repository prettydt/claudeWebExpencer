import React, { useState } from 'react';
import { useDarkMode } from '../contexts/DarkModeContext';
import { dataRepository } from '../repositories';

export function SettingsPage() {
  const { darkMode, setDarkMode } = useDarkMode();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const data = await dataRepository.exportData();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expense-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      alert('数据导出成功！');
    } catch (error) {
      console.error('Export failed:', error);
      alert('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (confirm('导入将覆盖所有现有数据，确定要继续吗？')) {
        await dataRepository.importData(data);
        alert('数据导入成功！页面将刷新。');
        window.location.reload();
      }
    } catch (error) {
      console.error('Import failed:', error);
      alert('导入失败，请检查文件格式');
    } finally {
      setIsImporting(false);
      e.target.value = ''; // Reset input
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 z-10">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">设置</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Dark Mode */}
        <div className="card p-4">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">外观</h2>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
              <input
                type="radio"
                name="darkMode"
                value="light"
                checked={darkMode === 'light'}
                onChange={(e) => setDarkMode(e.target.value as any)}
                className="w-4 h-4"
              />
              <span className="text-gray-900 dark:text-gray-100">浅色模式</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
              <input
                type="radio"
                name="darkMode"
                value="dark"
                checked={darkMode === 'dark'}
                onChange={(e) => setDarkMode(e.target.value as any)}
                className="w-4 h-4"
              />
              <span className="text-gray-900 dark:text-gray-100">深色模式</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
              <input
                type="radio"
                name="darkMode"
                value="system"
                checked={darkMode === 'system'}
                onChange={(e) => setDarkMode(e.target.value as any)}
                className="w-4 h-4"
              />
              <span className="text-gray-900 dark:text-gray-100">跟随系统</span>
            </label>
          </div>
        </div>

        {/* Data Management */}
        <div className="card p-4">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">数据管理</h2>
          <div className="space-y-3">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full py-3 rounded-lg font-medium bg-primary-600 hover:bg-primary-700 text-white transition-colors disabled:opacity-50"
            >
              {isExporting ? '导出中...' : '导出数据 (JSON)'}
            </button>
            
            <div>
              <input
                type="file"
                id="import-file"
                accept=".json"
                onChange={handleImport}
                disabled={isImporting}
                className="hidden"
              />
              <label
                htmlFor="import-file"
                className={`block w-full py-3 rounded-lg font-medium text-center transition-colors ${
                  isImporting
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 cursor-pointer'
                }`}
              >
                {isImporting ? '导入中...' : '导入数据 (JSON)'}
              </label>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              导入数据将覆盖所有现有数据，请谨慎操作
            </p>
          </div>
        </div>

        {/* About */}
        <div className="card p-4">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">关于</h2>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex justify-between">
              <span>版本</span>
              <span>1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>币种</span>
              <span>人民币 (CNY)</span>
            </div>
            <div className="flex justify-between">
              <span>数据存储</span>
              <span>本地 IndexedDB</span>
            </div>
          </div>
        </div>

        {/* Help */}
        <div className="card p-4">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">使用说明</h2>
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">记账</div>
              <p>点击账单页面右上角的 + 按钮即可快速添加一笔账单</p>
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">统计</div>
              <p>查看月度收支统计和分类占比，设置预算并监控使用情况</p>
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">重复账单</div>
              <p>创建每日、每周或每月的重复账单，自动生成交易记录</p>
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">数据备份</div>
              <p>定期导出数据作为备份，需要时可以导入恢复</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
