AppUniter – AI Business Orchestrator (Genesis)

Summary
- Adds marketplace connectors (mock Shopify/Etsy/Amazon), inventory unification, product copy generation, message/knowledge ingestion, autonomy and planning workflows, commerce sync, metrics, and schedules.
- Provides CLIs under `src/cli` to operate the system via Temporal workflows.

Key Components
- Integrations: `src/integrations/**`
- Workflows: `src/workflows/{business,knowledge,autonomy,commerce,metrics,scheduler}.ts`
- Activities: `src/activities/{elastic,embeddings,files,connectors}.ts`
- CLIs: `src/cli/{business,autonomy,schedule}.ts`

Usage (quick)
- Worker: `ts-node src/worker.ts`
- Business: `ts-node src/cli/business.ts list-connectors`
- Knowledge ingest: `ts-node src/cli/autonomy.ts ingest-latest knowledge_index . 300`
- Schedules: `ts-node src/cli/schedule.ts start-nightly-ingest knowledge_index . 300 24`

Next Steps
- Wire live Shopify/Etsy/Amazon API activities (auth + rate limits)
- Add ERP (e.g., ES-backed or external) sync and reconciliation workflows
- Add metrics CLI and dashboards, plus Temporal schedules
- Harden prompts with schemas/validation and retry strategies

Notes
- Ensure `.env` is set (see README) and install dependencies before building.

