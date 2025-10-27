import { ConnectorRegistry, MarketplaceConnector, Product, Order } from '../common';

const VERSION = '0.1.0';

class EtsyConnector implements MarketplaceConnector {
  id = 'etsy';
  name = 'Etsy';
  version = VERSION;
  mode: 'mock' | 'live' = 'mock';

  async listProducts(): Promise<Product[]> {
    if (this.mode === 'mock') {
      return [
        {
          id: 'etsy-100',
          sku: 'SKU-UNION-001',
          title: 'Union Tee Handcrafted',
          description: 'Handcrafted variant of Union Tee',
          price: 22.99,
          quantity: 5,
          tags: ['handmade', 'tshirt'],
          metadata: { source: this.id }
        }
      ];
    }
    return [];
  }

  async getProduct(productId: string): Promise<Product | null> {
    const all = await this.listProducts();
    return all.find(p => p.id === productId) || null;
  }

  async listOrders(): Promise<Order[]> {
    if (this.mode === 'mock') {
      return [
        {
          id: 'etsy-order-1',
          items: [{ productId: 'etsy-100', quantity: 1, price: 22.99 }],
          createdAt: new Date().toISOString(),
          status: 'paid',
          raw: { source: this.id }
        }
      ];
    }
    return [];
  }

  async updateInventory(productId: string, quantity: number): Promise<void> {
    if (this.mode === 'mock') return;
  }

  async createListing(product: Product): Promise<string> {
    return this.mode === 'mock' ? `mock-${this.id}-${product.sku || product.id}` : '';
  }
}

ConnectorRegistry.register(new EtsyConnector());

export default EtsyConnector;
