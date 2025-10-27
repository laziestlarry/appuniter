# Cognosis AI Platform

## Summary

The Cognosis AI Platform contains an application server and all of the
infrastructure you need to build Large Language Model applications with,
batteries included!

##

[Join our Slack!](https://slack.com/get-started?sig=enQtNDczNzkwODAxODM4NC1iMzAzNTA4MmE1Zjk1NDQyMTk5ZmZhMjFiMzMyMzJjNGMxZGUyMDBjYjA4YjcxYjJjOTRmNjRlNmY4MzU2OTU0&invite_id=I04MPSQ0JBA&redir=%2Fshare%2FenQtNDczNzkwODAxODM4NC1iMzAzNTA4MmE1Zjk1NDQyMTk5ZmZhMjFiMzMyMzJjNGMxZGUyMDBjYjA4YjcxYjJjOTRmNjRlNmY4MzU2OTU0#/sharedinvite)

## Quickstart

Requirements:

  * Docker
  * Node 19
  * Elasticsearch/Temporal per Quickstart
  * Optional: set env vars in `.env` for knowledge source hints:
    - `GITHUB_REPOS` as JSON array or `GITHUB_REPOS_CSV` comma list
    - `DRIVE_FOLDERS` as JSON array or `DRIVE_FOLDERS_CSV` comma list

### Step 1: Get Infrastructure Running

```
# Clone the repo and cd into it
git clone git@github.com:cognosisai/platform.git
cd platform
  
# On Apple M1/M2 chips:
make build-apple
# On x86:
make build-x86
  
# Spin it all up! This runs docker-compose up, and will get you
# Elasticsearch 8.5, cognosis-embeddings service, and temporalite, which
# is a single Docker container version of Temporal meant for development
make run
```

### Step 2: Configure 
Edit .env, and populate it with the following information:

```
TEMPORAL_HOST="localhost:7233"
ELASTIC_CONFIG={"auth":{"username":"elastic","password":"changeme"},"node":"http://localhost:9200"}
OPENAI_TOKEN="<OpenAI Token>"
NLPCLOUD_TOKEN="<NLP Cloud Token>"
EMBEDDINGS_URL="http://localhost:9100"
```

### Step 3: Install NPM modules

```
npm install
```

## Step 4: Start Temporal Worker

```
ts-node src/worker.ts
```

This will take a few seconds. It will be ready when you see this:

```
2022-11-05T23:51:17.087Z [INFO] webpack 5.74.0 compiled successfully in 717 ms
2022-11-05T23:51:17.093Z [INFO] Workflow bundle created { size: '0.91MB' }
2022-11-05T23:51:17.141Z [INFO] Worker state changed { state: 'RUNNING' }
```

## Step 5: AI!

```
ts-node src/cli/cognosis.ts "Give me a really terrible idea involving an \
icepick, and bottle of elmer's wood glue"
Starting wfid workflow-fC-ONstofj4T4G9C_JQv5
  
Use the icepick to make a hole in the bottle of glue, then drink it.
```

### Business Orchestrator (Experimental)

Provides marketplace connector stubs (Shopify, Etsy, Amazon) and workflows to unify inventory, generate product copy, and ingest messages into Elasticsearch for retrieval.

- List connectors:
```
ts-node src/cli/business.ts list-connectors
```

- Unify inventory across connectors:
```
ts-node src/cli/business.ts sync-inventory shopify etsy amazon
```

- Generate marketing copy for a product JSON:
```
ts-node src/cli/business.ts gen-content ./product.json
```

- Ingest chat/messages as JSON array into index (requires Elasticsearch + embeddings service):
```
ts-node src/cli/business.ts ingest-messages business_messages ./messages.json
```

#### Commerce Ops

- Sync a single connector to ERP inventory index:
```
ts-node src/cli/business.ts sync-to-erp shopify erp_inventory
```

- Fetch connector orders and index to Elasticsearch:
```
ts-node src/cli/business.ts fetch-orders amazon orders 2025-01-01T00:00:00Z
```

- Publish a product JSON to selected connectors:
```
ts-node src/cli/business.ts publish-product ./product.json shopify etsy amazon
```

### Autonomy + Knowledge (Experimental)

Ingest cross-domain knowledge, search it with embeddings, and generate prioritized improvements and feature backlogs.

- Ingest knowledge documents (array of {text, title?, path?, tags?, source?}):
```
ts-node src/cli/autonomy.ts ingest-knowledge knowledge_index ./docs.json
```

- Semantic search across knowledge:
```
ts-node src/cli/autonomy.ts search-knowledge knowledge_index "optimize checkout conversion" 5
```

- Propose a prioritized improvement plan:
```
ts-node src/cli/autonomy.ts propose-improvements knowledge_index "Increase subscription revenue by 20%"
```

- Learn feature tasks from chat/messages and register to ES:
```
ts-node src/cli/autonomy.ts learn-tasks ./messages.json "Reduce support tickets"
ts-node src/cli/autonomy.ts register-features feature_backlog ./features.json
ts-node src/cli/autonomy.ts plan-sprint ./features.json "Checkout performance improvements"
```

- Discover local sources and ingest local folders:
```
ts-node src/cli/autonomy.ts discover-sources .
ts-node src/cli/autonomy.ts ingest-local knowledge_index . ./src ./docs
ts-node src/cli/autonomy.ts ingest-latest knowledge_index . 300
```

- Propose extension ideas from local repo(s):
```
ts-node src/cli/autonomy.ts propose-extensions . "Unify inventory with ERP and add KPI dashboards"
```

### Metrics (Experimental)

Compute simple business KPIs from Elasticsearch indices:

- Average Order Value:
```
// Use via workflows API or add a CLI if desired
```

- Conversion rate requires a sessions index and an orders index.

### Schedules (Experimental)

Start long-running workflows that loop on intervals:

```
ts-node src/cli/schedule.ts start-nightly-ingest knowledge_index . 300 24
ts-node src/cli/schedule.ts start-weekly-improvements knowledge_index "Increase revenue via content and UX" improvement_plans 168
```

### Application Server Components

#### Elastic Search
#### Temporal
#### Embeddings (Tensorflow - Google USE5)
#### Cognosis AI SDK

### Cognosis AI SDK

Cognosis AI Platform includes 
