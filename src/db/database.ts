import Dexie, { type Table } from 'dexie';
import type {
  Account,
  Category,
  Transaction,
  RecurringRule,
  Budget,
  AppSettings,
} from '../types';

export class ExpenseTrackerDB extends Dexie {
  accounts!: Table<Account>;
  categories!: Table<Category>;
  transactions!: Table<Transaction>;
  recurringRules!: Table<RecurringRule>;
  budgets!: Table<Budget>;
  settings!: Table<AppSettings>;

  constructor() {
    super('ExpenseTrackerDB');
    
    this.version(1).stores({
      accounts: 'id, name, type, createdAt',
      categories: 'id, name, type, parentId, isActive',
      transactions: 'id, type, date, categoryId, accountId, recurringRuleId, createdAt',
      recurringRules: 'id, name, frequency, isActive, startDate',
      budgets: 'id, month, categoryId',
      settings: 'id',
    });
  }
}

export const db = new ExpenseTrackerDB();
