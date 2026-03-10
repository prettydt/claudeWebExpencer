import type { Transaction, Category, Account } from '../types';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/date';
import { groupTransactionsByDate } from '../utils/stats';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  onEdit: (transaction: Transaction) => void;
  highlightId?: string;
}

export function TransactionList({
  transactions,
  categories,
  accounts,
  onEdit,
  highlightId,
}: TransactionListProps) {
  const categoryMap = new Map(categories.map(c => [c.id, c]));
  const accountMap = new Map(accounts.map(a => [a.id, a]));
  
  const groupedTransactions = groupTransactionsByDate(transactions);
  const sortedDates = Array.from(groupedTransactions.keys()).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  if (transactions.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        <div className="text-4xl mb-4">📝</div>
        <p>暂无记录</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedDates.map(dateKey => {
        const dayTransactions = groupedTransactions.get(dateKey) || [];
        const firstTransaction = dayTransactions[0];
        
        return (
          <div key={dateKey} className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
            {/* Date Header */}
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 border-b border-gray-200 dark:border-gray-600">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {formatDate(firstTransaction.date)}
              </span>
            </div>

            {/* Transactions */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {dayTransactions.map(transaction => {
                const category = categoryMap.get(transaction.categoryId);
                const account = accountMap.get(transaction.accountId);
                const isHighlighted = transaction.id === highlightId;

                return (
                  <div
                    key={transaction.id}
                    className={`p-4 flex items-center gap-3 transition-colors ${
                      isHighlighted ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                    }`}
                    onClick={() => onEdit(transaction)}
                  >
                    {/* Category Icon */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl"
                      style={{ backgroundColor: category?.color + '20' }}
                    >
                      {category?.icon || '📝'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {category?.name || '未知分类'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <span>{account?.name}</span>
                        {transaction.note && (
                          <>
                            <span>·</span>
                            <span className="truncate">{transaction.note}</span>
                          </>
                        )}
                      </div>
                      {transaction.tags && transaction.tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {transaction.tags.map(tag => (
                            <span
                              key={tag}
                              className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Amount */}
                    <div className={`text-right ${
                      transaction.type === 'income'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      <div className="font-semibold">
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </div>
                      {transaction.recurringRuleId && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          🔄 重复
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
