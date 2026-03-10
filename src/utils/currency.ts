import type { Amount } from '../types';

/**
 * 将分转换为元，并格式化为带千分位的字符串
 * @param cents 金额（分）
 * @returns 格式化的金额字符串，如 "1,234.56"
 */
export function formatAmount(cents: Amount): string {
  const yuan = cents / 100;
  return yuan.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * 格式化为带货币符号的金额
 * @param cents 金额（分）
 * @returns 格式化的金额字符串，如 "¥1,234.56"
 */
export function formatCurrency(cents: Amount): string {
  return `¥${formatAmount(cents)}`;
}

/**
 * 将元转换为分
 * @param yuan 金额（元）
 * @returns 金额（分）
 */
export function yuanToCents(yuan: number): Amount {
  return Math.round(yuan * 100);
}

/**
 * 将分转换为元
 * @param cents 金额（分）
 * @returns 金额（元）
 */
export function centsToYuan(cents: Amount): number {
  return cents / 100;
}

/**
 * 解析用户输入的金额字符串为分
 * @param input 用户输入的字符串
 * @returns 金额（分），如果无效则返回0
 */
export function parseAmountInput(input: string): Amount {
  // 移除非数字和小数点的字符
  const cleaned = input.replace(/[^\d.]/g, '');
  const yuan = parseFloat(cleaned);
  
  if (isNaN(yuan)) {
    return 0;
  }
  
  return yuanToCents(yuan);
}
