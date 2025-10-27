import { proxyActivities } from '@temporalio/workflow';
import { promptTemplate, mapreduce_summary } from './prompt';
import * as elasticActivities from '../activities/elastic';

const { es_index } = proxyActivities<typeof elasticActivities>({ startToCloseTimeout: '10 minute' });

export interface FeatureSpec {
  id?: string;
  title: string;
  description: string;
  priority?: 'P0' | 'P1' | 'P2';
  owner?: string;
  metrics?: string[];
  acceptance?: string[];
  tags?: string[];
  version?: string;
}

export async function registerFeatures(index: string, features: FeatureSpec[]): Promise<string> {
  for (let i = 0; i < features.length; i++) {
    const f = features[i];
    const doc: any = {
      type: 'feature',
      id: f.id || `feat-${Date.now()}-${i}`,
      title: f.title,
      description: f.description,
      priority: f.priority || 'P2',
      owner: f.owner || 'unassigned',
      metrics: (f.metrics || []).join(','),
      acceptance: (f.acceptance || []).join('\n'),
      tags: (f.tags || []).join(','),
      version: f.version || '0.1.0',
      ts: new Date().toISOString(),
    };
    await es_index(index, doc, i === features.length - 1);
  }
  return `Registered ${features.length} features into ${index}`;
}

export async function learnTasksFromMessages(messages: { text: string }[], sprintGoal: string = 'Increase revenue'): Promise<FeatureSpec[]> {
  const corpus = messages.map(m => m.text).join('\n');
  const summarized = await mapreduce_summary(corpus);
  const prompt = `Based on the summary below, extract a set of implementable feature tasks that support the sprint goal.\n\nSprint Goal: {{{goal}}}\nSummary:\n{{{summary}}}\n\nReturn a JSON array of FeatureSpec objects with keys: title, description, priority (P0/P1/P2), metrics (array), acceptance (array), tags (array).`;
  const raw = await promptTemplate(prompt, { goal: sprintGoal, summary: summarized }, 50, 1200, 0.5);
  try { return JSON.parse(raw); } catch { return []; }
}

export interface SprintPlan { goal: string; items: FeatureSpec[]; note?: string; }

export async function planSprint(backlog: FeatureSpec[], goal: string): Promise<SprintPlan> {
  // Simple greedy selector by priority order
  const order = { P0: 0, P1: 1, P2: 2 } as any;
  const sorted = [...backlog].sort((a, b) => (order[a.priority || 'P2'] - order[b.priority || 'P2']));
  const capacity = 8; // naive capacity bucket
  const items = sorted.slice(0, capacity);
  return { goal, items, note: `Planned ${items.length} items.` };
}

