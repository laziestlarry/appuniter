import process from 'process';
import * as dotenv from 'dotenv';

dotenv.config();

export const NLPCLOUD_TOKEN = process.env.NLPCLOUD_TOKEN ?? '';
export const OPENAI_TOKEN = process.env.OPENAI_TOKEN ?? '';
export const SERP_KEY = process.env.SERP_KEY ?? '';
export const TEMPORAL_HOST = process.env.TEMPORAL_HOST ?? '';
export const EMBEDDINGS_URL = process.env.EMBEDDINGS_URL ?? '';
export const ELASTIC_CONFIG = JSON.parse(process.env.ELASTIC_CONFIG ?? '{}');
export const GITHUB_REPOS: string[] = (() => {
  try {
    if (process.env.GITHUB_REPOS) return JSON.parse(process.env.GITHUB_REPOS);
  } catch {}
  const csv = process.env.GITHUB_REPOS_CSV ?? '';
  return csv ? csv.split(',').map(s => s.trim()).filter(Boolean) : [];
})();
export const DRIVE_FOLDERS: string[] = (() => {
  try {
    if (process.env.DRIVE_FOLDERS) return JSON.parse(process.env.DRIVE_FOLDERS);
  } catch {}
  const csv = process.env.DRIVE_FOLDERS_CSV ?? '';
  return csv ? csv.split(',').map(s => s.trim()).filter(Boolean) : [];
})();
