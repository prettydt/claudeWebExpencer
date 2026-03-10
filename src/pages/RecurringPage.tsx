import React, { useState, useEffect } from 'react';
import { recurringRuleRepository, categoryRepository, accountRepository } from '../repositories';
import type { RecurringRule, RecurringFrequency, TransactionType, Category, Account } from '../types';
import { formatCurrency, parseAmountInput, centsToYuan } from '../utils/currency';
import { getRecurringRuleDescription, getNextOccurrenceDate } from '../utils/recurring';
import { formatDate } from '../utils/date';

export function RecurringPage() {
  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<RecurringRule | undefined>();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [rls, cats, accs] = await Promise.all([
      recurringRuleRepository.getAll(),
      categoryRepository.getAll(),
      accountRepository.getAll(),
    ]);
    setRules(rls);
    setCategories(cats);
    setAccounts(accs);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这条重复规则吗？')) {
      await recurringRuleRepository.delete(id);
      loadData();
    }
  };

  const handleToggleActive = async (rule: RecurringRule) => {
    await recurringRuleRepository.update(rule.id, {
      isActive: !rule.isActive,
    });
    loadData();
  };

  const categoryMap = new Map(categories.map(c => [c.id, c]));
  const accountMap = new Map(accounts.map(a => [a.id, a]));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">重复账单</h1>
          <button
            onClick={() => {
              setEditingRule(undefined);
              setShowForm(true);
            }}
            className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center text-2xl hover:bg-primary-700 transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {showForm ? (
        <RecurringRuleForm
          rule={editingRule}
          categories={categories}
          accounts={accounts}
          onSave={async (rule) => {
            const now = Date.now();
            if (editingRule) {
              await recurringRuleRepository.update(rule.id, {
                ...rule,
                updatedAt: now,
              });
            } else {
              await recurringRuleRepository.create({
                ...rule,
                createdAt: now,
                updatedAt: now,
              });
            }
            setShowForm(false);
            setEditingRule(undefined);
            loadData();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingRule(undefined);
          }}
        />
      ) : (
        <div className="p-4 space-y-3">
          {rules.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <div className="text-4xl mb-4">🔄</div>
              <p>暂无重复账单</p>
            </div>
          ) : (
            rules.map(rule => {
              const category = categoryMap.get(rule.categoryId);
              const account = accountMap.get(rule.accountId);
              const nextDate = getNextOccurrenceDate(rule);

              return (
                <div
                  key={rule.id}
                  className={`card p-4 ${!rule.isActive ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl"
                      style={{ backgroundColor: category?.color + '20' }}
                    >
                      {category?.icon || '📝'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {rule.name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <div>{getRecurringRuleDescription(rule)}</div>
                        <div>{category?.name} · {account?.name}</div>
                        {nextDate && rule.isActive && (
                          <div className="text-primary-600 dark:text-primary-400">
                            下次: {formatDate(nextDate)}
                          </div>
                        )}
                        {!rule.isActive && (
                          <div className="text-gray-500">已暂停</div>
                        )}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className={`text-right ${
                      rule.type === 'income'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      <div className="font-semibold">
                        {rule.type === 'income' ? '+' : '-'}
                        {formatCurrency(rule.amount)}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleToggleActive(rule)}
                      className="flex-1 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {rule.isActive ? '暂停' : '恢复'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingRule(rule);
                        setShowForm(true);
                      }}
                      className="flex-1 py-2 rounded-lg text-sm font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className="flex-1 py-2 rounded-lg text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// Recurring Rule Form Component
interface RecurringRuleFormProps {
  rule?: RecurringRule;
  categories: Category[];
  accounts: Account[];
  onSave: (rule: Omit<RecurringRule, 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

function RecurringRuleForm({ rule, categories, accounts, onSave, onCancel }: RecurringRuleFormProps) {
  const [name, setName] = useState(rule?.name || '');
  const [type, setType] = useState<TransactionType>(rule?.type || 'expense');
  const [amount, setAmount] = useState(rule ? centsToYuan(rule.amount).toString() : '');
  const [categoryId, setCategoryId] = useState(rule?.categoryId || '');
  const [accountId, setAccountId] = useState(rule?.accountId || '');
  const [frequency, setFrequency] = useState<RecurringFrequency>(rule?.frequency || 'monthly');
  const [startDate, setStartDate] = useState(
    rule ? new Date(rule.startDate).toISOString().slice(0, 10) :
    new Date().toISOString().slice(0, 10)
  );
  const [note, setNote] = useState(rule?.note || '');

  const filteredCategories = categories.filter(c => c.type === type && c.isActive);

  useEffect(() => {
    if (!categoryId && filteredCategories.length > 0) {
      setCategoryId(filteredCategories[0].id);
    }
  }, [type, filteredCategories, categoryId]);

  useEffect(() => {
    if (!accountId && accounts.length > 0) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('请输入规则名称');
      return;
    }

    const amountInCents = parseAmountInput(amount);
    if (amountInCents <= 0) {
      alert('请输入有效金额');
      return;
    }

    const ruleData: Omit<RecurringRule, 'createdAt' | 'updatedAt'> = {
      id: rule?.id || crypto.randomUUID(),
      name: name.trim(),
      type,
      amount: amountInCents,
      categoryId,
      accountId,
      frequency,
      startDate: new Date(startDate).getTime(),
      note: note.trim() || undefined,
      isActive: rule?.isActive ?? true,
    };

    onSave(ruleData);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium mb-2">规则名称 *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
          placeholder="如：每月房租、每周交通卡"
          required
        />
      </div>

      {/* Type Toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType('expense')}
          className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
            type === 'expense'
              ? 'bg-red-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          支出
        </button>
        <button
          type="button"
          onClick={() => setType('income')}
          className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
            type === 'income'
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          收入
        </button>
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium mb-2">金额 *</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input pl-8"
            placeholder="0.00"
            required
            inputMode="decimal"
          />
        </div>
      </div>

      {/* Frequency */}
      <div>
        <label className="block text-sm font-medium mb-2">重复频率 *</label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setFrequency('daily')}
            className={`py-3 rounded-lg font-medium transition-colors ${
              frequency === 'daily'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            每天
          </button>
          <button
            type="button"
            onClick={() => setFrequency('weekly')}
            className={`py-3 rounded-lg font-medium transition-colors ${
              frequency === 'weekly'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            每周
          </button>
          <button
            type="button"
            onClick={() => setFrequency('monthly')}
            className={`py-3 rounded-lg font-medium transition-colors ${
              frequency === 'monthly'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            每月
          </button>
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium mb-2">分类 *</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="input"
          required
        >
          {filteredCategories.map(category => (
            <option key={category.id} value={category.id}>
              {category.icon} {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Account */}
      <div>
        <label className="block text-sm font-medium mb-2">账户 *</label>
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="input"
          required
        >
          {accounts.map(account => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </div>

      {/* Start Date */}
      <div>
        <label className="block text-sm font-medium mb-2">开始日期 *</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="input"
          required
        />
      </div>

      {/* Note */}
      <div>
        <label className="block text-sm font-medium mb-2">备注</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="input"
          placeholder="添加备注..."
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary flex-1"
        >
          取消
        </button>
        <button
          type="submit"
          className="btn-primary flex-1"
        >
          {rule ? '更新' : '保存'}
        </button>
      </div>
    </form>
  );
}
