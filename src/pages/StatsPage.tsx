import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { transactionRepository, categoryRepository, budgetRepository, recurringRuleRepository } from '../repositories';
import type { MonthlyStats, Budget, Category } from '../types';
import { calculateMonthlyStats, calculateBudgetStatus } from '../utils/stats';
import { formatCurrency, yuanToCents } from '../utils/currency';
import { getCurrentMonth, formatMonthDisplay, getPreviousMonth, getNextMonth } from '../utils/date';
import { generateRecurringTransactions } from '../utils/recurring';

export function StatsPage() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState('');

  useEffect(() => {
    loadStats();
  }, [month]);

  const loadStats = async () => {
    const [year, monthNum] = month.split('-').map(Number);
    
    const [txns, cats, bdgs, rules] = await Promise.all([
      transactionRepository.getByMonth(year, monthNum - 1),
      categoryRepository.getAll(),
      budgetRepository.getByMonth(month),
      recurringRuleRepository.getActive(),
    ]);

    // 生成重复账单交易
    const recurringTxns = rules.flatMap(rule => 
      generateRecurringTransactions(rule, year, monthNum - 1)
    );

    // 合并交易记录（排除已存在的重复交易）
    const allTransactions = [...txns];
    for (const genTxn of recurringTxns) {
      const existing = txns.find(t => 
        t.recurringRuleId === genTxn.recurringRuleId &&
        new Date(t.date).toDateString() === new Date(genTxn.date).toDateString()
      );
      if (!existing) {
        allTransactions.push({
          ...genTxn,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }

    const monthStats = calculateMonthlyStats(allTransactions, cats, month);
    
    setStats(monthStats);
    setBudgets(bdgs);
    setCategories(cats);
  };

  const handleSaveBudget = async () => {
    const amount = yuanToCents(parseFloat(budgetAmount));
    
    if (amount <= 0) {
      alert('请输入有效金额');
      return;
    }

    // 检查是否已有总预算
    const existingBudget = budgets.find(b => !b.categoryId);
    
    if (existingBudget) {
      await budgetRepository.update(existingBudget.id, {
        amount,
        updatedAt: Date.now(),
      });
    } else {
      await budgetRepository.create({
        id: crypto.randomUUID(),
        name: '月度总预算',
        amount,
        month,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    setShowBudgetForm(false);
    setBudgetAmount('');
    loadStats();
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  const totalBudget = budgets.find(b => !b.categoryId);
  const budgetStatus = totalBudget
    ? calculateBudgetStatus(totalBudget, stats.totalExpense)
    : null;

  // 准备图表数据
  const chartData = stats.categoryStats.map(stat => ({
    name: stat.categoryName,
    value: stat.amount / 100, // 转换为元
    percentage: stat.percentage,
  }));

  const COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#FF8B94', '#C7CEEA', '#B4A7D6', '#95E1D3'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 z-10">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">统计</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Month Selector */}
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4">
          <button
            onClick={() => setMonth(getPreviousMonth(month))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            ←
          </button>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {formatMonthDisplay(month)}
          </span>
          <button
            onClick={() => setMonth(getNextMonth(month))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            →
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">收入</div>
            <div className="text-lg font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(stats.totalIncome)}
            </div>
          </div>
          <div className="card p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">支出</div>
            <div className="text-lg font-semibold text-red-600 dark:text-red-400">
              {formatCurrency(stats.totalExpense)}
            </div>
          </div>
          <div className="card p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">结余</div>
            <div className={`text-lg font-semibold ${
              stats.balance >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {formatCurrency(stats.balance)}
            </div>
          </div>
        </div>

        {/* Budget */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">月度预算</h2>
            <button
              onClick={() => setShowBudgetForm(!showBudgetForm)}
              className="text-primary-600 dark:text-primary-400 text-sm"
            >
              {totalBudget ? '修改' : '设置'}
            </button>
          </div>

          {showBudgetForm && (
            <div className="mb-4 flex gap-2">
              <input
                type="number"
                step="0.01"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                placeholder="输入预算金额"
                className="input flex-1"
              />
              <button onClick={handleSaveBudget} className="btn-primary px-4">
                保存
              </button>
            </div>
          )}

          {budgetStatus ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  已用 / 总预算
                </span>
                <span className={`text-sm font-medium ${
                  budgetStatus.isOverBudget
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {formatCurrency(budgetStatus.spent)} / {formatCurrency(budgetStatus.budget)}
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    budgetStatus.isOverBudget
                      ? 'bg-red-500'
                      : budgetStatus.percentage > 80
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(budgetStatus.percentage, 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {budgetStatus.isOverBudget ? '超支' : '剩余'}: {formatCurrency(Math.abs(budgetStatus.remaining))}
                </span>
                <span className={`font-medium ${
                  budgetStatus.isOverBudget
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {budgetStatus.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 py-4">
              未设置预算
            </div>
          )}
        </div>

        {/* Category Stats */}
        {stats.categoryStats.length > 0 && (
          <div className="card p-4">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">分类统计</h2>
            
            {/* Pie Chart */}
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, payload }: any) => `${name} ${payload.percentage.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `¥${Number(value).toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category List */}
            <div className="space-y-2">
              {stats.categoryStats.map((stat, index) => {
                const category = categories.find(c => c.id === stat.categoryId);
                return (
                  <div key={stat.categoryId} className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {category?.icon && <span>{category.icon}</span>}
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {stat.categoryName}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(stat.amount)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {stat.percentage.toFixed(1)}% · {stat.count}笔
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
