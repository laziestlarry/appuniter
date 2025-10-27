import { ConnectorRegistry } from './common';

// Importing these files registers the connectors with the registry
import './marketplaces/shopify';
import './marketplaces/etsy';
import './marketplaces/amazon';

export { ConnectorRegistry } from './common';
export * from './common';

