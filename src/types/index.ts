// 金额单位：分(cent)，避免浮点误差
export type Amount = number; // 以分为单位的整数

// 交易类型
export type TransactionType = 'income' | 'expense';

// 账户类型
export interface Account {
  id: string;
  name: string;
  type: 'cash' | 'debit' | 'credit';
  balance: Amount; // 当前余额（分）
  createdAt: number;
  updatedAt: number;
}

// 分类（支持二级分类）
export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  parentId?: string; // 父分类ID，如果有则为二级分类
  icon?: string; // 图标名称
  color?: string; // 颜色
  isActive: boolean; // 是否启用
  createdAt: number;
  updatedAt: number;
}

// 交易记录
export interface Transaction {
  id: string;
  type: TransactionType;
  amount: Amount; // 金额（分）
  categoryId: string; // 分类ID
  accountId: string; // 账户ID
  date: number; // 时间戳
  note?: string; // 备注
  tags?: string[]; // 标签
  recurringRuleId?: string; // 关联的重复规则ID
  createdAt: number;
  updatedAt: number;
}

// 重复账单规则
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly';

export interface RecurringRule {
  id: string;
  name: string; // 规则名称，如"每月房租"
  type: TransactionType;
  amount: Amount;
  categoryId: string;
  accountId: string;
  frequency: RecurringFrequency; // 重复频率
  startDate: number; // 开始日期时间戳
  endDate?: number; // 结束日期时间戳（可选）
  note?: string;
  tags?: string[];
  isActive: boolean; // 是否启用
  createdAt: number;
  updatedAt: number;
}

// 预算
export interface Budget {
  id: string;
  name: string; // 预算名称
  amount: Amount; // 预算金额（分）
  categoryId?: string; // 分类ID，如果为空则是总预算
  month: string; // 月份，格式：YYYY-MM
  createdAt: number;
  updatedAt: number;
}

// 统计数据
export interface MonthlyStats {
  month: string; // YYYY-MM
  totalIncome: Amount;
  totalExpense: Amount;
  balance: Amount; // 结余
  categoryStats: CategoryStat[];
}

export interface CategoryStat {
  categoryId: string;
  categoryName: string;
  amount: Amount;
  percentage: number; // 占比
  count: number; // 交易数量
}

// 应用设置
export interface AppSettings {
  id: string;
  darkMode: 'light' | 'dark' | 'system';
  currency: 'CNY'; // 当前仅支持人民币
  defaultAccountId?: string;
  updatedAt: number;
}

// 导出数据格式
export interface ExportData {
  version: string;
  exportDate: number;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  recurringRules: RecurringRule[];
  budgets: Budget[];
  settings?: AppSettings;
}
