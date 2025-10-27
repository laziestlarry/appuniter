import { Connection, WorkflowClient } from '@temporalio/client';
import { nanoid } from 'nanoid';
import * as config from '../config';
import { nightlyIngestLoop, weeklyImprovementsLoop } from '../workflows';

async function run() {
  const connection = await Connection.connect({ address: config.TEMPORAL_HOST });
  const client = new WorkflowClient({ connection });

  const cmd = process.argv[2] || 'help';
  if (cmd === 'help' || cmd === '--help' || cmd === '-h') {
    console.log(
      'schedule.ts commands:\n' +
      '  start-nightly-ingest <knowledgeIndex> [basePath] [maxFiles] [intervalHours]\n' +
      '  start-weekly-improvements <knowledgeIndex> <objective> [plansIndex] [intervalHours]\n'
    );
    process.exit(0);
  }

  if (cmd === 'start-nightly-ingest') {
    const knowledgeIndex = process.argv[3];
    const basePath = process.argv[4] || '.';
    const maxFiles = parseInt(process.argv[5] || '300', 10);
    const intervalHours = parseInt(process.argv[6] || '24', 10);
    if (!knowledgeIndex) throw new Error('Usage: start-nightly-ingest <knowledgeIndex> [basePath] [maxFiles] [intervalHours]');
    const handle = await client.start(nightlyIngestLoop, {
      args: [{ knowledgeIndex, basePath, maxFiles, intervalHours }],
      taskQueue: 'hello-world',
      workflowId: 'sched-nightly-' + nanoid(),
      workflowRunTimeout: '365 days'
    });
    console.log(`Started: ${handle.workflowId}`);
    process.exit(0);
  }

  if (cmd === 'start-weekly-improvements') {
    const knowledgeIndex = process.argv[3];
    const objective = process.argv.slice(4)[0];
    const plansIndex = process.argv[5] || 'improvement_plans';
    const intervalHours = parseInt(process.argv[6] || '168', 10);
    if (!knowledgeIndex || !objective) throw new Error('Usage: start-weekly-improvements <knowledgeIndex> <objective> [plansIndex] [intervalHours]');
    const handle = await client.start(weeklyImprovementsLoop, {
      args: [{ knowledgeIndex, objective, plansIndex, intervalHours }],
      taskQueue: 'hello-world',
      workflowId: 'sched-weekly-' + nanoid(),
      workflowRunTimeout: '365 days'
    });
    console.log(`Started: ${handle.workflowId}`);
    process.exit(0);
  }

  throw new Error(`Unknown command: ${cmd}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

