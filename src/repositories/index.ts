import { db } from '../db/database';
import type { Account, Category, Transaction, RecurringRule, Budget, AppSettings, ExportData } from '../types';

// Account Repository
export const accountRepository = {
  async getAll(): Promise<Account[]> {
    return await db.accounts.toArray();
  },

  async getById(id: string): Promise<Account | undefined> {
    return await db.accounts.get(id);
  },

  async create(account: Account): Promise<string> {
    return await db.accounts.add(account);
  },

  async update(id: string, changes: Partial<Account>): Promise<void> {
    await db.accounts.update(id, { ...changes, updatedAt: Date.now() });
  },

  async delete(id: string): Promise<void> {
    await db.accounts.delete(id);
  },

  async updateBalance(id: string, amount: number): Promise<void> {
    const account = await this.getById(id);
    if (account) {
      await this.update(id, { balance: account.balance + amount });
    }
  },
};

// Category Repository
export const categoryRepository = {
  async getAll(): Promise<Category[]> {
    return await db.categories.toArray();
  },

  async getById(id: string): Promise<Category | undefined> {
    return await db.categories.get(id);
  },

  async getByType(type: 'income' | 'expense'): Promise<Category[]> {
    return await db.categories.where('type').equals(type).toArray();
  },

  async getActive(): Promise<Category[]> {
    return await db.categories.where('isActive').equals(1).toArray();
  },

  async create(category: Category): Promise<string> {
    return await db.categories.add(category);
  },

  async update(id: string, changes: Partial<Category>): Promise<void> {
    await db.categories.update(id, { ...changes, updatedAt: Date.now() });
  },

  async delete(id: string): Promise<void> {
    await db.categories.delete(id);
  },
};

// Transaction Repository
export const transactionRepository = {
  async getAll(): Promise<Transaction[]> {
    return await db.transactions.orderBy('date').reverse().toArray();
  },

  async getById(id: string): Promise<Transaction | undefined> {
    return await db.transactions.get(id);
  },

  async getByDateRange(startDate: number, endDate: number): Promise<Transaction[]> {
    return await db.transactions
      .where('date')
      .between(startDate, endDate, true, true)
      .reverse()
      .toArray();
  },

  async getByMonth(year: number, month: number): Promise<Transaction[]> {
    const startDate = new Date(year, month, 1).getTime();
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();
    return await this.getByDateRange(startDate, endDate);
  },

  async create(transaction: Transaction): Promise<string> {
    return await db.transactions.add(transaction);
  },

  async update(id: string, changes: Partial<Transaction>): Promise<void> {
    await db.transactions.update(id, { ...changes, updatedAt: Date.now() });
  },

  async delete(id: string): Promise<void> {
    await db.transactions.delete(id);
  },

  async search(query: string): Promise<Transaction[]> {
    const transactions = await this.getAll();
    const lowerQuery = query.toLowerCase();
    return transactions.filter(t => 
      t.note?.toLowerCase().includes(lowerQuery) ||
      t.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  },
};

// Recurring Rule Repository
export const recurringRuleRepository = {
  async getAll(): Promise<RecurringRule[]> {
    return await db.recurringRules.toArray();
  },

  async getById(id: string): Promise<RecurringRule | undefined> {
    return await db.recurringRules.get(id);
  },

  async getActive(): Promise<RecurringRule[]> {
    return await db.recurringRules.where('isActive').equals(1).toArray();
  },

  async create(rule: RecurringRule): Promise<string> {
    return await db.recurringRules.add(rule);
  },

  async update(id: string, changes: Partial<RecurringRule>): Promise<void> {
    await db.recurringRules.update(id, { ...changes, updatedAt: Date.now() });
  },

  async delete(id: string): Promise<void> {
    await db.recurringRules.delete(id);
  },
};

// Budget Repository
export const budgetRepository = {
  async getAll(): Promise<Budget[]> {
    return await db.budgets.toArray();
  },

  async getById(id: string): Promise<Budget | undefined> {
    return await db.budgets.get(id);
  },

  async getByMonth(month: string): Promise<Budget[]> {
    return await db.budgets.where('month').equals(month).toArray();
  },

  async create(budget: Budget): Promise<string> {
    return await db.budgets.add(budget);
  },

  async update(id: string, changes: Partial<Budget>): Promise<void> {
    await db.budgets.update(id, { ...changes, updatedAt: Date.now() });
  },

  async delete(id: string): Promise<void> {
    await db.budgets.delete(id);
  },
};

// Settings Repository
export const settingsRepository = {
  async get(): Promise<AppSettings | undefined> {
    const settings = await db.settings.toArray();
    return settings[0];
  },

  async save(settings: AppSettings): Promise<void> {
    await db.settings.put(settings);
  },
};

// Data Export/Import
export const dataRepository = {
  async exportData(): Promise<ExportData> {
    const [accounts, categories, transactions, recurringRules, budgets, settings] = await Promise.all([
      accountRepository.getAll(),
      categoryRepository.getAll(),
      transactionRepository.getAll(),
      recurringRuleRepository.getAll(),
      budgetRepository.getAll(),
      settingsRepository.get(),
    ]);

    return {
      version: '1.0.0',
      exportDate: Date.now(),
      accounts,
      categories,
      transactions,
      recurringRules,
      budgets,
      settings,
    };
  },

  async importData(data: ExportData): Promise<void> {
    await db.transaction('rw', [db.accounts, db.categories, db.transactions, db.recurringRules, db.budgets, db.settings], async () => {
      // Clear existing data
      await Promise.all([
        db.accounts.clear(),
        db.categories.clear(),
        db.transactions.clear(),
        db.recurringRules.clear(),
        db.budgets.clear(),
        db.settings.clear(),
      ]);

      // Import new data
      await Promise.all([
        db.accounts.bulkAdd(data.accounts),
        db.categories.bulkAdd(data.categories),
        db.transactions.bulkAdd(data.transactions),
        db.recurringRules.bulkAdd(data.recurringRules),
        db.budgets.bulkAdd(data.budgets),
        data.settings ? db.settings.add(data.settings) : Promise.resolve(),
      ]);
    });
  },
};
