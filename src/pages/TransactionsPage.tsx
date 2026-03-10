import { useState, useEffect } from 'react';
import { TransactionForm } from '../components/TransactionForm';
import { TransactionList } from '../components/TransactionList';
import { transactionRepository, categoryRepository, accountRepository, recurringRuleRepository } from '../repositories';
import type { Transaction, Category, Account } from '../types';
import { getCurrentMonth } from '../utils/date';
import { generateRecurringTransactions } from '../utils/recurring';

export function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();
  const [highlightId, setHighlightId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState(getCurrentMonth());

  useEffect(() => {
    loadData();
  }, [filterMonth]);

  const loadData = async () => {
    const [txns, cats, accs, rules] = await Promise.all([
      transactionRepository.getAll(),
      categoryRepository.getAll(),
      accountRepository.getAll(),
      recurringRuleRepository.getActive(),
    ]);

    // 生成重复账单
    const [year, month] = filterMonth.split('-').map(Number);
    const recurringTxns: Transaction[] = [];
    
    for (const rule of rules) {
      const generated = generateRecurringTransactions(rule, year, month - 1);
      
      // 检查是否已经有对应的交易记录
      for (const genTxn of generated) {
        const existing = txns.find(t => 
          t.recurringRuleId === rule.id &&
          new Date(t.date).toDateString() === new Date(genTxn.date).toDateString()
        );
        
        if (!existing) {
          // 自动创建交易记录
          const newTxn: Transaction = {
            ...genTxn,
            id: crypto.randomUUID(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          recurringTxns.push(newTxn);
        }
      }
    }

    // 合并所有交易
    const allTransactions = [...txns, ...recurringTxns].sort((a, b) => b.date - a.date);
    
    setTransactions(allTransactions);
    setCategories(cats);
    setAccounts(accs);
  };

  const handleSave = async (transaction: Omit<Transaction, 'createdAt' | 'updatedAt'>) => {
    const now = Date.now();
    
    if (editingTransaction) {
      await transactionRepository.update(transaction.id, {
        ...transaction,
        updatedAt: now,
      });
    } else {
      await transactionRepository.create({
        ...transaction,
        createdAt: now,
        updatedAt: now,
      });
      setHighlightId(transaction.id);
      setTimeout(() => setHighlightId(undefined), 2000);
    }

    setShowForm(false);
    setEditingTransaction(undefined);
    loadData();
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await transactionRepository.delete(id);
    setShowForm(false);
    setEditingTransaction(undefined);
    loadData();
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTransaction(undefined);
  };

  const filteredTransactions = transactions.filter(t => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        t.note?.toLowerCase().includes(query) ||
        t.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    return true;
  });

  if (showForm) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {editingTransaction ? '编辑账单' : '新增账单'}
          </h1>
        </div>
        <TransactionForm
          transaction={editingTransaction}
          categories={categories}
          accounts={accounts}
          onSave={handleSave}
          onDelete={handleDelete}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 space-y-3 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">账单</h1>
          <button
            onClick={() => setShowForm(true)}
            className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center text-2xl hover:bg-primary-700 transition-colors"
          >
            +
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索备注或标签..."
          className="input"
        />

        {/* Month Filter */}
        <input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="input"
        />
      </div>

      {/* List */}
      <div className="p-4">
        <TransactionList
          transactions={filteredTransactions}
          categories={categories}
          accounts={accounts}
          onEdit={handleEdit}
          highlightId={highlightId}
        />
      </div>
    </div>
  );
}
