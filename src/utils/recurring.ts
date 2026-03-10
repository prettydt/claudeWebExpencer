import type { RecurringRule, Transaction } from '../types';
import { addDays, addWeeks, addMonths, isBefore, isAfter, startOfDay } from 'date-fns';

/**
 * 根据重复规则生成指定月份的交易记录
 * @param rule 重复规则
 * @param year 年份
 * @param month 月份 (0-11)
 * @returns 生成的交易记录数组
 */
export function generateRecurringTransactions(
  rule: RecurringRule,
  year: number,
  month: number
): Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[] {
  if (!rule.isActive) {
    return [];
  }

  const transactions: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[] = [];
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  
  let currentDate = new Date(rule.startDate);
  
  // 确保开始日期在月初之前或当月
  while (isBefore(currentDate, monthStart)) {
    currentDate = getNextOccurrence(currentDate, rule.frequency);
  }
  
  // 生成当月的所有重复记录
  while (!isAfter(currentDate, monthEnd)) {
    // 检查是否超过结束日期
    if (rule.endDate && isAfter(currentDate, new Date(rule.endDate))) {
      break;
    }
    
    transactions.push({
      type: rule.type,
      amount: rule.amount,
      categoryId: rule.categoryId,
      accountId: rule.accountId,
      date: startOfDay(currentDate).getTime(),
      note: rule.note,
      tags: rule.tags,
      recurringRuleId: rule.id,
    });
    
    currentDate = getNextOccurrence(currentDate, rule.frequency);
  }
  
  return transactions;
}

/**
 * 获取下一次发生的日期
 */
function getNextOccurrence(date: Date, frequency: RecurringRule['frequency']): Date {
  switch (frequency) {
    case 'daily':
      return addDays(date, 1);
    case 'weekly':
      return addWeeks(date, 1);
    case 'monthly':
      return addMonths(date, 1);
    default:
      return date;
  }
}

/**
 * 获取重复规则的下一次发生时间
 * @param rule 重复规则
 * @returns 下一次发生的时间戳，如果规则已结束则返回null
 */
export function getNextOccurrenceDate(rule: RecurringRule): number | null {
  if (!rule.isActive) {
    return null;
  }
  
  const now = new Date();
  let currentDate = new Date(rule.startDate);
  
  // 找到下一次发生的日期
  while (isBefore(currentDate, now)) {
    currentDate = getNextOccurrence(currentDate, rule.frequency);
  }
  
  // 检查是否超过结束日期
  if (rule.endDate && isAfter(currentDate, new Date(rule.endDate))) {
    return null;
  }
  
  return currentDate.getTime();
}

/**
 * 获取重复规则的描述文本
 * @param rule 重复规则
 * @returns 描述文本
 */
export function getRecurringRuleDescription(rule: RecurringRule): string {
  const frequencyMap = {
    daily: '每天',
    weekly: '每周',
    monthly: '每月',
  };
  
  const frequency = frequencyMap[rule.frequency];
  const type = rule.type === 'income' ? '收入' : '支出';
  
  return `${frequency}${type}`;
}
