import { ConnectorRegistry, MarketplaceConnector, Product, Order } from '../common';

const VERSION = '0.1.0';

class AmazonConnector implements MarketplaceConnector {
  id = 'amazon';
  name = 'Amazon';
  version = VERSION;
  mode: 'mock' | 'live' = 'mock';

  async listProducts(): Promise<Product[]> {
    if (this.mode === 'mock') {
      return [
        {
          id: 'amazon-A1',
          sku: 'SKU-UNION-001',
          title: 'Union Tee Prime',
          description: 'Prime-eligible Union Tee',
          price: 18.99,
          quantity: 25,
          tags: ['prime', 'tshirt'],
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
          id: 'amazon-order-1',
          items: [{ productId: 'amazon-A1', quantity: 3, price: 18.99 }],
          createdAt: new Date().toISOString(),
          status: 'shipped',
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

ConnectorRegistry.register(new AmazonConnector());

export default AmazonConnector;
