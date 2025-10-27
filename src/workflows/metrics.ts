import { proxyActivities } from '@temporalio/workflow';
import * as elastic from '../activities/elastic';

const { es_query } = proxyActivities<typeof elastic>({ startToCloseTimeout: '10 minute' });

function rangeClause(startIso?: string, endIso?: string): string {
  if (!startIso && !endIso) return '';
  const parts = [] as string[];
  if (startIso) parts.push(`ts >= '${startIso}'`);
  if (endIso) parts.push(`ts <= '${endIso}'`);
  return ` WHERE ${parts.join(' AND ')}`;
}

export interface AOVResult { aov: number; count: number; index: string; }
export async function computeAOV(ordersIndex: string, startIso?: string, endIso?: string): Promise<AOVResult> {
  const where = rangeClause(startIso, endIso);
  const rows = await es_query(`SELECT AVG(order_total) aov, COUNT(*) cnt FROM ${ordersIndex}${where}`);
  const aov = rows[0]?.aov || 0;
  const count = rows[0]?.cnt || 0;
  return { aov, count, index: ordersIndex };
}

export interface ConversionResult { conversion: number; orders: number; sessions: number; }
export async function computeConversion(ordersIndex: string, sessionsIndex: string, startIso?: string, endIso?: string): Promise<ConversionResult> {
  const where = rangeClause(startIso, endIso);
  const o = await es_query(`SELECT COUNT(*) o FROM ${ordersIndex}${where}`);
  const s = await es_query(`SELECT COUNT(*) s FROM ${sessionsIndex}${where}`);
  const orders = o[0]?.o || 0;
  const sessions = s[0]?.s || 0;
  const conversion = sessions > 0 ? orders / sessions : 0;
  return { conversion, orders, sessions };
}

export interface RetentionResult { returningShare: number; returning: number; totalCustomers: number; }
export async function computeReturningCustomerRate(ordersIndex: string, startIso?: string, endIso?: string): Promise<RetentionResult> {
  const where = rangeClause(startIso, endIso);
  const rows = await es_query(`SELECT customerId, COUNT(*) n FROM ${ordersIndex}${where} GROUP BY customerId`);
  const byCust: Record<string, number> = {};
  for (const r of rows) byCust[r.customerId] = r.n;
  const counts = Object.values(byCust);
  const returning = counts.filter(n => n >= 2).length;
  const total = counts.length;
  const returningShare = total > 0 ? returning / total : 0;
  return { returningShare, returning, totalCustomers: total };
}

