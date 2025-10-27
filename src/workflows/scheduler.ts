import { proxyActivities, sleep } from '@temporalio/workflow';
import * as elastic from '../activities/elastic';
import { ingestLatestLocal, suggestImprovements } from './knowledge';

const { es_index } = proxyActivities<typeof elastic>({ startToCloseTimeout: '10 minute' });

export interface NightlyIngestArgs { knowledgeIndex: string; basePath?: string; maxFiles?: number; intervalHours?: number; }
export async function nightlyIngestLoop(args: NightlyIngestArgs): Promise<void> {
  const interval = Math.max(1, args.intervalHours ?? 24);
  while (true) {
    await ingestLatestLocal(args.knowledgeIndex, args.basePath || '.', args.maxFiles || 300);
    await sleep(`${interval} hours`);
  }
}

export interface WeeklyImprovementsArgs { knowledgeIndex: string; objective: string; plansIndex?: string; intervalHours?: number; }
export async function weeklyImprovementsLoop(args: WeeklyImprovementsArgs): Promise<void> {
  const interval = Math.max(1, args.intervalHours ?? 24 * 7);
  while (true) {
    const plan = await suggestImprovements(args.knowledgeIndex, args.objective);
    const doc: any = { objective: args.objective, plan, ts: new Date().toISOString() };
    await es_index(args.plansIndex || 'improvement_plans', doc, true);
    await sleep(`${interval} hours`);
  }
}

