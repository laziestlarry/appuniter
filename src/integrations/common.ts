export interface Product {
  id: string;
  sku?: string;
  title: string;
  description?: string;
  price?: number;
  quantity?: number;
  tags?: string[];
  variants?: any[];
  images?: string[];
  metadata?: Record<string, any>;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price?: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  customerId?: string;
  createdAt?: string;
  status?: string;
  raw?: any;
}

export interface Customer {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  addresses?: any[];
  metadata?: Record<string, any>;
}

export interface MarketplaceConnector {
  id: string;
  name: string;
  version: string;
  mode?: 'mock' | 'live';
  listProducts(): Promise<Product[]>;
  getProduct(productId: string): Promise<Product | null>;
  listOrders(sinceIso?: string): Promise<Order[]>;
  updateInventory(productId: string, quantity: number): Promise<void>;
  createListing(product: Product): Promise<string>;
}

export class ConnectorRegistry {
  private static connectors: Map<string, MarketplaceConnector> = new Map();

  static register(connector: MarketplaceConnector) {
    this.connectors.set(connector.id, connector);
  }

  static get(id: string): MarketplaceConnector | undefined {
    return this.connectors.get(id);
  }

  static list(): MarketplaceConnector[] {
    return Array.from(this.connectors.values());
  }
}

export function normalizeKey(p: Product): string {
  const base = (p.sku || p.title || p.id || '').toLowerCase().trim();
  return base.replace(/\s+/g, ' ').replace(/[^a-z0-9 _-]/g, '');
}

