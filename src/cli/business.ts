import { Connection, WorkflowClient } from '@temporalio/client';
import { nanoid } from 'nanoid';
import fs from 'fs';
import * as config from '../config';
import { unifyInventory, generateProductCopy, ingestMessages, syncConnectorInventoryToERP, fetchOrdersAndIndex, publishProductEverywhere } from '../workflows';
import { ConnectorRegistry } from '../integrations';

async function run() {
  const connection = await Connection.connect({ address: config.TEMPORAL_HOST });
  const client = new WorkflowClient({ connection });

  const cmd = process.argv[2] || 'help';

  if (cmd === 'help' || cmd === '--help' || cmd === '-h') {
    console.log(
      'business.ts commands:\n' +
      '  sync-inventory [connectorIds...]\n' +
      '  gen-content <productJsonPath>\n' +
      '  ingest-messages <index> <messagesJsonPath>\n' +
      '  list-connectors\n' +
      '  sync-to-erp <connectorId> <erpIndex>\n' +
      '  fetch-orders <connectorId> <ordersIndex> [sinceIso]\n' +
      '  publish-product <productJsonPath> [connectorIds...]\n'
    );
    process.exit(0);
  }

  if (cmd === 'list-connectors') {
    console.log(JSON.stringify(ConnectorRegistry.list().map(c => ({ id: c.id, name: c.name, version: c.version })), null, 2));
    process.exit(0);
  }

  if (cmd === 'sync-inventory') {
    const ids = process.argv.slice(3);
    const handle = await client.start(unifyInventory, {
      args: [ids],
      taskQueue: 'hello-world',
      workflowId: 'biz-sync-' + nanoid()
    });
    const result = await handle.result();
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  }

  if (cmd === 'sync-to-erp') {
    const connectorId = process.argv[3];
    const erpIndex = process.argv[4] || 'erp_inventory';
    if (!connectorId) throw new Error('Usage: sync-to-erp <connectorId> <erpIndex>');
    const handle = await client.start(syncConnectorInventoryToERP, {
      args: [connectorId, erpIndex],
      taskQueue: 'hello-world',
      workflowId: 'biz-erp-' + nanoid()
    });
    console.log(JSON.stringify(await handle.result(), null, 2));
    process.exit(0);
  }

  if (cmd === 'fetch-orders') {
    const connectorId = process.argv[3];
    const ordersIndex = process.argv[4] || 'orders';
    const since = process.argv[5];
    if (!connectorId) throw new Error('Usage: fetch-orders <connectorId> <ordersIndex> [sinceIso]');
    const handle = await client.start(fetchOrdersAndIndex, {
      args: [connectorId, ordersIndex, since],
      taskQueue: 'hello-world',
      workflowId: 'biz-orders-' + nanoid()
    });
    console.log(JSON.stringify(await handle.result(), null, 2));
    process.exit(0);
  }

  if (cmd === 'publish-product') {
    const path = process.argv[3];
    const ids = process.argv.slice(4);
    if (!path || ids.length === 0) throw new Error('Usage: publish-product <productJsonPath> [connectorIds...]');
    const product = JSON.parse(await fs.promises.readFile(path, 'utf-8'));
    const handle = await client.start(publishProductEverywhere, {
      args: [product, ids],
      taskQueue: 'hello-world',
      workflowId: 'biz-publish-' + nanoid()
    });
    console.log(JSON.stringify(await handle.result(), null, 2));
    process.exit(0);
  }

  if (cmd === 'gen-content') {
    const path = process.argv[3];
    if (!path) throw new Error('Provide product JSON path');
    const product = JSON.parse(await fs.promises.readFile(path, 'utf-8'));
    const tone = process.argv[4] || 'friendly, concise';
    const handle = await client.start(generateProductCopy, {
      args: [product, tone],
      taskQueue: 'hello-world',
      workflowId: 'biz-copy-' + nanoid()
    });
    const result = await handle.result();
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  }

  if (cmd === 'ingest-messages') {
    const index = process.argv[3];
    const path = process.argv[4];
    if (!index || !path) throw new Error('Usage: ingest-messages <index> <messagesJsonPath>');
    const messages = JSON.parse(await fs.promises.readFile(path, 'utf-8'));
    const handle = await client.start(ingestMessages, {
      args: [index, messages],
      taskQueue: 'hello-world',
      workflowId: 'biz-ingest-' + nanoid()
    });
    const result = await handle.result();
    console.log(result);
    process.exit(0);
  }

  throw new Error(`Unknown command: ${cmd}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
