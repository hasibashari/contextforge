<div align="center">

# ContextForge

### AI-First Personal Context, Knowledge Graph & Autonomous Agentic Workspace

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20.x-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7%2B-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.x-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%2B%20%7C%20pgvector-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2D8?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-3.5_Flash-8E75B2?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)
[![MCP](https://img.shields.io/badge/Model_Context_Protocol-Ready-00A67E?style=flat-square)](https://modelcontextprotocol.io/)
[![Cloud Run](https://img.shields.io/badge/Google_Cloud_Run-Always_Free-4285F4?style=flat-square&logo=googlecloud&logoColor=white)](https://cloud.google.com/run)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/hasibashari/contextforge/pulls)
[![License](https://img.shields.io/badge/License-UNLICENSED-grey.svg?style=flat-square)](#license)

<p align="center">
  <a href="#-overview--5-core-pillars">Overview</a> •
  <a href="#-key-features">Key Features</a> •
  <a href="#-system-architecture">Architecture</a> •
  <a href="#-quickstart-guide">Quickstart</a> •
  <a href="#-model-context-protocol-mcp-connectors">MCP Connectors</a> •
  <a href="#-cloud-run-deployment">Cloud Run Deploy</a> •
  <a href="#-api--endpoints-reference">API Reference</a> •
  <a href="#-contributing">Contributing</a>
</p>

</div>

---

**ContextForge** is a fullstack, agentic AI-first workspace and developer control plane. It bridges raw large language model intelligence with your actual working context by integrating multi-source knowledge ingestion, autonomous multi-step reasoning, isolated ephemeral side-workers, and Model Context Protocol (MCP) bridges (Obsidian, Google Calendar, Notion, Android Ambient Telemetry, and Remote MCP servers) — all orchestrated with zero ORM overhead on PostgreSQL (`pgvector`) and Google Gemini.

> [!NOTE]
> Designed for developers, researchers, and knowledge workers who need AI agents grounded in their personal files, notes, schedules, and workflows without sacrificing execution safety or database performance.

---

## 📑 Table of Contents

- [🏛️ Overview & 5 Core Pillars](#️-overview--5-core-pillars)
- [✨ Key Features](#-key-features)
- [📐 System Architecture](#-system-architecture)
- [🛠️ Tech Stack](#️-tech-stack)
- [📂 Project Structure](#-project-structure)
- [📋 Prerequisites](#-prerequisites)
- [🚀 Quickstart Guide](#-quickstart-guide)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Environment Configuration](#2-environment-configuration)
  - [3. Start PostgreSQL with pgvector](#3-start-postgresql-with-pgvector)
  - [4. Install Dependencies & Launch](#4-install-dependencies--launch)
  - [5. Seed Demo & Test Data (Optional)](#5-seed-demo--test-data-optional)
- [⚙️ Environment Variables Reference](#️-environment-variables-reference)
- [📜 Available CLI Scripts](#-available-cli-scripts)
- [🌐 Model Context Protocol (MCP) Connectors](#-model-context-protocol-mcp-connectors)
- [☁️ Cloud Run Deployment (Always-Free Tier)](#️-cloud-run-deployment-always-free-tier)
- [🔌 API & Endpoints Reference](#-api--endpoints-reference)
- [🧪 Reproducible Testing](#-reproducible-testing)
- [❓ Troubleshooting & FAQ](#-troubleshooting--faq)
- [🗺️ Roadmap](#️-roadmap)
- [🤝 Contributing](#-contributing)
- [🔒 Security & Responsible AI](#-security--responsible-ai)
- [📄 License & Authors](#-license--authors)

---

## 🏛️ Overview & 5 Core Pillars

Traditional AI assistants operate inside stateless chat bubbles, isolated from your real-world filesystem, tools, notes, and schedules. ContextForge solves this by grounding AI execution on **5 Core Abstraction Pillars**:

```mermaid
graph TD
    subgraph Pillars ["ContextForge 5 Core Abstraction Pillars"]
        P1["<b>1. KNOWLEDGE</b><br/><i>'What does the AI know?'</i><br/>Document chunks · pgvector embeddings · Grounded RAG"]
        P2["<b>2. MCP (TOOLS)</b><br/><i>'What can the AI do?'</i><br/>Obsidian · Google Calendar · Notion · Android Bridge · Remote MCP"]
        P3["<b>3. SKILL (SOP)</b><br/><i>'How does the AI execute?'</i><br/>Playbooks · RFC Architect · AST Code Patching · Deep Research"]
        P4["<b>4. CONNECTION</b><br/><i>'Where does the AI connect?'</i><br/>Gemini API · Claude · OAuth 2.0 Tokens · PostgreSQL Pool"]
        P5["<b>5. AGENT</b><br/><i>'Who executes the task?'</i><br/>Read-Only Core Orchestrator · Ephemeral Mutating Side-Workers"]
    end
```

| Pillar             | Question Answered              | Description                                                              | Implementation in ContextForge                                                           |
| :----------------- | :----------------------------- | :----------------------------------------------------------------------- | :--------------------------------------------------------------------------------------- |
| **1. Knowledge**   | _"What does the AI know?"_     | Document chunks, semantic vector embeddings, and grounded RAG retrieval. | PostgreSQL `pgvector` with 1536-dimension embeddings (`gemini-embedding-2`).             |
| **2. MCP (Tools)** | _"What can the AI do?"_        | Functional tool bridges adhering to the Model Context Protocol.          | Native connectors for Obsidian, Google Calendar, Notion, Android Bridge, and remote MCP. |
| **3. Skill (SOP)** | _"How does the AI execute?"_   | Standard Operating Procedures and reasoning frameworks.                  | Built-in SOP playbooks (TDD workflow, note synthesis, AST patch verification).           |
| **4. Connection**  | _"Where does the AI connect?"_ | Provider credentials, OAuth 2.0 tokens, and database authentication.     | Unified credential vault with safe OAuth flow and native `pg.Pool` connection pooling.   |
| **5. Agent**       | _"Who executes the task?"_     | Read-only Core Orchestrator and isolated ephemeral Side-Workers.         | Gemini 3.5 Flash Orchestrator with sandboxed Side-Workers (Obsidian, Code, Calendar).    |

---

## ✨ Key Features

### 🤖 Agentic Reasoning & Ephemeral Side-Workers

- **Multi-Turn Strategic Planning**: Decomposes complex user requests into structured execution plans using Google Gemini (`gemini-3.5-flash` and `gemini-3.6-flash`).
- **Sandboxed Side-Workers**: Keeps the primary conversational agent read-only and safe while delegating mutating tasks (filesystem updates, code patching, calendar scheduling) to ephemeral side-workers with explicit user confirmation.

### 🧠 High-Performance Semantic RAG & Vector Knowledge Vault

- **Zero ORM Overhead**: Built on top of native `pg.Pool` connection pooling and direct parameterized SQL queries for low latency.
- **pgvector Cosine Search**: Generates 1536-dimensional embeddings (`gemini-embedding-2`) to perform semantic vector search across indexed markdown notes, PDFs, web sources, and documentation.

### 🔌 Model Context Protocol (MCP) Gateway

- **Obsidian Vault Bridge**: Read, search, create, and mutate Markdown notes with automatic `[[wiki-links]]` resolution and YAML frontmatter preservation.
- **Android Bridge**: Zero-file-scraping ambient telemetry (`UsageStatsManager`, `ZenMode / Bedtime Mode`, and `NotificationManager`) for focus session enforcement.
- **Google Calendar**: Real-time event mutation, conflict analysis, and automated task rebalancing.
- **Notion Integration**: Two-way database syncing and page creation via OAuth 2.0.
- **Remote MCP Support**: Connect to any external MCP server over STDIO, SSE, or Streamable HTTP.


### 🎯 Epistemic Goals & Living Wiki

- **Goal Mastery Roadmaps**: Track high-level technical goals, break them into actionable milestones, and track progress over time.
- **Self-Evolving Living Wiki**: Autonomous knowledge graph synthesis that aggregates learnings from daily chats and research.

### ⏱️ Autonomous Automations & Event-Driven Engine

- **CRON & Webhook Schedulers**: Trigger periodic research briefs, daily calendar reorganizations, and vault backups.
- **Decoupled Event Bus**: Built on NestJS `EventEmitter2` for asynchronous, resilient event dispatching.


---

## 📐 System Architecture

```mermaid
flowchart TB
    subgraph Client_Layer ["🖥️ Frontend Client (React 19 + Vite + Tailwind CSS 4)"]
        UI_Chat["💬 Conversational Canvas\nStreaming Timeline & Multi-Modal"]
        UI_Control["⚙️ Control Plane\nAgents / Knowledge / Goals / Automations"]
    end

    subgraph Transport_Layer ["🛡️ Transport & Security Layer (NestJS 11)"]
        Guard["Auth & Workspace Guard"]
        Pipes["Validation Pipes (Zod & Class-Validator)"]
        SSE["SSE / WebSocket Real-time Stream"]
        REST["REST API Controllers (/api)"]
        EventBus["NestJS EventEmitter2 Engine"]
    end

    subgraph Agentic_Core ["🤖 Agentic Core (Gemini 3.5 Reasoning Engine)"]
        Orchestrator["Core Orchestrator\n(Planning & Read-Only Safe Reasoning)"]
        SkillEngine["Skill SOP Selector & Playbooks"]

        subgraph Side_Workers ["Ephemeral Execution Workers"]
            ObsidianWorker["Obsidian Vault Worker"]
            CodeWorker["CLI & Code Runner"]
            CalendarWorker["Calendar Rebalancing Worker"]
            AndroidWorker["Android Bridge Worker"]
        end
    end

    subgraph MCP_Gateway ["🔌 Model Context Protocol (MCP) Gateway"]
        MCP_Obsidian["Obsidian Vault Tool"]
        MCP_GCal["Google Calendar Tool"]
        MCP_Notion["Notion OAuth Tool"]
        MCP_Android["Android Bridge Telemetry & Focus"]
        MCP_Remote["Remote MCP (STDIO / SSE / HTTP)"]
    end

    subgraph Storage_Layer ["🗄️ Storage & Vector Engine (PostgreSQL 16+)"]
        DB_Relational[("Relational Tables\nSessions, Goals, Wiki, Activity")]
        DB_Vectors[("pgvector Embeddings\ngemini-embedding-2 (1536 dim)")]
    end

    Client_Layer -->|REST / SSE / WS| Transport_Layer
    Transport_Layer --> Agentic_Core
    Agentic_Core --> SkillEngine
    Agentic_Core --> Side_Workers
    Side_Workers --> MCP_Gateway
    Transport_Layer --> Storage_Layer
    Agentic_Core --> Storage_Layer
    MCP_Gateway --> Storage_Layer
```

---

## 🛠️ Tech Stack

### Backend API & Agentic Engine

| Technology                                                           | Version               | Purpose                                                   |
| :------------------------------------------------------------------- | :-------------------- | :-------------------------------------------------------- |
| **[NestJS](https://nestjs.com/)**                                    | `11.x`                | Enterprise modular Node.js backend framework              |
| **[TypeScript](https://www.typescriptlang.org/)**                    | `5.7+`                | Strict type safety and compilation                        |
| **[Google GenAI SDK](https://ai.google.dev/)**                       | `@google/genai 2.17+` | Gemini 3.5 Flash reasoning & embedding generation         |
| **[PostgreSQL](https://www.postgresql.org/)**                        | `16+`                 | Primary relational & vector database                      |
| **[`pg`](https://node-postgres.com/)**                               | `8.23+`               | High-performance native SQL connection pooling (zero ORM) |
| **[`pgvector`](https://github.com/pgvector/pgvector)**               | `0.7+`                | Vector similarity indexing and cosine distance search     |
| **[NestJS EventEmitter](https://docs.nestjs.com/techniques/events)** | `3.1+`                | Asynchronous decoupled domain event dispatching           |
| **[WebSocket (`ws`)](https://github.com/websockets/ws)**             | `8.18+`               | Bidirectional telemetry and ambient device streaming      |

### Frontend UI & Client

| Technology                                                       | Version | Purpose                                        |
| :--------------------------------------------------------------- | :------ | :--------------------------------------------- |
| **[React](https://react.dev/)**                                  | `19.x`  | Modern reactive UI library                     |
| **[Vite](https://vitejs.dev/)**                                  | `8.x`   | High-speed frontend bundler & dev server       |
| **[Tailwind CSS](https://tailwindcss.com/)**                     | `4.x`   | Modern styling engine with zero build overhead |
| **[React Router](https://reactrouter.com/)**                     | `v7`    | Client-side routing and nested layouts         |
| **[Motion](https://motion.dev/)**                                | `13.x`  | Fluid micro-interactions and animations        |
| **[Lucide React](https://lucide.dev/)**                          | `1.31+` | Clean, modern iconography                      |
| **[React Markdown](https://github.com/remarkjs/react-markdown)** | `10.x`  | Markdown, table, and GFM diff rendering        |

### Deployment & Infrastructure

| Technology                                               | Spec / Tier        | Purpose                                           |
| :------------------------------------------------------- | :----------------- | :------------------------------------------------ |
| **[Google Cloud Run](https://cloud.google.com/run)**     | `Always Free`      | Serverless fullstack single-container runtime     |
| **[Docker](https://www.docker.com/)**                    | `Multi-Stage`      | Minimal Node 20 Alpine production image (~130 MB) |
| **[Google Cloud Build](https://cloud.google.com/build)** | `120 free min/day` | Zero-local-dependency container builder           |

---

## 📂 Project Structure

```text
contextforge/
├── backend/                        # NestJS API Engine (Port 3001)
│   ├── database/                   # SQL schemas, migrations & seeds
│   │   ├── schema.sql              # Master DDL schema (relational + pgvector)
│   │   └── seed.sql                # Initial seed data for agents & memories
│   ├── src/
│   │   ├── agentic-core/           # Gemini client, Orchestrator & tool calling
│   │   ├── common/                 # Database pool, auth guards, interceptors
│   │   ├── config/                 # App, database, and model configurations
│   │   ├── mcp/                    # Model Context Protocol engine & connectors
│   │   │   ├── connectors/         # Android Bridge, Obsidian, GCal, Notion, Generic
│   │   │   ├── controllers/        # MCP OAuth & discovery controllers
│   │   │   └── core/               # MCP Protocol clients & registry
│   │   ├── modules/                # Domain-driven feature modules
│   │   │   ├── activity/           # Audit trail & telemetry logging

│   │   │   ├── automation/         # Workflow automation & run scheduler
│   │   │   ├── chat/               # Chat sessions, SSE streams & messages
│   │   │   ├── ecosystem/          # Integrations & workspace agent management
│   │   │   ├── goals/              # Epistemic goals & mastery tracking
│   │   │   ├── knowledge/          # Ingestion pipelines & semantic vector search
│   │   │   ├── personal-hub/       # User memories & adaptive preferences
│   │   │   └── wiki/               # Self-evolving knowledge wiki
│   │   ├── main.ts                 # Application entry point
│   │   └── app.module.ts           # Root module configuration
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                       # React 19 + Vite Client (Port 5173)
│   ├── src/
│   │   ├── features/               # Feature-based presentation modules
│   │   │   ├── agents/             # Agent management & delegation UI
│   │   │   ├── automation/         # Automation builder & run triggers
│   │   │   ├── chat/               # Conversational UI & live streaming
│   │   │   ├── goals/              # Epistemic goal roadmap UI
│   │   │   ├── home/               # Dashboard & landing view
│   │   │   ├── integrations/       # MCP tool & OAuth connection manager
│   │   │   ├── knowledge/          # Knowledge base ingestion & vector search
│   │   │   └── settings/           # User configuration & preferences
│   │   ├── shared/                 # Shared UI components, hooks & state
│   │   ├── App.tsx                 # Main layout & router outlet
│   │   └── main.tsx                # Frontend entry point
│   ├── package.json
│   └── vite.config.ts
│
├── docs/                           # Architectural Documentation
│   ├── ERD.md                      # Complete Entity Relationship Diagram & DB schema
│   ├── TDD.md                      # Technical Design Document (RFC standard)
│   ├── llm-wiki.md                 # Knowledge & agentic reasoning architecture
│   ├── mcp/                        # MCP connector specs (Android Bridge, GCal)
│   └── SKILL/                      # Built-in SOP playbooks
│
├── scripts/                        # Operational Scripts
│   ├── gcp-free-tier-audit.sh      # GCP Always-Free Tier guardrail auditor
│   └── gcs-lifecycle.json          # GCS staging bucket auto-cleanup lifecycle
│
├── docker-compose.yml              # Local PostgreSQL 16 + pgvector container
├── Dockerfile                      # Production fullstack multi-stage Dockerfile
├── deploy-cloudrun.sh              # 1-Click Google Cloud Run deployment script
└── README.md                       # Master documentation
```

---

## 📋 Prerequisites

Before getting started, ensure you have the following installed:

- **Node.js**: `v20.x` or higher ([Download Node.js](https://nodejs.org/))
- **npm**: `v10.x` or higher (bundled with Node.js)
- **Docker & Docker Compose**: Recommended for local PostgreSQL + `pgvector`
- **Google Gemini API Key**: Free tier available from [Google AI Studio](https://aistudio.google.com/)
- _(Optional)_ **Google Cloud SDK (`gcloud`)**: Required for Cloud Run deployment
- _(Optional)_ **Notion / Google Calendar Credentials**: For OAuth 2.0 MCP integrations

---

## 🚀 Quickstart Guide

Follow these simple steps to get ContextForge running locally in under 2 minutes:

### 1. Clone Repository

```bash
git clone https://github.com/hasibashari/contextforge.git
cd contextforge
```

### 2. Environment Configuration

Copy the sample environment file to create your backend configuration:

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` in your editor and enter your **Google Gemini API Key**:

```env
# Server Configuration
PORT=3001

# PostgreSQL Connection (matches docker-compose.yml defaults)
DATABASE_URL="postgresql://dev_user:password123@localhost:5432/context_db?schema=public"

# Google Gemini API
GEMINI_API="AIzaSyYourGeminiApiKeyHere"
GEMINI_DEFAULT_MODEL="gemini-3.5-flash-lite"
GEMINI_EMBEDDING_MODEL="gemini-embedding-2"
GEMINI_EMBEDDING_DIMENSION="1536"

# Timezone Context
DEFAULT_TIMEZONE="Asia/Jakarta"
```

### 3. Start PostgreSQL with pgvector

#### Option A: Docker Compose (Recommended)

Start the pre-configured PostgreSQL 16 container with `pgvector` enabled and SQL schema/seed automatically mounted:

```bash
docker compose up -d
```

Verify that the database container is healthy:

```bash
docker compose ps
```

#### Option B: Native PostgreSQL Setup

If you prefer running a native PostgreSQL 16+ instance:

```bash
# 1. Create database
createdb -U dev_user context_db

# 2. Enable required extensions
psql -U dev_user -d context_db -c "CREATE EXTENSION IF NOT EXISTS vector;"
psql -U dev_user -d context_db -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
psql -U dev_user -d context_db -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"

# 3. Apply schema migrations
psql -U dev_user -d context_db -f backend/database/schema.sql
psql -U dev_user -d context_db -f backend/database/seed.sql
```

### 4. Install Dependencies & Launch

Open two terminal windows to run both servers concurrently:

#### Terminal 1: Backend Server (NestJS)

```bash
cd backend
npm install
npm run dev
```

> 🚀 **Backend API running at:** `http://localhost:3001`

#### Terminal 2: Frontend Client (Vite + React 19)

```bash
cd frontend
npm install
npm run dev
```

> ➜ **Frontend UI running at:** `http://localhost:5173`

Open your browser and navigate to **[http://localhost:5173](http://localhost:5173)**.

> [!TIP]
> The Vite development server automatically proxies all `/api` requests to `http://localhost:3001`, ensuring seamless CORS-free communication during local development.

### 5. Seed Demo & Test Data (Optional)

To re-run or refresh the database seeds at any time:

```bash
cd backend
npm run seed
```

---

## ⚙️ Environment Variables Reference

| Variable                     | Type     | Required | Default / Example                                                    | Description                                                   |
| :--------------------------- | :------- | :------: | :------------------------------------------------------------------- | :------------------------------------------------------------ |
| `PORT`                       | `number` |    No    | `3001` (Dev) / `8080` (Cloud Run)                                    | HTTP listening port for the NestJS server.                    |
| `DATABASE_URL`               | `string` | **Yes**  | `postgresql://dev_user:password123@localhost:5432/context_db`        | PostgreSQL connection URI with `pgvector` enabled.            |
| `GEMINI_API`                 | `string` | **Yes**  | `AIzaSy...`                                                          | API key from Google AI Studio.                                |
| `GEMINI_DEFAULT_MODEL`       | `string` |    No    | `gemini-3.5-flash-lite`                                              | Primary LLM model for planning & reasoning.                   |
| `GEMINI_EMBEDDING_MODEL`     | `string` |    No    | `gemini-embedding-2`                                                 | Embedding model for semantic vector indexing.                 |
| `GEMINI_EMBEDDING_DIMENSION` | `number` |    No    | `1536`                                                               | Embedding vector dimensions.                                  |
| `DEFAULT_TIMEZONE`           | `string` |    No    | `Asia/Jakarta`                                                       | Timezone context used for scheduling and calendar operations. |
| `NOTION_CLIENT_ID`           | `string` |    No    | `your-notion-client-id`                                              | Notion OAuth 2.0 client ID.                                   |
| `NOTION_CLIENT_SECRET`       | `string` |    No    | `your-notion-client-secret`                                          | Notion OAuth 2.0 client secret.                               |
| `NOTION_REDIRECT_URI`        | `string` |    No    | `http://localhost:3001/api/ecosystem/oauth/notion/callback`          | Notion OAuth redirect callback endpoint.                      |
| `GOOGLE_CLIENT_ID`           | `string` |    No    | `your-google-client-id`                                              | Google Calendar OAuth 2.0 client ID.                          |
| `GOOGLE_CLIENT_SECRET`       | `string` |    No    | `your-google-client-secret`                                          | Google Calendar OAuth 2.0 client secret.                      |
| `GOOGLE_REDIRECT_URI`        | `string` |    No    | `http://localhost:3001/api/ecosystem/oauth/google-calendar/callback` | Google Calendar OAuth redirect callback endpoint.             |

---

## 📜 Available CLI Scripts

### Backend Scripts (`/backend`)

| Command              | Description                                                                   |
| :------------------- | :---------------------------------------------------------------------------- |
| `npm run dev`        | Starts NestJS development server with watch mode (hot reload) on port `3001`. |
| `npm run build`      | Compiles TypeScript into production bundle in `dist/`.                        |
| `npm run start:prod` | Runs the compiled production server (`node dist/main.js`).                    |
| `npm run seed`       | Executes database seed runners using `ts-node`.                               |
| `npm run test`       | Runs the automated backend test suite.                                        |
| `npm run lint`       | Runs ESLint and automatically fixes formatting issues.                        |
| `npm run format`     | Formats all source files using Prettier.                                      |

### Frontend Scripts (`/frontend`)

| Command           | Description                                                                    |
| :---------------- | :----------------------------------------------------------------------------- |
| `npm run dev`     | Starts Vite dev server with Hot Module Replacement on port `5173`.             |
| `npm run build`   | Type-checks with TypeScript and creates optimized production build in `dist/`. |
| `npm run preview` | Locally previews the production build.                                         |
| `npm run lint`    | Runs ESLint over React components and hooks.                                   |

### Operational Scripts (`/`)

| Command                            | Description                                                                        |
| :--------------------------------- | :--------------------------------------------------------------------------------- |
| `./deploy-cloudrun.sh`             | Interactive 1-click deployment script to Google Cloud Run (Always Free compliant). |
| `./scripts/gcp-free-tier-audit.sh` | Audits Cloud Run specs, GCS bucket lifecycles, and Artifact Registry sizes.        |

---

## 🌐 Model Context Protocol (MCP) Connectors

ContextForge provides native implementations of open **Model Context Protocol (MCP)** tool connectors:

```mermaid
graph LR
    subgraph ContextForge ["ContextForge Nexus"]
        Gateway["MCP Gateway Service"]
        Agent["Gemini 3.5 Orchestrator"]
    end

    subgraph Connectors ["Active MCP Connectors"]
        Obsidian["📝 Obsidian Vault Bridge<br/>(Local Filesystem, [[wiki-links]], YAML)"]
        GCal["📅 Google Calendar Connector<br/>(Event Sync, Conflict Rebalancing)"]
        Notion["📓 Notion Connector<br/>(Database Ingestion & Two-Way Sync)"]
        Android["📱 Android Bridge Connector<br/>(Ambient Telemetry & Focus Mode)"]
        Generic["🔌 Remote MCP Client<br/>(STDIO / SSE / Streamable HTTP)"]
    end

    Agent <--> Gateway
    Gateway <--> Obsidian
    Gateway <--> GCal
    Gateway <--> Notion
    Gateway <--> Android
    Gateway <--> Generic
```

### Connector Specifications

1. **Obsidian Vault Bridge (`int-obsidian-vault-mcp`)**
   - Direct local filesystem access to Markdown vaults.
   - Automatic extraction and bidirectional traversal of `[[wiki-links]]`.
   - Structured YAML frontmatter parsing (`tags`, `created`, `aliases`).

2. **Android Bridge (`int-android-bridge-mcp`)**
   - Ambient telemetry ingestion via zero-file-scraping APIs: `UsageStatsManager`, `ZenMode / Bedtime Mode`, and `NotificationManager`.
   - Dynamic focus enforcer and notification filtering based on active deep-work goals.

3. **Google Calendar (`int-google-calendar-mcp`)**
   - Real-time OAuth 2.0 integration for agenda queries, event mutations, and schedule conflict resolution.

4. **Notion Workspace (`int-notion-mcp`)**
   - Ingestion of Notion databases and document trees into the semantic vector vault.

5. **Remote MCP Connector**
   - Supports external MCP tools via standard STDIO pipes, Server-Sent Events (SSE), or streamable HTTP endpoints.

---

## ☁️ Cloud Run Deployment (Always-Free Tier)

ContextForge includes a production-ready single-container Docker setup optimized for **Google Cloud Run's Always-Free Tier**:

> [!IMPORTANT]
> **Always-Free Tier Specs:**
>
> - 2 million requests per month (Free)
> - 360,000 vCPU-seconds and 180,000 GiB-seconds of memory (Free)
> - Scale-to-zero (`min-instances=0`) minimizes idle infrastructure costs
> - Region: `us-central1` (includes 1GB/month free internet egress)

### 1-Click Deployment

Make the deployment script executable and run:

```bash
chmod +x deploy-cloudrun.sh
./deploy-cloudrun.sh
```

The script will automatically:

1. Verify Google Cloud SDK (`gcloud`) authentication.
2. Enable required Cloud Run, Artifact Registry, and Cloud Build APIs.
3. Enforce 1-day auto-delete lifecycles on temporary Cloud Storage staging buckets.
4. Deploy the single fullstack container (React SPA served directly from NestJS).

### Verify Free-Tier Compliance

Run the audit scanner to confirm that no unexpected charges will be incurred:

```bash
chmod +x scripts/gcp-free-tier-audit.sh
./scripts/gcp-free-tier-audit.sh
```

---

## 🔌 API & Endpoints Reference

The backend exposes a modular REST and streaming API prefixed with `/api`:

| Route Prefix        | Module       |         Method          | Description                                                                   |
| :------------------ | :----------- | :---------------------: | :---------------------------------------------------------------------------- |
| `/api/chat`         | Chat         |  `GET`, `POST`, `SSE`   | Manage conversation sessions, message history, and real-time token streaming. |

| `/api/knowledge`    | Knowledge    | `GET`, `POST`, `DELETE` | Ingest data sources, trigger vector chunking, and run similarity search.      |
| `/api/goals`        | Goals        | `GET`, `POST`, `PATCH`  | Manage epistemic goals, milestones, and mastery roadmaps.                     |
| `/api/wiki`         | Living Wiki  |      `GET`, `POST`      | Query and synthesize self-evolving wiki knowledge entries.                    |
| `/api/ecosystem`    | Ecosystem    |      `GET`, `POST`      | Manage workspace agents, custom tools, and connection status.                 |
| `/api/automation`   | Automation   | `GET`, `POST`, `PATCH`  | Configure CRON schedules, webhooks, and automation runs.                      |
| `/api/personal-hub` | Personal Hub | `GET`, `POST`, `DELETE` | Long-term memory facts, persona customization, and preferences.               |
| `/api/activity`     | Activity     |          `GET`          | Audit trail and system execution telemetry.                                   |
| `/api/mcp/oauth/*`  | MCP OAuth    |          `GET`          | OAuth 2.0 callback endpoints for Notion and Google Calendar.                  |

For full database table definitions and architectural RFCs, refer to [`docs/ERD.md`](./docs/ERD.md) and [`docs/TDD.md`](./docs/TDD.md).

---

## 🧪 Reproducible Testing

ContextForge ships with **8 focused test suites** covering the full agentic core pipeline — from MCP connector schemas to the closed-loop goal evaluation engine. All tests run without external API calls or a live database, making them fully reproducible offline.

### Prerequisites

Ensure the backend dependencies are installed before running tests:

```bash
cd backend
npm install
```

> **No `.env` file required.** All test suites use in-memory mocks and isolated service instances — no live PostgreSQL, Gemini API key, or OAuth tokens needed.

---

### Run All Test Suites

```bash
cd backend
npm run test
```

#### Expected Output

```
🧪 Starting Automation & Background Scheduler Test Suite...

  ✅ PASS: 1. AutomationScheduler matches standard daily cron (0 8 * * *)
  ✅ PASS: 2. AutomationScheduler matches step cron (*/15 * * * *)
  ✅ PASS: 3. AutomationScheduler matches weekday ranges (0 9 * * 1-5)
  ✅ PASS: 4. AutomationScheduler reports accurate live health and status
  ✅ PASS: 5. AutomationToolHandler registers automation and returns actionCard

📊 Automation Test Results: 5 passed, 0 failed.


🧪 Starting Goal-Oriented AI & Verification Test Suite...

  ✅ PASS: 1. GoalToolHandler create_goal registers goal and returns actionCard
  ✅ PASS: 2. GoalToolHandler list_goals formats active goals with streak and progress
  ✅ PASS: 3. GoalToolHandler decompose_goal_into_tasks creates concrete schedule blocks
  ✅ PASS: 4. GoalToolHandler verify_task_completion checks evidence gatekeeper
  ✅ PASS: 5. GoalToolHandler record_goal_evaluation records daily reflection score and insights

📊 Goal-Oriented AI Test Results: 5 passed, 0 failed.

✨ All test suites completed successfully!
```

---

### What Each Test Suite Covers

| Test Suite                | File                          | What It Verifies                                                                                                                          |
| :------------------------ | :---------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| **Automation Engine**     | `automation-engine.spec.ts`   | Background CRON scheduler parsing, lifecycle management, and `AutomationToolHandler` Action Card generation                               |
| **Goal-Oriented AI**      | `goals-engine.spec.ts`        | Full goal lifecycle: `create_goal` → `decompose_goal_into_tasks` → `verify_task_completion` → `record_goal_evaluation`                    |
| **MCP Registry**          | `mcp-registry.spec.ts`        | Core `McpRegistryService` plugin registration, tool discovery, and connector lifecycle                                                    |
| **Google Calendar MCP**   | `google-calendar-mcp.spec.ts` | Calendar parser engine (free slot calculation, event formatting, time range validation) and Gemini tool schema compliance                 |
| **Android Bridge MCP**    | `android-bridge-mcp.spec.ts`  | `UsageStatsManager` telemetry formatters, package name validation, and MCP tool schema registration                                       |
| **Notion & Obsidian MCP** | `notion-obsidian-mcp.spec.ts` | `[[wiki-link]]` traversal, YAML frontmatter parsing, and Notion connector tool schema                                                     |
| **Agent Enhancements**    | `agent-enhancements.spec.ts`  | Sub-agent registry (Wellbeing, Second Brain, Executive Scheduler, Research Specialist), history compactor, and proactive guardian service |
| **Personal Memory**       | `personal-memory.spec.ts`     | User memory ingestion, retrieval filtering, and `PersonalHubService` with mocked repository                                               |

### Code Formatting & Linting

```bash
# Format and lint backend
cd backend
npm run format
npm run lint

# Lint frontend
cd ../frontend
npm run lint
```

## ❓ Troubleshooting & FAQ

<details>
<summary><b>1. Error: extension "vector" is not available</b></summary>

**Cause:** Your PostgreSQL server does not have the `pgvector` extension installed.  
**Resolution:**

- **Docker (Recommended):** Run `docker compose up -d` which uses the official `pgvector/pgvector:pg16` image.
- **Native PostgreSQL:** Follow the official [pgvector installation guide](https://github.com/pgvector/pgvector#installation) to compile and install the extension on your machine.
</details>

<details>
<summary><b>2. Google Gemini API 403 / Quota Exceeded</b></summary>

**Cause:** The provided `GEMINI_API` key is invalid, inactive, or quota-limited.  
**Resolution:**

- Verify your API key on [Google AI Studio](https://aistudio.google.com/).
- Confirm that `GEMINI_DEFAULT_MODEL` is set to `gemini-3.5-flash-lite` or `gemini-3.6-flash` in your `backend/.env`.
</details>

<details>
<summary><b>3. Port 3001 or 5173 is already in use</b></summary>

**Cause:** A lingering Node.js process is occupying the required ports.  
**Resolution:**

```bash
# Find and terminate processes
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

</details>

<details>
<summary><b>4. Database Connection Refused (ECONNREFUSED 127.0.0.1:5432)</b></summary>

**Cause:** PostgreSQL container is stopped or still starting.  
**Resolution:**

```bash
docker compose up -d
docker compose logs -f postgres
```

</details>

---

## 🗺️ Roadmap

- [x] Agentic Core with Google Gemini 3.5 Flash & tool calling
- [x] Zero-ORM PostgreSQL Native SQL pool architecture
- [x] High-performance `pgvector` hybrid semantic search RAG (1536 dim)
- [x] Model Context Protocol (MCP) Gateway (Obsidian, Calendar, Notion, Android Bridge)
- [x] Living Wiki & Epistemic Goals tracking
- [x] 1-Click Google Cloud Run (Always Free Tier) deployment
- [ ] Gemini Live API integration for real-time bidirectional voice interactions
- [ ] Multi-tenant collaborative team workspaces
- [ ] Direct IDE extension (VS Code / JetBrains MCP bridge)

---

## 🤝 Contributing

Contributions are what make the open-source community an inspiring place to learn, build, and innovate. Any contributions you make are **greatly appreciated**!

### Contribution Workflow

1. **Fork the Project**
2. **Create your Feature Branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your Changes** following [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat(knowledge): add batch PDF vector ingestion support"
   ```
4. **Push to the Branch**:
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request** against `main`.

---

## 🔒 Security & Responsible AI

- **No Secret Scraping**: Telemetry and MCP tools only access explicitly approved APIs or directories.
- **Human-In-The-Loop (HITL)**: All file mutations, calendar updates, and external API actions require interactive confirmation cards before execution.
- **Environment Isolation**: Ephemeral side-workers operate within sandboxed scopes.
- If you discover a security vulnerability, please report it privately via GitHub Security Advisories.

---

## 📄 License & Authors

This project is licensed under the terms described in the repository.

<div align="center">

**ContextForge** • Crafted with ❤️ for AI-Powered Context & Personal Knowledge Management.

</div>
