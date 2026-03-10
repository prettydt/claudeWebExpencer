import { useEffect, useState } from 'react';
import { accountRepository, categoryRepository, settingsRepository } from '../repositories';
import type { Account, Category, AppSettings } from '../types';
import { v4 as uuidv4 } from 'uuid';

// 默认分类
const defaultCategories: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // 支出分类
  { name: '餐饮', type: 'expense', icon: '🍜', color: '#FF6B6B', isActive: true },
  { name: '交通', type: 'expense', icon: '🚗', color: '#4ECDC4', isActive: true },
  { name: '购物', type: 'expense', icon: '🛍️', color: '#FFE66D', isActive: true },
  { name: '娱乐', type: 'expense', icon: '🎮', color: '#A8E6CF', isActive: true },
  { name: '住房', type: 'expense', icon: '🏠', color: '#FF8B94', isActive: true },
  { name: '医疗', type: 'expense', icon: '💊', color: '#C7CEEA', isActive: true },
  { name: '教育', type: 'expense', icon: '📚', color: '#B4A7D6', isActive: true },
  { name: '其他', type: 'expense', icon: '📝', color: '#95E1D3', isActive: true },
  
  // 收入分类
  { name: '工资', type: 'income', icon: '💼', color: '#6BCB77', isActive: true },
  { name: '奖金', type: 'income', icon: '🎁', color: '#4D96FF', isActive: true },
  { name: '投资', type: 'income', icon: '📈', color: '#FFD93D', isActive: true },
  { name: '其他', type: 'income', icon: '💰', color: '#6BCB77', isActive: true },
];

// 默认账户
const defaultAccounts: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: '现金', type: 'cash', balance: 0 },
  { name: '借记卡', type: 'debit', balance: 0 },
  { name: '信用卡', type: 'credit', balance: 0 },
];

export function useInitializeData() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeData = async () => {
      try {
        // 检查是否已经初始化
        const existingSettings = await settingsRepository.get();
        
        if (!existingSettings) {
          // 创建默认设置
          const settings: AppSettings = {
            id: 'settings',
            darkMode: 'system',
            currency: 'CNY',
            updatedAt: Date.now(),
          };
          await settingsRepository.save(settings);
          
          // 创建默认分类
          const now = Date.now();
          for (const category of defaultCategories) {
            await categoryRepository.create({
              ...category,
              id: uuidv4(),
              createdAt: now,
              updatedAt: now,
            });
          }
          
          // 创建默认账户
          for (const account of defaultAccounts) {
            await accountRepository.create({
              ...account,
              id: uuidv4(),
              createdAt: now,
              updatedAt: now,
            });
          }
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  return { isInitialized, isLoading };
}
