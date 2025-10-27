import { proxyActivities } from '@temporalio/workflow';
import { promptTemplate } from './prompt';
import { embeddingsFromTextSearch } from './embeddings';
import * as elasticActivities from '../activities/elastic';
import * as embeddingsActivities from '../activities/embeddings';
import * as fileActivities from '../activities/files';
import * as config from '../config';

const { es_index } = proxyActivities<typeof elasticActivities>({ startToCloseTimeout: '10 minute' });
const { nlp_embeddings } = proxyActivities<typeof embeddingsActivities>({ startToCloseTimeout: '10 minute' });
const { scanMultiple, listGitRepos, suggestedLocalPaths, scanKnowledgeLatest } = proxyActivities<typeof fileActivities>({ startToCloseTimeout: '10 minute' });

export interface KnowledgeDoc {
  id?: string;
  path?: string;
  title?: string;
  text: string;
  tags?: string[];
  source?: string;
}

export async function ingestKnowledge(index: string, docs: KnowledgeDoc[]): Promise<string> {
  const texts = docs.map(d => d.text);
  let vectors: [string, number[]][] = [];
  try {
    vectors = await nlp_embeddings('paraphrase-multilingual-mpnet-base-v2', texts);
  } catch (e) {
    vectors = [];
  }
  const vecMap = new Map<string, number[]>(vectors.map(v => [v[0], v[1]]));

  for (let i = 0; i < docs.length; i++) {
    const d = docs[i];
    const vec = vecMap.get(d.text);
    const doc: any = {
      path: d.path || d.id || `doc-${i}`,
      title: d.title || '',
      text: d.text,
      tags: (d.tags || []).join(','),
      source: d.source || 'knowledge',
    };
    if (vec) doc.embeddings = vec;
    await es_index(index, doc, i === docs.length - 1);
  }
  return `Ingested ${docs.length} knowledge docs into ${index}`;
}

export async function searchKnowledge<T = any>(index: string, query: string, k: number = 5): Promise<Array<{ score: number; source: T }>> {
  const results = await embeddingsFromTextSearch<T>(index, query, k);
  return results.map(r => ({ score: r._score, source: r._source }));
}

export async function suggestImprovements(index: string, objective: string): Promise<string> {
  const ctx = await searchKnowledge<any>(index, objective, 5);
  const context = ctx.map(c => JSON.stringify(c.source)).join('\n');
  const prompt = `You are an AI architect responsible for continuous improvement.\n\nObjective:\n{{{objective}}}\n\nContext (top results):\n{{{context}}}\n\nPropose a prioritized plan of improvements with for each item: title, rationale, expected impact, success metrics, dependencies, and implementation notes. Return valid JSON array.`;
  const response = await promptTemplate(prompt, { objective, context }, 50, 1200, 0.4);
  return response;
}

export interface DiscoverSourcesResult {
  localPaths: string[];
  gitRepos: Array<{ path: string; origin?: string }>;
  driveFolders: string[]; // from env/inputs in the future
}

export async function discoverLocalSources(basePath: string = '.'): Promise<DiscoverSourcesResult> {
  const locals = await suggestedLocalPaths(basePath);
  const repos = await listGitRepos(basePath);
  const driveFolders: string[] = config.DRIVE_FOLDERS || [];
  const repoRemotes = (config.GITHUB_REPOS || []).map((r) => ({ path: '', origin: r }));
  // merge discovered repos and configured remotes
  const gitRepos = [...repos, ...repoRemotes];
  return { localPaths: locals, gitRepos, driveFolders };
}

export async function ingestLocalKnowledge(index: string, paths: string[], maxFiles: number = 1500): Promise<string> {
  const docs = await scanMultiple(paths, { maxFiles });
  // Reuse ingestKnowledge path to index + vectorize
  return ingestKnowledge(index, docs as any);
}

export async function proposeRepoExtensions(paths: string[], objective: string = 'Increase value and maintainability'): Promise<string> {
  const docs = await scanMultiple(paths, { maxFiles: 300 });
  const filenames = docs.map(d => d.path || d.id || '').filter(Boolean).slice(0, 400).join('\n');
  const sample = docs.slice(0, 20).map(d => `File: ${d.path}\n---\n${(d.text || '').slice(0, 800)}`).join('\n\n');
  const prompt = `You are an expert software architect. Propose repository extensions and integrations aligned to the objective.\n\nObjective: {{{objective}}}\n\nFiles (subset):\n{{{filenames}}}\n\nSample contents (truncated):\n{{{sample}}}\n\nReturn a JSON array of extension ideas. Each item: { title, rationale, effort: 'S/M/L', impact: 'S/M/L', steps: string[], filesToChange: string[] }`;
  const res = await promptTemplate(prompt, { objective, filenames, sample }, 50, 1400, 0.5);
  return res;
}

export async function ingestLatestLocal(index: string, basePath: string = '.', maxFiles: number = 200): Promise<string> {
  const docs = await scanKnowledgeLatest(basePath, { maxFiles });
  return ingestKnowledge(index, docs as any);
}
