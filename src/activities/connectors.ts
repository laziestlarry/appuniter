import { ConnectorRegistry } from '../integrations';
import type { Product, Order } from '../integrations/common';

export async function connectorListProducts(connectorId: string): Promise<Product[]> {
  const c = ConnectorRegistry.get(connectorId);
  if (!c) throw new Error(`Connector not found: ${connectorId}`);
  return c.listProducts();
}

export async function connectorListOrders(connectorId: string, sinceIso?: string): Promise<Order[]> {
  const c = ConnectorRegistry.get(connectorId);
  if (!c) throw new Error(`Connector not found: ${connectorId}`);
  return c.listOrders(sinceIso);
}

export async function connectorUpdateInventory(connectorId: string, productId: string, quantity: number): Promise<void> {
  const c = ConnectorRegistry.get(connectorId);
  if (!c) throw new Error(`Connector not found: ${connectorId}`);
  return c.updateInventory(productId, quantity);
}

export async function connectorCreateListing(connectorId: string, product: Product): Promise<string> {
  const c = ConnectorRegistry.get(connectorId);
  if (!c) throw new Error(`Connector not found: ${connectorId}`);
  return c.createListing(product);
}

