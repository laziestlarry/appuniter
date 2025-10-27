import { Connection, WorkflowClient } from '@temporalio/client';
import { nanoid } from 'nanoid';
import * as config from '../config';
import { createOrganization, addUnit, addBranch, addPartnerRepo, ingestPartnerRepositories, unifyAllInventory, initialLaunch } from '../workflows';

async function run() {
  const connection = await Connection.connect({ address: config.TEMPORAL_HOST });
  const client = new WorkflowClient({ connection });

  const cmd = process.argv[2] || 'help';
  if (cmd === 'help' || cmd === '--help' || cmd === '-h') {
    console.log(
      'uniter.ts commands:\n' +
      '  create-org <orgId> <name> [description]\n' +
      '  add-unit <orgId> <unitId> <name> [connectorIdsCSV]\n' +
      '  add-branch <orgId> <unitId> <branchId> <name> [region]\n' +
      '  add-partner <orgId> <partnerId> <name> <pathOrUrl> [type]\n' +
      '  ingest-partners <orgId> <knowledgeIndex>\n' +
      '  unify-all <orgId>\n' +
      '  launch <orgId> <knowledgeIndex> [basePath]\n'
    );
    process.exit(0);
  }

  if (cmd === 'create-org') {
    const [orgId, name, description] = [process.argv[3], process.argv[4], process.argv[5]];
    const handle = await client.start(createOrganization, { args: [orgId, name, description], taskQueue: 'hello-world', workflowId: 'uniter-create-' + nanoid() });
    console.log(JSON.stringify(await handle.result(), null, 2));
    process.exit(0);
  }

  if (cmd === 'add-unit') {
    const [orgId, unitId, name] = [process.argv[3], process.argv[4], process.argv[5]];
    const connectors = (process.argv[6] || '').split(',').filter(Boolean);
    const unit = { id: unitId, name, connectors } as any;
    const handle = await client.start(addUnit, { args: [orgId, unit], taskQueue: 'hello-world', workflowId: 'uniter-unit-' + nanoid() });
    console.log(JSON.stringify(await handle.result(), null, 2));
    process.exit(0);
  }

  if (cmd === 'add-branch') {
    const [orgId, unitId, branchId, name, region] = [process.argv[3], process.argv[4], process.argv[5], process.argv[6], process.argv[7]];
    const branch = { id: branchId, name, region } as any;
    const handle = await client.start(addBranch, { args: [orgId, unitId, branch], taskQueue: 'hello-world', workflowId: 'uniter-branch-' + nanoid() });
    console.log(JSON.stringify(await handle.result(), null, 2));
    process.exit(0);
  }

  if (cmd === 'add-partner') {
    const [orgId, partnerId, name, url, type] = [process.argv[3], process.argv[4], process.argv[5], process.argv[6], process.argv[7]];
    const partner = { id: partnerId, name, url, type } as any;
    const handle = await client.start(addPartnerRepo, { args: [orgId, partner], taskQueue: 'hello-world', workflowId: 'uniter-partner-' + nanoid() });
    console.log(JSON.stringify(await handle.result(), null, 2));
    process.exit(0);
  }

  if (cmd === 'ingest-partners') {
    const [orgId, index] = [process.argv[3], process.argv[4]];
    const handle = await client.start(ingestPartnerRepositories, { args: [orgId, index], taskQueue: 'hello-world', workflowId: 'uniter-ingest-partners-' + nanoid() });
    console.log(JSON.stringify(await handle.result(), null, 2));
    process.exit(0);
  }

  if (cmd === 'unify-all') {
    const orgId = process.argv[3];
    const handle = await client.start(unifyAllInventory, { args: [orgId], taskQueue: 'hello-world', workflowId: 'uniter-unify-' + nanoid() });
    console.log(JSON.stringify(await handle.result(), null, 2));
    process.exit(0);
  }

  if (cmd === 'launch') {
    const [orgId, knowledgeIndex, basePath] = [process.argv[3], process.argv[4], process.argv[5] || '.'];
    const handle = await client.start(initialLaunch, { args: [orgId, knowledgeIndex, basePath], taskQueue: 'hello-world', workflowId: 'uniter-launch-' + nanoid() });
    console.log(JSON.stringify(await handle.result(), null, 2));
    process.exit(0);
  }

  throw new Error(`Unknown command: ${cmd}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

