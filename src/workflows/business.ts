import { proxyActivities } from '@temporalio/workflow';
import { promptTemplate } from './prompt';
import * as elasticActivities from '../activities/elastic';
import * as embeddingsActivities from '../activities/embeddings';
import * as vectorSearchActivities from '../activities/vector_search';
import { ConnectorRegistry, MarketplaceConnector, Product, normalizeKey } from '../integrations';

const { es_index } = proxyActivities<typeof elasticActivities>({ startToCloseTimeout: '10 minute' });
const { nlp_embeddings } = proxyActivities<typeof embeddingsActivities>({ startToCloseTimeout: '10 minute' });
const { init_elasticsearch_mappings } = proxyActivities<typeof vectorSearchActivities>({ startToCloseTimeout: '10 minute' });

export interface InventoryUnionResult {
  version: string;
  generatedAt: string;
  products: Array< Product & { sources: string[]; totalQuantity?: number } >;
  provenance: Record<string, string[]>; // key -> list of connector ids
}

function getConnectors(ids?: string[]): MarketplaceConnector[] {
  const all = ConnectorRegistry.list();
  if (!ids || ids.length === 0) return all;
  const set = new Set(ids.map(x => x.toLowerCase()));
  return all.filter(c => set.has(c.id.toLowerCase()));
}

export async function unifyInventory(connectorIds: string[] = []): Promise<InventoryUnionResult> {
  const connectors = getConnectors(connectorIds);
  const seen: Map<string, Product & { sources: string[]; totalQuantity?: number }> = new Map();
  const provenance: Record<string, string[]> = {};

  for (const c of connectors) {
    const products = await c.listProducts();
    for (const p of products) {
      const key = normalizeKey(p);
      const existing = seen.get(key);
      if (existing) {
        existing.totalQuantity = (existing.totalQuantity || 0) + (p.quantity || 0);
        existing.sources.push(c.id);
        provenance[key] = Array.from(new Set([...(provenance[key] || []), c.id]));
      } else {
        seen.set(key, { ...p, totalQuantity: p.quantity, sources: [c.id] });
        provenance[key] = [c.id];
      }
    }
  }

  return {
    version: '0.1.0',
    generatedAt: new Date().toISOString(),
    products: Array.from(seen.values()),
    provenance
  };
}

export interface MarketingCopyResult {
  version: string;
  product: Product;
  title: string;
  description: string;
  keywords: string[];
}

export async function generateProductCopy(product: Product, tone: string = 'friendly, concise'): Promise<MarketingCopyResult> {
  const prompt = `You are an expert ecommerce copywriter.

Write an SEO-optimized title, a 2–3 sentence description, and 8–12 comma-separated keywords for the product below.
Use a tone that is {{{tone}}}.

Product Name: {{{title}}}
Description: {{{description}}}
Tags: {{{tags}}}
Price: $ {{{price}}}

Return only valid JSON with keys: title, description, keywords (as an array).`;

  const raw = await promptTemplate(
    prompt,
    {
      tone,
      title: product.title,
      description: product.description || '',
      tags: (product.tags || []).join(', '),
      price: product.price || ''
    },
    20,
    512,
    0.7
  );

  let parsed: any;
  try { parsed = JSON.parse(raw); } catch (e) { parsed = { title: product.title, description: product.description || '', keywords: product.tags || [] }; }

  return {
    version: '0.1.0',
    product,
    title: parsed.title || product.title,
    description: parsed.description || product.description || '',
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords : (product.tags || [])
  };
}

export interface IngestMessage { text: string; user?: string; ts?: string; channel?: string; }

export async function ingestMessages(index: string, messages: IngestMessage[]): Promise<string> {
  await init_elasticsearch_mappings().catch(() => {});

  const texts = messages.map(m => m.text);
  let vectors: [string, number[]][] = [];
  try {
    vectors = await nlp_embeddings('paraphrase-multilingual-mpnet-base-v2', texts);
  } catch (e) {
    // embeddings optional
    vectors = [];
  }

  const vecMap = new Map<string, number[]>(vectors.map(v => [v[0], v[1]]));
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    const vec = vecMap.get(m.text);
    const doc: any = {
      text: m.text,
      user: m.user || 'unknown',
      ts: m.ts || new Date().toISOString(),
      channel: m.channel || 'ingest',
    };
    if (vec) doc.embeddings = vec;
    const isLast = i === messages.length - 1;
    await es_index(index, doc, isLast);
  }

  return `Ingested ${messages.length} messages into ${index}`;
}
