import { proxyActivities } from '@temporalio/workflow';
import * as connectors from '../activities/connectors';
import * as elastic from '../activities/elastic';
import { normalizeKey, Product } from '../integrations/common';

const { connectorListProducts, connectorListOrders, connectorCreateListing } = proxyActivities<typeof connectors>({ startToCloseTimeout: '10 minute' });
const { es_index } = proxyActivities<typeof elastic>({ startToCloseTimeout: '10 minute' });

export interface SyncResult { connectorId: string; indexed: number; index: string; }

export async function syncConnectorInventoryToERP(connectorId: string, erpIndex: string = 'erp_inventory'): Promise<SyncResult> {
  const products = await connectorListProducts(connectorId);
  let i = 0;
  for (const p of products) {
    const key = normalizeKey(p);
    const doc: any = { ...p, key, sources: [connectorId] };
    await es_index(erpIndex, doc, ++i === products.length);
  }
  return { connectorId, indexed: products.length, index: erpIndex };
}

export interface OrdersSyncResult { connectorId: string; indexed: number; index: string; }

export async function fetchOrdersAndIndex(connectorId: string, ordersIndex: string = 'orders', sinceIso?: string): Promise<OrdersSyncResult> {
  const orders = await connectorListOrders(connectorId, sinceIso);
  let i = 0;
  for (const o of orders) {
    const total = (o.items || []).reduce((acc, it) => acc + (it.price || 0) * (it.quantity || 0), 0);
    const doc: any = { ...o, order_total: total, connector: connectorId };
    await es_index(ordersIndex, doc, ++i === orders.length);
  }
  return { connectorId, indexed: orders.length, index: ordersIndex };
}

export interface PublishResult { connectors: string[]; listingIds: string[]; }

export async function publishProductEverywhere(product: Product, connectorsIds: string[]): Promise<PublishResult> {
  const listingIds: string[] = [];
  for (const id of connectorsIds) {
    const lid = await connectorCreateListing(id, product);
    listingIds.push(lid);
  }
  return { connectors: connectorsIds, listingIds };
}

