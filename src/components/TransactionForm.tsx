import React, { useState, useEffect } from 'react';
import type { Transaction, TransactionType, Category, Account } from '../types';
import { parseAmountInput, centsToYuan } from '../utils/currency';
import { v4 as uuidv4 } from 'uuid';

interface TransactionFormProps {
  transaction?: Transaction;
  categories: Category[];
  accounts: Account[];
  onSave: (transaction: Omit<Transaction, 'createdAt' | 'updatedAt'>) => void;
  onDelete?: (id: string) => void;
  onCancel: () => void;
}

export function TransactionForm({
  transaction,
  categories,
  accounts,
  onSave,
  onDelete,
  onCancel,
}: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(transaction?.type || 'expense');
  const [amount, setAmount] = useState(transaction ? centsToYuan(transaction.amount).toString() : '');
  const [categoryId, setCategoryId] = useState(transaction?.categoryId || '');
  const [accountId, setAccountId] = useState(transaction?.accountId || '');
  const [date, setDate] = useState(
    transaction ? new Date(transaction.date).toISOString().slice(0, 16) : 
    new Date().toISOString().slice(0, 16)
  );
  const [note, setNote] = useState(transaction?.note || '');
  const [tags, setTags] = useState(transaction?.tags?.join(', ') || '');

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
    
    const amountInCents = parseAmountInput(amount);
    if (amountInCents <= 0) {
      alert('请输入有效金额');
      return;
    }

    if (!categoryId) {
      alert('请选择分类');
      return;
    }

    if (!accountId) {
      alert('请选择账户');
      return;
    }

    const transactionData: Omit<Transaction, 'createdAt' | 'updatedAt'> = {
      id: transaction?.id || uuidv4(),
      type,
      amount: amountInCents,
      categoryId,
      accountId,
      date: new Date(date).getTime(),
      note: note.trim() || undefined,
      tags: tags.trim() ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
      recurringRuleId: transaction?.recurringRuleId,
    };

    onSave(transactionData);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
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

      {/* Date */}
      <div>
        <label className="block text-sm font-medium mb-2">日期时间 *</label>
        <input
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
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

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium mb-2">标签</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="input"
          placeholder="用逗号分隔，如：餐饮, 早餐"
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
        {transaction && onDelete && (
          <button
            type="button"
            onClick={() => {
              if (confirm('确定要删除这条记录吗？')) {
                onDelete(transaction.id);
              }
            }}
            className="py-2 px-4 rounded-lg font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
          >
            删除
          </button>
        )}
        <button
          type="submit"
          className="btn-primary flex-1"
        >
          {transaction ? '更新' : '保存'}
        </button>
      </div>
    </form>
  );
}
