import { format, isToday, isYesterday, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/**
 * 格式化日期为显示字符串
 * @param timestamp 时间戳
 * @returns 格式化的日期字符串
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  
  if (isToday(date)) {
    return '今天';
  }
  
  if (isYesterday(date)) {
    return '昨天';
  }
  
  return format(date, 'M月d日', { locale: zhCN });
}

/**
 * 格式化日期时间
 * @param timestamp 时间戳
 * @returns 格式化的日期时间字符串
 */
export function formatDateTime(timestamp: number): string {
  return format(new Date(timestamp), 'yyyy-MM-dd HH:mm', { locale: zhCN });
}

/**
 * 格式化月份
 * @param year 年份
 * @param month 月份 (0-11)
 * @returns 格式化的月份字符串，如 "2024-03"
 */
export function formatMonth(year: number, month: number): string {
  return format(new Date(year, month), 'yyyy-MM');
}

/**
 * 格式化月份为显示字符串
 * @param monthStr 月份字符串，格式 "YYYY-MM"
 * @returns 格式化的月份字符串，如 "2024年3月"
 */
export function formatMonthDisplay(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number);
  return format(new Date(year, month - 1), 'yyyy年M月', { locale: zhCN });
}

/**
 * 获取当前月份字符串
 * @returns 当前月份字符串，格式 "YYYY-MM"
 */
export function getCurrentMonth(): string {
  const now = new Date();
  return formatMonth(now.getFullYear(), now.getMonth());
}

/**
 * 获取月份的起止时间戳
 * @param monthStr 月份字符串，格式 "YYYY-MM"
 * @returns 起止时间戳
 */
export function getMonthRange(monthStr: string): { start: number; end: number } {
  const [year, month] = monthStr.split('-').map(Number);
  const date = new Date(year, month - 1);
  
  return {
    start: startOfMonth(date).getTime(),
    end: endOfMonth(date).getTime(),
  };
}

/**
 * 获取上一个月
 * @param monthStr 月份字符串，格式 "YYYY-MM"
 * @returns 上一个月的字符串
 */
export function getPreviousMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number);
  const date = new Date(year, month - 1);
  const prev = addMonths(date, -1);
  return formatMonth(prev.getFullYear(), prev.getMonth());
}

/**
 * 获取下一个月
 * @param monthStr 月份字符串，格式 "YYYY-MM"
 * @returns 下一个月的字符串
 */
export function getNextMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number);
  const date = new Date(year, month - 1);
  const next = addMonths(date, 1);
  return formatMonth(next.getFullYear(), next.getMonth());
}
