# Technical Design Document (TDD): ContextForge Backend

> **Document Version:** 2.1.0  
> **Status:** Approved Architectural Blueprint  
> **Author:** Principal Backend Architect  
> **Target Framework:** NestJS 11+ · TypeScript 5.7+ · Google GenAI / ADK · Gemini 3.x Flash  
> **Target Database:** PostgreSQL 16+ with `pgvector` (Local Docker ➔ Google Cloud SQL)  
> **Data Access Pattern:** Native SQL via `pg.Pool` (Zero ORM Overhead, Multi-Environment Resilient)

---

## 1. Ringkasan Eksekutif & 5 Pilar Abstraksi Sistem

**ContextForge** adalah *AI-First Conversational Agentic Workspace* & *Developer Control Plane* modern yang dirancang untuk mengorkestrasi agen kecerdasan buatan, mengintegrasikan multi-sumber pengetahuan (Knowledge Ingestion), mengeksekusi *Side Agents* terisolasi, mengoperasikan automasi alur kerja mandiri (*Autonomous Workflows*), dan menyediakan antarmuka kerja berdesain editorial yang presisi dan elegan.

Arsitektur ContextForge dibangun secara ketat di atas **5 Pilar Abstraksi Inti**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   5 PILAR ABSTRAKSI INTI CONTEXTFORGE                      │
├───────────────────┬─────────────────────────────────────────────────────────┤
│ 1. KNOWLEDGE      │ "Apa yang AI tahu?"                                     │
│                   │ Vector embeddings, dokumen terindeks, chunking RAG      │
├───────────────────┼─────────────────────────────────────────────────────────┤
│ 2. MCP (TOOLS)    │ "Apa yang AI bisa lakukan?"                             │
│                   │ Model Context Protocol tools (Obsidian, Git, Calendar)  │
├───────────────────┼─────────────────────────────────────────────────────────┤
│ 3. SKILL (SOP)    │ "Bagaimana AI menyelesaikan pekerjaan?"                 │
│                   │ Prosedur Operasional Standar (TDD Flow, Note Synthesis) │
├───────────────────┼─────────────────────────────────────────────────────────┤
│ 4. CONNECTION     │ "AI terhubung ke mana?"                                 │
│                   │ Kredensial LLM Provider (Gemini/Claude), OAuth, DB auth │
├───────────────────┼─────────────────────────────────────────────────────────┤
│ 5. AGENT          │ "Siapa yang mengeksekusi?"                              │
│                   │ Core Orchestrator (Read-Only) & Ephemeral Side Workers  │
└───────────────────┴─────────────────────────────────────────────────────────┘
```

### Keputusan Arsitektur: Eliminasi Abstraksi "Plugin" (Anti-Bloat & YAGNI)
Pada versi awal arsitektur, terdapat layer *Plugin* yang membungkus kumpulan *connector* dan *skill*. Setelah evaluasi teknis dan pertimbangan UX:
* **Redundan:** Plugin di level ini hanya bertindak sebagai *static bundle* tanpa ekstensi runtime nyata.
* **Beban Kognitif:** Membingungkan pengguna dengan pilihan yang tumpang-tindih (*"Aktifkan Connector, Aktifkan Skill, atau Install Plugin?"*).
* **Solusi Bersih:** Layer *Plugin* dihapus sepenuhnya. Sistem menerapkan **komposisi modular murni**: Pengguna cukup mengelola **MCP Tools** dan **Skills SOP** secara transparan.

### Reposisi Arsitektur Obsidian Vault:
Obsidian diatur secara terstruktur dan tidak lagi tersebar secara rancu:
1. **MCP Tool Bridge (`int-obsidian-vault-mcp`):** Bertanggung jawab atas protokol interaksi fungsional (baca, tulis, dan cari file di disk lokal vault).
2. **Skill SOP (`skill-obsidian-vault-synthesis`):** Panduan reasoning untuk AI mengenai format YAML frontmatter, standard backlink `[[wiki-links]]`, dan struktur direktori.
3. **Knowledge Ingestion Target:** Dokumen Markdown di dalam Obsidian yang telah dibaca dapat diindeks ke dalam PostgreSQL `pgvector` sebagai *Grounding Knowledge*.
4. **Side Agent Execution Worker:** `Obsidian Vault Worker` adalah instance ephemeral yang memanggil MCP Tool Obsidian saat mutasi fisik disetujui.

---

## 2. Diagram Arsitektur Tingkat Tinggi (High-Level Architecture)

```mermaid
flowchart TB
    subgraph Client_Layer [Frontend Layer - React 19 + Vite]
        UI_Chat[Conversational Canvas\nMulti-Modal Input / Timeline]
        UI_Aside[Context Aside Panel\nArtifacts / Schedule / Memory]
        UI_Control[Control Plane Views\nAgents / Knowledge / MCP Tools / Automations]
    end

    subgraph Transport_Layer [NestJS Transport & Security Layer]
        CORS[CORS & Security Headers]
        Auth[Auth & Workspace Context Guard]
        Validation[Zod & Class-Validator Pipes]
        SSE_Stream[SSE Event Stream Controller]
        REST_Ctrl[REST API Controllers]
        EventBus[NestJS EventEmitter2 Engine]
    end

    subgraph Automation_Layer [Autonomous Workflow & Scheduler Layer]
        CronScheduler[Automation Scheduler Service\nCRON / Webhook Triggers]
        AutoRunner[Autonomous Runner Engine\nGuardrail & HITL Gatekeeper]
    end

    subgraph Agentic_Core_Layer [Google ADK & Gemini Reasoning Engine]
        CoreOrchestrator[Core Orchestrator Agent\nGemini 3.x Flash / Read-Only]
        SkillSelector[Skill SOP Selector & Engine]
        
        subgraph Side_Agents_Pool [Ephemeral Execution Workers]
            ObsidianWorker[Obsidian Vault Worker]
            CodeWorker[CLI & Code Sandbox Runner]
            CalendarWorker[Calendar & Workflow Worker]
            VisualWorker[Visual & GPU Asset Generator]
        end
    end

    subgraph Tooling_MCP_Layer [2. MCP Tools Registry & Protocol Clients]
        Tool_Search[Live Web Search Tool]
        Tool_RAG[pgvector Hybrid Retriever]
        Tool_Git[GitHub API & AST Parser]
        Tool_Obsidian[Obsidian Vault Bridge Tool\nRead / Write / Search]
        Tool_Calendar[Google Calendar API Mutator]
        Tool_MCP_Remote[Remote MCP Client: STDIO / SSE / Streamable HTTP]
    end

    subgraph Connection_Layer [4. Connections & Credential Vault]
        Conn_LLM[LLM Providers: Gemini, Claude, OpenAI]
        Conn_OAuth[OAuth Tokens: GitHub, Google Calendar]
        Conn_DB[Database Connection Strings]
        Conn_RemoteMCP[Remote MCP Endpoints Config]
    end

    subgraph Persistence_Layer [1. Knowledge & Data Persistence Layer]
        DatabaseService[DatabaseService: pg.Pool Client]
        Postgres[(PostgreSQL 16 + pgvector)]
        LocalVaults[(Local Obsidian Vault & Sandboxes)]
    end

    UI_Chat <-->|HTTP POST + SSE Stream| Transport_Layer
    UI_Aside <-->|HTTP RESTful CRUD| Transport_Layer
    UI_Control <-->|HTTP RESTful CRUD| Transport_Layer

    Transport_Layer --> Agentic_Core_Layer
    Transport_Layer --> Automation_Layer
    Automation_Layer --> Agentic_Core_Layer
    
    Agentic_Core_Layer --> SkillSelector
    SkillSelector --> Tooling_MCP_Layer
    
    CoreOrchestrator -->|Dispatches Task| Side_Agents_Pool
    Side_Agents_Pool --> Tooling_MCP_Layer

    Tooling_MCP_Layer --> Connection_Layer
    Agentic_Core_Layer --> Connection_Layer
    
    Tooling_MCP_Layer --> Persistence_Layer
    Transport_Layer --> Persistence_Layer
    EventBus -->|Pushes Real-time Telemetry| SSE_Stream
```

---

## 3. Keputusan Teknologi & Rationale Arsitektur

| Komponen | Pilihan Teknologi | Rationale & Justifikasi Teknis |
| :--- | :--- | :--- |
| **Backend Framework** | **NestJS 11+** | Menyediakan arsitektur modular enterprise (IoC, Dependency Injection, Guards, Interceptors) dengan dukungan TypeScript penuh. |
| **Reasoning Engine** | **Gemini 3.x Flash** | Latensi inferensi ultra-rendah (*Time-To-First-Token* sangat cepat), native function calling presisi tinggi, context window besar, dan efisien biaya. |
| **Agentic Framework** | **Google ADK / Native `@google/genai`** | Menghilangkan *abstraction bloat* dari library pihak ketiga. Kendali 100% atas alur tool calling, compaction riwayat percakapan, dan event streaming. |
| **Database Relasional & Vector** | **PostgreSQL 16 + `pgvector`** | *Single Data Store*: Menyatukan data relasional transaksional (chat, tasks, artifacts, automations) dan vector embeddings RAG dalam satu database ACID. |
| **Data Access Layer** | **Native SQL (`pg.Pool`)** | Zero ORM overhead. Fleksibilitas maksimal untuk query vector distance (`<=>`), JSONB functions, dan hybrid search tanpa batasan library ORM. |
| **Embedding Model** | **Google `text-embedding-004`** | Output vektor 768 dimensi dengan akurasi semantik tinggi dan komputasi cosine distance yang sangat cepat pada indeks HNSW. |
| **Realtime Communication** | **Server-Sent Events (SSE)** | Ringan, berbasis HTTP native, auto-reconnection bawaan browser, dan sangat optimal untuk aliran token LLM dan status progress satu arah. |
| **Automation Engine** | **NestJS Dynamic Interval & CRON Scheduler** | Eksekusi automasi latar belakang mandiri tanpa ketergantungan broker pesan eksternal berat (anti-bloat). |

---

## 4. Alur Detail Agentic Orchestration & Privilege Separation

### 4.1 Prinsip Pemisahan Hak Akses (Dual-Agent Isolation)
1. **Core Orchestrator (Read-Only Mode):**
   - Peran: Bertanggung jawab untuk dialog umum, Q&A, pencarian web, analisis arsitektur, dan memformulasi rencana tugas.
   - Hak Akses: `read_only`. DILARANG melakukan penulisan file, eksekusi terminal, atau mutasi eksternal secara langsung.
2. **Ephemeral Side Agents (Sandbox Write / Full System):**
   - Peran: Dijalankan hanya saat ada instruksi mutasi data nyata (menulis file catatan Obsidian, mengubah kode sumber, menjadwalkan meeting).
   - Masa Hidup: Bersifat *ephemeral* (dibuat sesuai tugas ➔ dieksekusi ➔ menghasilkan log & artifact ➔ selesai/terminate).
   - Hak Akses: `sandbox_write` (Obsidian, Calendar) atau `full_system` (Code Runner Sandbox).

```mermaid
sequenceDiagram
    autonumber
    actor User as User (Frontend Chat)
    participant Nest as NestJS Controller
    participant Core as Core Orchestrator (Gemini 3.x)
    participant Skill as Skill SOP Selector
    participant Tools as MCP Tool Registry (Obsidian Bridge)
    participant Side as Ephemeral Obsidian Worker
    participant DB as PostgreSQL (pg.Pool)
    participant Aside as Frontend Aside Panel

    User->>Nest: POST /api/chat/sessions/:id/messages ("Buat RFC arsitektur di Obsidian")
    Nest->>Nest: Inisialisasi SSE Stream ke Client
    Nest->>Core: Forward Prompt + Riwayat + Skill & Tool Declarations
    
    Note over Core: Timeline Stage: THINKING
    Core->>Nest: Emit Event: timeline_stage("thinking")
    
    Note over Core: Evaluasi SOP -> Memilih Skill: skill-obsidian-vault-synthesis
    Core->>Skill: Load SOP Frontmatter & Formatting Rules
    
    Note over Core: Mendeteksi aksi mutasi file fisik -> Dispatch Side Agent
    Core->>Nest: Emit Event: timeline_stage("editing")
    Nest->>Side: Spawn Ephemeral Obsidian Vault Worker
    
    Side->>Tools: Call MCP Tool: obsidian_create_note(path="Vault/Notes/rfc.md", content="...")
    Tools-->>Side: Note Created at relative path
    Side->>DB: INSERT INTO side_agent_executions (status="completed", logs=[...])
    Side-->>Core: Return Worker Result & Artifact ID
    
    Core->>Nest: Stream Sintesis Chat Eksekutif
    Nest->>User: SSE chunk: "Dokumen RFC telah ditulis ke Obsidian..."
    Nest->>Aside: SSE event: artifact_created (art-123) -> Aside Panel Terbuka
    Nest->>User: SSE event: execution_done
```

---

## 5. Arsitektur Hybrid RAG & Multi-Source Knowledge Ingestion

Pencarian konteks cerdas menggabungkan pencarian kemiripan vektor semantik (*Cosine Distance*) dan pencarian kata kunci leksikal (*Full-Text Search*) menggunakan formula gabungan:

$$\text{Relevance Score} = (0.7 \times \text{Semantic Cosine Score}) + (0.3 \times \text{Keyword BM25 Rank})$$

```mermaid
flowchart LR
    subgraph Ingestion_Pipeline [1. Knowledge Ingestion Pipeline]
        RawDoc[Raw Docs / Repos / Obsidian Markdown] --> TextSplitter[Semantic Recursive Chunker\n500-1000 tokens / 15% overlap]
        TextSplitter --> Embedder[Google text-embedding-004\nTask: RETRIEVAL_DOCUMENT]
        Embedder --> VectorInsert[INSERT INTO knowledge_chunks\nvector(768) + HNSW Index]
    end

    subgraph Query_Pipeline [2. Hybrid Search Retrieval Pipeline]
        UserQuery[User Query Prompt] --> QueryEmbedder[Google text-embedding-004\nTask: RETRIEVAL_QUERY]
        QueryEmbedder --> HybridSQL[Native SQL Hybrid Query\nVector Cosine <=> + tsvector FTS]
        HybridSQL --> RelevantContext[Top-K Ranked Context Chunks]
        RelevantContext --> LLMInject[Prompt Context Injection]
    end
```

### Indeks Vektor & Query SQL Standar:
```sql
-- Query Hybrid Search di PostgreSQL:
SELECT 
    c.id,
    c.file_path,
    c.chunk_content,
    c.metadata,
    s.name AS source_name,
    (
        0.7 * (1 - (c.embedding <=> $1::vector)) + 
        0.3 * ts_rank_cd(to_tsvector('indonesian', c.chunk_content), plainto_tsquery('indonesian', $2))
    ) AS relevance_score
FROM knowledge_chunks c
JOIN knowledge_sources s ON c.source_id = s.id
WHERE s.status = 'synced'
ORDER BY relevance_score DESC
LIMIT $3;
```

---

## 6. Spesifikasi Protokol Real-Time Streaming (SSE Contract)

Backend memancarkan event streaming dengan format MIME `text/event-stream`. Setiap event memiliki format standar:

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

### Tipe Event & Payload Data:

| Nama Event | Payload Schema | Deskripsi & Trigger |
| :--- | :--- | :--- |
| `timeline_stage` | `{ "stage": "thinking" \| "reading" \| "grepping" \| "editing" \| "done", "label": string }` | Mengubah indikator badge warna timeline pada antarmuka chat. |
| `chat_chunk` | `{ "delta": string }` | Token teks tambahan dari Gemini 3.x Flash. |
| `tool_call_start`| `{ "toolName": string, "category": string, "input": object }` | Dipancarkan saat agent mulai mengeksekusi MCP tool. |
| `tool_call_done` | `{ "toolName": string, "durationMs": number, "status": "success" \| "error" }` | Dipancarkan saat pemanggilan MCP tool selesai. |
| `side_agent_log` | `{ "sideAgentId": string, "log": string, "riskLevel": string }` | Log stdout/stderr real-time dari ephemeral worker. |
| `artifact_created`| `{ "id": string, "type": string, "title": string, "locationPath": string }` | Memicu pembukaan otomatis dokumen di Context Aside Panel. |
| `execution_done` | `{ "messageId": string, "totalTokens": number, "durationMs": number }` | Penanda akhir aliran stream obrolan. |
| `error` | `{ "code": string, "message": string }` | Mengirimkan pesan kegagalan secara anggun (*graceful failure*). |

---

## 7. Spesifikasi Kontrak REST API (Endpoints Specification)

Semua endpoint standar mengembalikan payload berstruktur seragam:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "meta": { "timestamp": "2026-08-23T12:30:00.000Z" }
}
```

### 7.1 Chat & Conversational Canvas (`/api/chat`)
- `GET /api/chat/sessions` ➔ Mengambil semua daftar sesi percakapan.
- `POST /api/chat/sessions` ➔ Membuat sesi percakapan baru.
- `GET /api/chat/sessions/:id` ➔ Mengambil detail sesi beserta seluruh riwayat pesan.
- `DELETE /api/chat/sessions/:id` ➔ Menghapus sesi chat beserta relasinya.
- `POST /api/chat/sessions/:id/messages` ➔ Mengirim pesan teks baru (Mendukung query `?stream=true` untuk Server-Sent Events).
- `POST /api/chat/morning-briefing` ➔ Memicu generator ringkasan pagi proaktif harian.

### 7.2 Context Aside & Artifacts (`/api/artifacts`)
- `GET /api/artifacts` ➔ Mengambil daftar seluruh dokumen/diff/visual asset.
- `GET /api/artifacts/:id` ➔ Mengambil detail isi dokumen artifact.
- `PUT /api/artifacts/:id` ➔ Memperbarui konten dokumen (saat user mengedit di Aside Panel).
- `DELETE /api/artifacts/:id` ➔ Menghapus artifact.

### 7.3 Personal Hub: Long-Term Memories (`/api/personal-hub`)
- `GET /api/personal-hub/memories` ➔ Mengambil memori jangka panjang pengguna.
- `GET /api/personal-hub/memory-summary` ➔ Mengambil rangkuman ringkas memori (Markdown).
- `POST /api/personal-hub/memories` ➔ Menambah item preferensi/memori baru.
- `DELETE /api/personal-hub/memories` ➔ Menghapus semua memori.
- `DELETE /api/personal-hub/memories/:id` ➔ Menghapus item memori spesifik.

### 7.4 Multi-Source Knowledge (`/api/knowledge`)
- `GET /api/knowledge/sources` ➔ Mengambil daftar sumber pengetahuan terhubung.
- `POST /api/knowledge/sources` ➔ Mendaftarkan sumber pengetahuan baru (Obsidian/GitHub/Notion).
- `POST /api/knowledge/sources/:id/sync` ➔ Memulai proses background sync & re-indexing vector.
- `DELETE /api/knowledge/sources/:id` ➔ Menghapus sumber pengetahuan dan seluruh chunks-nya (Cascade).

### 7.5 Connections & External Providers (`/api/connections`)
- `GET /api/connections` ➔ Mengambil daftar koneksi provider (LLM Providers, MCP Endpoints, OAuth).
- `POST /api/connections` ➔ Menambah konfigurasi koneksi baru.
- `PATCH /api/connections/:id` ➔ Memperbarui API key atau endpoint koneksi.
- `POST /api/connections/:id/test` ➔ Melakukan ping/test konektivitas ke provider eksternal.
- `DELETE /api/connections/:id` ➔ Menghapus kredensial koneksi.

### 7.6 Agent Roster, Skills & MCP Tools (`/api/ecosystem`)
- `GET /api/ecosystem/agents` ➔ Mengambil daftar konfigurasi agen.
- `PATCH /api/ecosystem/agents/:id` ➔ Mengubah prompt sistem, temperature, atau permission tier.
- `GET /api/ecosystem/skills` ➔ Mengambil daftar katalog Standard Operating Procedure (SOP) Skills.
- `PATCH /api/ecosystem/skills/:id/toggle` ➔ Mengaktifkan/menonaktifkan skill.
- `GET /api/ecosystem/mcp-tools` ➔ Mengambil daftar MCP Connectors dan tools terdaftar.
- `POST /api/ecosystem/mcp-tools/:id/test` ➔ Melakukan test ping ke server MCP (STDIO/SSE).

### 7.7 Activity Telemetry (`/api/activity`)
- `GET /api/activity/logs` ➔ Mengambil log telemetri terfilter (dengan pagination).
- `GET /api/activity/export` ➔ Mengunduh data audit trail dalam format `contextforge_activity_audit.json`.

### 7.8 Autonomous Workflows & Automations (`/api/automations`)
- `GET /api/automations` ➔ Mengambil seluruh daftar konfigurasi alur kerja automasi.
- `POST /api/automations` ➔ Mendaftarkan automasi baru (CRON / Event Trigger).
- `GET /api/automations/:id` ➔ Mengambil detail workflow automasi.
- `PATCH /api/automations/:id` ➔ Memperbarui konfigurasi automasi (prompt, jadwal, HITL mode).
- `DELETE /api/automations/:id` ➔ Menghapus workflow automasi dan seluruh riwayat run-nya.
- `POST /api/automations/:id/trigger` ➔ Memicu eksekusi instan manual (*On-Demand Run*).
- `PATCH /api/automations/:id/toggle` ➔ Mengaktifkan/menonaktifkan jadwal automasi.
- `GET /api/automations/runs` ➔ Mengambil riwayat run dan telemetri eksekusi automasi.
- `GET /api/automations/stats` ➔ Mengambil ringkasan metrik statistik operasional automasi.

---

## 8. Arsitektur Data Access Layer (Native SQL & Connection Management)

Tanpa ORM, data access layer dienkapsulasi menggunakan pola **Repository Pattern** di atas service terpadu **`DatabaseService`**:

```typescript
// src/common/database/database.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Pool, QueryResult, QueryResultRow } from 'pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    this.pool = new Pool({
      connectionString: this.config.get<string>('DATABASE_URL'),
      max: 20, // Max concurrent connection pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    try {
      const client = await this.pool.connect();
      this.logger.log('🚀 Connected to PostgreSQL database successfully');
      client.release();
    } catch (err) {
      this.logger.error('❌ Failed to connect to PostgreSQL database', err.stack);
    }
  }

  async query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const start = Date.now();
    const res = await this.pool.query<T>(text, params);
    const duration = Date.now() - start;
    if (duration > 200) {
      this.logger.warn(`⚠️ Slow query (${duration}ms): ${text.slice(0, 100)}...`);
    }
    return res;
  }

  async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
```

---

## 9. Struktur Folder & Modul NestJS (Definitive Blueprint)

```text
backend/
├── docs/
│   ├── ERD.md                            # Entity Relationship Diagram & SQL DDL (v2.1.0)
│   └── TDD.md                            # Technical Design Document (File ini v2.1.0)
│
├── src/
│   ├── main.ts                           # Entrypoint aplikasi (Bootstrap, CORS, Global Pipes)
│   ├── app.module.ts                     # Root Module agregator
│   │
│   ├── config/                           # Konfigurasi Environment (Zod validated)
│   │   ├── env.validation.ts
│   │   ├── database.config.ts
│   │   └── gemini.config.ts
│   │
│   ├── common/                           # Cross-cutting concerns & utilitas
│   │   ├── database/                     # Native pg.Pool DatabaseModule & Service
│   │   │   ├── database.module.ts
│   │   │   └── database.service.ts
│   │   ├── filters/                      # GlobalExceptionFilter (RFC 7807)
│   │   ├── guards/                       # HitlGuard, ApiKeyGuard
│   │   ├── interceptors/                 # TransformResponse, LoggingInterceptor
│   │   └── pipes/                        # ZodValidationPipe
│   │
│   ├── modules/                          # Modul Domain Bisnis (Feature-Sliced)
│   │   ├── chat/                         # Chat Engine & SSE Stream
│   │   │   ├── chat.controller.ts
│   │   │   ├── chat.service.ts
│   │   │   ├── chat.repository.ts
│   │   │   └── dto/
│   │   ├── artifacts/                    # Context Aside Artifacts Management
│   │   │   ├── artifacts.controller.ts
│   │   │   ├── artifacts.service.ts
│   │   │   └── artifacts.repository.ts
│   │   ├── personal-hub/                 # Calendar & User Long-Term Memories
│   │   │   ├── personal-hub.controller.ts
│   │   │   ├── personal-hub.service.ts
│   │   │   └── personal-hub.repository.ts
│   │   ├── knowledge/                    # 1. Knowledge Domain: Ingestion & Chunker
│   │   │   ├── knowledge.controller.ts
│   │   │   ├── knowledge.service.ts
│   │   │   ├── knowledge.repository.ts
│   │   │   └── chunking.service.ts
│   │   ├── connections/                  # 4. Connection Domain: Providers & Credential Vault
│   │   │   ├── connections.controller.ts
│   │   │   ├── connections.service.ts
│   │   │   └── connections.repository.ts
│   │   ├── ecosystem/                    # 2, 3 & 5. Agents, Skills & MCP Registry
│   │   │   ├── ecosystem.controller.ts
│   │   │   ├── ecosystem.service.ts
│   │   │   └── ecosystem.repository.ts
│   │   ├── automation/                   # Autonomous Workflows & CRON Trigger Engine
│   │   │   ├── automation.controller.ts
│   │   │   ├── automation.service.ts
│   │   │   ├── automation.repository.ts
│   │   │   ├── automation-scheduler.service.ts
│   │   │   └── dto/
│   │   └── activity/                     # Telemetry Streamer & Audit Exporter
│   │       ├── activity.controller.ts
│   │       ├── activity.service.ts
│   │       └── activity.repository.ts
│   │
│   ├── mcp/                              # 🔌 Model Context Protocol (MCP) Modular Layer
│   │   ├── mcp.module.ts                 # NestJS MCP Module Agregator
│   │   ├── mcp-gateway.service.ts        # Universal Router & Tool Dispatcher
│   │   ├── interfaces/                   # IMcpServer, McpToolDefinition, McpTransport
│   │   │   ├── mcp-server.interface.ts
│   │   │   ├── mcp-tool.interface.ts
│   │   │   └── mcp-transport.types.ts
│   │   ├── internal/                     # 🏠 1. Local / In-Process Native MCPs
│   │   │   └── obsidian/                 # Native Obsidian Vault Bridge
│   │   │       ├── obsidian-mcp.server.ts
│   │   │       └── obsidian-vault.service.ts
│   │   └── remote/                       # 🌐 2. Remote Network MCP Connectors
│   │       ├── clients/                  # SSE & Streamable HTTP Transports
│   │       │   ├── mcp-client.interface.ts
│   │       │   ├── mcp-http.client.ts
│   │       │   └── mcp-sse.client.ts
│   │       └── connectors/               # Remote Adapters (Notion, Dynamic Endpoints)
│   │           ├── notion/notion-mcp.connector.ts
│   │           └── generic-remote.connector.ts
│   │
│   └── agentic-core/                     # 🧠 Google ADK & Gemini Reasoning Engine
│       ├── agentic-core.module.ts
│       ├── gemini-client.provider.ts     # Inisialisasi Google GenAI SDK Client
│       ├── orchestrator/                 # Core Orchestrator Loop & Reasoning
│       │   └── core-orchestrator.service.ts
│       ├── handlers/                     # 🛠️ Specialized Tool Handlers
│       │   ├── universal-mcp-tool.handler.ts # Gateway bridge to src/mcp
│       │   ├── knowledge-tool.handler.ts # pgvector Hybrid Retrieval Tool
│       │   ├── automation-tool.handler.ts# Workflow trigger tool
│       │   └── web-search-tool.handler.ts# Live Web Search Tool
│       ├── embeddings/                   # Embedding Service (text-embedding-004)
│       │   └── embedding.service.ts
│       └── prompts/                      # System Prompts & Skill SOP Templates
│           └── orchestrator.prompt.ts
│
├── database/                             # Migrations & Seeders
│   ├── schema.sql                        # Skrip inisialisasi DDL PostgreSQL
│   └── seeds/                            # Initial seed data (Default Agents, Skills, MCP)
│       └── seed.sql
│
├── test/                                 # Unit & E2E Tests
│   ├── chat.e2e-spec.ts
│   └── rag.spec.ts
│
├── .env.example                          # Template konfigurasi environment
├── package.json
└── tsconfig.json
```

---

## 10. Keamanan, Guardrails & Human-in-the-Loop (HITL)

1. **Strict HITL Mode Enforcement:**
   - Ketika mode *Strict HITL* aktif di pengaturan (`settings`) atau konfigurasi automasi (`guardrail_strict_hitl = true`), setiap eksekusi Side Agent dengan tingkat risiko `high_risk` (seperti penghapusan file, eksekusi perintah shell berbahaya, atau push git) akan dipause dengan status `waiting_approval`.
   - Backend memancarkan notifikasi persetujuan ke frontend dan menunggu verifikasi eksplisit sebelum melanjutkan proses.
2. **AST (Abstract Syntax Tree) Verification:**
   - Sebelum kode sumber diterapkan ke repository atau dijadikan file diff, tool `code_ast_checker` melakukan parsing AST untuk memastikan tidak ada kesalahan sintaksis atau ekspresi berbahaya.
3. **Prompt Injection Shielding:**
   - Karena Core Orchestrator berjalan dalam status *Read-Only*, injeksi prompt berbahaya dari data web tidak dapat memicu perintah terminal secara langsung.

---

## 11. Roadmap Pengembangan Step-by-Step

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       TAHAPAN PENGEMBANGAN BACKEND                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [FASE 1: Fondasi, Database Core & Connections Vault]                       │
│  ├── 1.1 Setup Docker PostgreSQL 16 + pgvector di lokal                     │
│  ├── 1.2 Eksekusi database/schema.sql & inisialisasi seed data 5 Pilar       │
│  ├── 1.3 Setup DatabaseModule (pg.Pool) & Health Check Controller          │
│  └── 1.4 Implementasi CRUD: Connections, Artifacts & Personal Hub          │
│                                                                             │
│  [FASE 2: Google GenAI Core & Conversational Streaming]                     │
│  ├── 2.1 Konfigurasi Gemini 3.x Flash Provider (@google/genai SDK)          │
│  ├── 2.2 Implementasi Chat Controller & SSE Streaming Pipeline              │
│  ├── 2.3 Implementasi Tool Calling Loop & Function Declarations             │
│  └── 2.4 Sinkronisasi otomatis ke Aside Panel via Event Stream              │
│                                                                             │
│  [FASE 3: Side-Agents Execution, MCP Bridge & Multi-Source RAG]             │
│  ├── 3.1 Embedding Service (Google text-embedding-004)                      │
│  ├── 3.2 Ingestion Chunker & Hybrid Search SQL Repository                   │
│  ├── 3.3 Ephemeral Workers (Obsidian MCP Bridge, Code Runner, Calendar)     │
│  └── 3.4 Telemetry Streamer & Audit Log JSON Exporter                       │
│                                                                             │
│  [FASE 4: Autonomous Workflows, Testing & Integrasi Frontend]               │
│  ├── 4.1 Implementasi Automation Scheduler (CRON & Event Triggers)          │
│  ├── 4.2 Unit Testing untuk Tool Registry, Skills & Agentic Loop            │
│  ├── 4.3 E2E Integration Testing dengan Frontend React 19                   │
│  └── 4.4 Kesiapan Deploy ke Google Cloud (Cloud Run + Cloud SQL)            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 12. Persetujuan & Langkah Lanjutan

Dokumen **Technical Design Document (TDD) v2.1.0** ini menetapkan seluruh standar, arsitektur, dan pola implementasi teknis untuk ContextForge berbasis **5 Pilar Abstraksi** dan **Autonomous Workflow Engine**. Seluruh pengembangan kode backend berikutnya akan merujuk secara ketat pada spesifikasi ini.
