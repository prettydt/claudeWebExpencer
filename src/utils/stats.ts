import type { Transaction, MonthlyStats, CategoryStat, Category, Budget, Amount } from '../types';

/**
 * 计算月度统计数据
 * @param transactions 交易记录数组
 * @param categories 分类数组
 * @returns 月度统计数据
 */
export function calculateMonthlyStats(
  transactions: Transaction[],
  categories: Category[],
  month: string
): MonthlyStats {
  const categoryMap = new Map(categories.map(c => [c.id, c]));
  
  let totalIncome = 0;
  let totalExpense = 0;
  const categoryStatsMap = new Map<string, { amount: number; count: number }>();
  
  // 统计每个分类的金额和数量
  transactions.forEach(t => {
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else {
      totalExpense += t.amount;
      
      // 统计支出分类
      const existing = categoryStatsMap.get(t.categoryId) || { amount: 0, count: 0 };
      categoryStatsMap.set(t.categoryId, {
        amount: existing.amount + t.amount,
        count: existing.count + 1,
      });
    }
  });
  
  // 生成分类统计数组
  const categoryStats: CategoryStat[] = Array.from(categoryStatsMap.entries())
    .map(([categoryId, stats]) => {
      const category = categoryMap.get(categoryId);
      return {
        categoryId,
        categoryName: category?.name || '未知分类',
        amount: stats.amount,
        percentage: totalExpense > 0 ? (stats.amount / totalExpense) * 100 : 0,
        count: stats.count,
      };
    })
    .sort((a, b) => b.amount - a.amount); // 按金额降序排序
  
  return {
    month,
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    categoryStats,
  };
}

/**
 * 计算预算使用情况
 * @param budget 预算
 * @param spent 已用金额
 * @returns 预算状态
 */
export function calculateBudgetStatus(budget: Budget, spent: Amount): {
  budget: Amount;
  spent: Amount;
  remaining: Amount;
  percentage: number;
  isOverBudget: boolean;
} {
  const remaining = budget.amount - spent;
  const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
  
  return {
    budget: budget.amount,
    spent,
    remaining,
    percentage: Math.min(percentage, 100),
    isOverBudget: spent > budget.amount,
  };
}

/**
 * 按日期分组交易记录
 * @param transactions 交易记录数组
 * @returns 按日期分组的交易记录
 */
export function groupTransactionsByDate(transactions: Transaction[]): Map<string, Transaction[]> {
  const groups = new Map<string, Transaction[]>();
  
  transactions.forEach(t => {
    const dateKey = new Date(t.date).toDateString();
    const existing = groups.get(dateKey) || [];
    groups.set(dateKey, [...existing, t]);
  });
  
  return groups;
}
