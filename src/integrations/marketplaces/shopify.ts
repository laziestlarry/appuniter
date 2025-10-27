import { ConnectorRegistry, MarketplaceConnector, Product, Order } from '../common';

const VERSION = '0.1.0';

class ShopifyConnector implements MarketplaceConnector {
  id = 'shopify';
  name = 'Shopify';
  version = VERSION;
  mode: 'mock' | 'live' = 'mock';

  async listProducts(): Promise<Product[]> {
    if (this.mode === 'mock') {
      return [
        {
          id: 'shopify-001',
          sku: 'SKU-UNION-001',
          title: 'Union Tee',
          description: 'Soft cotton tee',
          price: 19.99,
          quantity: 10,
          tags: ['apparel', 'tshirt'],
          metadata: { source: this.id }
        }
      ];
    }
    // TODO: Implement live API calls
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
          id: 'shopify-order-1',
          items: [{ productId: 'shopify-001', quantity: 2, price: 19.99 }],
          createdAt: new Date().toISOString(),
          status: 'paid',
          raw: { source: this.id }
        }
      ];
    }
    return [];
  }

  async updateInventory(productId: string, quantity: number): Promise<void> {
    // TODO: Implement live API calls
    if (this.mode === 'mock') {
      return;
    }
  }

  async createListing(product: Product): Promise<string> {
    // TODO: Implement live API calls
    return this.mode === 'mock' ? `mock-${this.id}-${product.sku || product.id}` : '';
  }
}

ConnectorRegistry.register(new ShopifyConnector());

export default ShopifyConnector;
