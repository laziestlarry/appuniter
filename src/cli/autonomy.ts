import { Connection, WorkflowClient } from '@temporalio/client';
import { nanoid } from 'nanoid';
import fs from 'fs';
import * as config from '../config';
import { ingestKnowledge, searchKnowledge, suggestImprovements, learnTasksFromMessages, registerFeatures, planSprint, FeatureSpec, discoverLocalSources, ingestLocalKnowledge, proposeRepoExtensions, ingestLatestLocal } from '../workflows';

async function run() {
  const connection = await Connection.connect({ address: config.TEMPORAL_HOST });
  const client = new WorkflowClient({ connection });

  const cmd = process.argv[2] || 'help';
  if (cmd === 'help' || cmd === '--help' || cmd === '-h') {
    console.log(
      'autonomy.ts commands:\n' +
      '  ingest-knowledge <index> <docs.json>\n' +
      '  search-knowledge <index> <query> [k]\n' +
      '  propose-improvements <index> <objective>\n' +
      '  learn-tasks <messages.json> [sprintGoal]\n' +
      '  register-features <index> <features.json>\n' +
      '  plan-sprint <backlog.json> <goal>\n' +
      '  discover-sources [basePath]\n' +
      '  ingest-local <index> <path1> [path2 ...]\n'
      + '  ingest-latest <index> [basePath] [maxFiles]\n'
    );
    process.exit(0);
  }

  if (cmd === 'ingest-knowledge') {
    const index = process.argv[3];
    const path = process.argv[4];
    const docs = JSON.parse(await fs.promises.readFile(path, 'utf-8'));
    const handle = await client.start(ingestKnowledge, { args: [index, docs], taskQueue: 'hello-world', workflowId: 'auto-know-' + nanoid() });
    console.log(await handle.result());
    process.exit(0);
  }

  if (cmd === 'search-knowledge') {
    const index = process.argv[3];
    const query = process.argv[4];
    const k = parseInt(process.argv[5] || '5', 10);
    const handle = await client.start(searchKnowledge, { args: [index, query, k], taskQueue: 'hello-world', workflowId: 'auto-search-' + nanoid() });
    console.log(JSON.stringify(await handle.result(), null, 2));
    process.exit(0);
  }

  if (cmd === 'propose-improvements') {
    const index = process.argv[3];
    const objective = process.argv[4];
    const handle = await client.start(suggestImprovements, { args: [index, objective], taskQueue: 'hello-world', workflowId: 'auto-propose-' + nanoid() });
    console.log(await handle.result());
    process.exit(0);
  }

  if (cmd === 'learn-tasks') {
    const path = process.argv[3];
    const goal = process.argv[4] || 'Increase revenue';
    const messages = JSON.parse(await fs.promises.readFile(path, 'utf-8'));
    const handle = await client.start(learnTasksFromMessages, { args: [messages, goal], taskQueue: 'hello-world', workflowId: 'auto-learn-' + nanoid() });
    console.log(JSON.stringify(await handle.result(), null, 2));
    process.exit(0);
  }

  if (cmd === 'register-features') {
    const index = process.argv[3];
    const path = process.argv[4];
    const features: FeatureSpec[] = JSON.parse(await fs.promises.readFile(path, 'utf-8'));
    const handle = await client.start(registerFeatures, { args: [index, features], taskQueue: 'hello-world', workflowId: 'auto-reg-' + nanoid() });
    console.log(await handle.result());
    process.exit(0);
  }

  if (cmd === 'plan-sprint') {
    const path = process.argv[3];
    const goal = process.argv[4];
    const backlog: FeatureSpec[] = JSON.parse(await fs.promises.readFile(path, 'utf-8'));
    const handle = await client.start(planSprint, { args: [backlog, goal], taskQueue: 'hello-world', workflowId: 'auto-plan-' + nanoid() });
    console.log(JSON.stringify(await handle.result(), null, 2));
    process.exit(0);
  }

  if (cmd === 'discover-sources') {
    const base = process.argv[3] || '.';
    const handle = await client.start(discoverLocalSources, { args: [base], taskQueue: 'hello-world', workflowId: 'auto-discover-' + nanoid() });
    console.log(JSON.stringify(await handle.result(), null, 2));
    process.exit(0);
  }

  if (cmd === 'ingest-local') {
    const index = process.argv[3];
    const paths = process.argv.slice(4);
    if (!index || paths.length === 0) throw new Error('Usage: ingest-local <index> <path1> [path2 ...]');
    const handle = await client.start(ingestLocalKnowledge, { args: [index, paths], taskQueue: 'hello-world', workflowId: 'auto-ingest-local-' + nanoid() });
    console.log(await handle.result());
    process.exit(0);
  }

  if (cmd === 'ingest-latest') {
    const index = process.argv[3];
    const base = process.argv[4] || '.';
    const maxFiles = parseInt(process.argv[5] || '200', 10);
    if (!index) throw new Error('Usage: ingest-latest <index> [basePath] [maxFiles]');
    const handle = await client.start(ingestLatestLocal, { args: [index, base, maxFiles], taskQueue: 'hello-world', workflowId: 'auto-ingest-latest-' + nanoid() });
    console.log(await handle.result());
    process.exit(0);
  }

  if (cmd === 'propose-extensions') {
    const objective = process.argv.slice(3).length > 1 ? process.argv.slice(4).join(' ') : 'Increase value and maintainability';
    const firstPath = process.argv[3];
    const paths = process.argv.slice(3).filter(p => !p.startsWith('--'));
    if (!firstPath) throw new Error('Usage: propose-extensions <path1> [path2 ...] [objective]');
    const handle = await client.start(proposeRepoExtensions, { args: [paths, objective], taskQueue: 'hello-world', workflowId: 'auto-extensions-' + nanoid() });
    console.log(await handle.result());
    process.exit(0);
  }

  throw new Error(`Unknown command: ${cmd}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
