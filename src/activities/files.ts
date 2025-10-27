import fs from 'fs';
import path from 'path';

export interface KnowledgeDoc {
  id?: string;
  path?: string;
  title?: string;
  text: string;
  tags?: string[];
  source?: string;
}

const DEFAULT_EXCLUDE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'out', 'coverage', '.next', '.cache'
]);

const TEXT_EXT = new Set([
  '.md', '.mdx', '.txt', '.rst', '.ts', '.tsx', '.js', '.jsx', '.json',
  '.yml', '.yaml', '.toml', '.go', '.rs', '.py', '.java', '.rb', '.cs',
  '.c', '.h', '.cpp', '.hpp', '.sh'
]);

function isTextFile(p: string): boolean {
  const ext = path.extname(p).toLowerCase();
  return TEXT_EXT.has(ext);
}

function shouldSkipDir(name: string): boolean {
  return DEFAULT_EXCLUDE_DIRS.has(name);
}

export interface ScanOptions {
  maxBytes?: number; // per file limit
  maxFiles?: number; // overall limit
}

export async function readTextSafe(filePath: string, maxBytes: number = 256 * 1024): Promise<string> {
  const stat = await fs.promises.stat(filePath);
  if (stat.size > maxBytes) {
    const fh = await fs.promises.open(filePath, 'r');
    const buf = Buffer.allocUnsafe(maxBytes);
    await fh.read(buf, 0, maxBytes, 0);
    await fh.close();
    return buf.toString('utf-8');
  }
  return fs.promises.readFile(filePath, 'utf-8');
}

export async function scanKnowledge(root: string, options: ScanOptions = {}): Promise<KnowledgeDoc[]> {
  const docs: KnowledgeDoc[] = [];
  const maxBytes = options.maxBytes ?? 256 * 1024;
  const maxFiles = options.maxFiles ?? 2000;

  async function walk(dir: string) {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      if (docs.length >= maxFiles) return;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (shouldSkipDir(e.name)) continue;
        await walk(full);
      } else if (e.isFile()) {
        if (!isTextFile(full)) continue;
        try {
          const text = await readTextSafe(full, maxBytes);
          docs.push({ id: full, path: full, title: path.basename(full), text, source: 'local' });
        } catch { /* ignore */ }
      }
    }
  }

  try { await walk(root); } catch { /* ignore */ }
  return docs;
}

export async function scanMultiple(paths: string[], options: ScanOptions = {}): Promise<KnowledgeDoc[]> {
  const all: KnowledgeDoc[] = [];
  for (const p of paths) {
    const d = await scanKnowledge(p, options);
    for (const doc of d) all.push(doc);
  }
  return all;
}

export interface GitRepoInfo { path: string; origin?: string; }

export async function listGitRepos(basePath: string): Promise<GitRepoInfo[]> {
  const repos: GitRepoInfo[] = [];

  async function walk(dir: string) {
    let entries: fs.Dirent[] = [];
    try { entries = await fs.promises.readdir(dir, { withFileTypes: true }); } catch { return; }
    const hasGit = entries.some(e => e.isDirectory() && e.name === '.git');
    if (hasGit) {
      const cfg = path.join(dir, '.git', 'config');
      let origin: string | undefined;
      try {
        const text = await fs.promises.readFile(cfg, 'utf-8');
        const m = text.match(/\[remote \"origin\"\][\s\S]*?url\s*=\s*(.+)/);
        if (m) origin = m[1].trim();
      } catch {}
      repos.push({ path: dir, origin });
      return; // don't recurse into repos
    }
    for (const e of entries) {
      if (e.isDirectory()) {
        if (shouldSkipDir(e.name)) continue;
        await walk(path.join(dir, e.name));
      }
    }
  }

  await walk(basePath);
  return repos;
}

export function suggestedLocalPaths(basePath: string): string[] {
  const paths: string[] = [];
  const candidates = ['.', 'src', 'docs', 'services'];
  for (const c of candidates) {
    const full = path.resolve(basePath, c);
    if (fs.existsSync(full)) paths.push(full);
  }
  return Array.from(new Set(paths));
}

export async function scanKnowledgeLatest(root: string, options: ScanOptions = {}): Promise<KnowledgeDoc[]> {
  const files: Array<{ p: string; mtime: number }> = [];

  async function walk(dir: string) {
    let entries: fs.Dirent[] = [];
    try { entries = await fs.promises.readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (shouldSkipDir(e.name)) continue;
        await walk(full);
      } else if (e.isFile()) {
        if (!isTextFile(full)) continue;
        try {
          const st = await fs.promises.stat(full);
          files.push({ p: full, mtime: st.mtimeMs });
        } catch {}
      }
    }
  }

  await walk(root);
  files.sort((a, b) => b.mtime - a.mtime);
  const maxFiles = options.maxFiles ?? 200;
  const maxBytes = options.maxBytes ?? 256 * 1024;
  const picked = files.slice(0, maxFiles);
  const docs: KnowledgeDoc[] = [];
  for (const f of picked) {
    try {
      const text = await readTextSafe(f.p, maxBytes);
      docs.push({ id: f.p, path: f.p, title: path.basename(f.p), text, source: 'local' });
    } catch {}
  }
  return docs;
}

