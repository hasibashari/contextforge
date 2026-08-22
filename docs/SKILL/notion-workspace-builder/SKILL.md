---
name: Notion Workspace Page & Database Builder
description: Playbook for creating structured Notion pages with rich block hierarchy, callout boxes, toggle sections, and database property schemas.
category: productivity
icon: database
assignedTools:
  - notion_get_tasks
  - notion_search
  - notion_read_page
  - notion_create_page
  - notion_update_database
---

# Notion Workspace Page & Database Builder

## Instructions

Follow this standard procedure when creating or synchronizing pages, documents, and databases inside Notion workspaces:

1. **Page Title and Emoji Icon**:
   - Provide a clear, actionable page title prefixed with an appropriate semantic emoji (e.g., `🚀 Project Kickoff`, `📊 Q3 Sprint Roadmap`, `📐 API Specification`).

2. **Executive Callout Block**:
   - Place an executive summary callout block at the very top with emoji icon `💡` or `📌` explaining the page objective and target stakeholders.

3. **Block Hierarchy & Toggle Lists**:
   - Structure sections using `Heading 2` and `Heading 3`.
   - Use interactive toggle lists (`▶ Details / Deep Dive`) for verbose logs, raw schemas, or technical appendices to keep the document scannable.

4. **Database Properties Formatting**:
   - When inserting into Notion Databases, populate properties cleanly:
     - `Status`: Select type (`Not Started`, `In Progress`, `Done`).
     - `Priority`: Select type (`High`, `Medium`, `Low`).
     - `Owner`: Person / Agent identifier.
     - `Tags`: Multi-select array.

5. **Bullet & Checkbox Action Items**:
   - End operational pages with a `### Next Steps & Action Items` checklist (`[ ] Item description`).

## Examples

```markdown
# 🚀 Backend Microservices Migration Plan

> 💡 **Executive Summary**: Migration guide transitioning monolithic endpoints to NestJS modular services with Model Context Protocol (MCP) tooling.

## 📌 Key Objectives
- [x] Abstract agent personas to 3 core workers
- [ ] Connect Notion MCP Server via OAuth 2.0
- [ ] Validate bidirectional sync latency (<20ms)

## 📐 Architecture Schema
| Service | Endpoint | Protocol | Status |
| :--- | :--- | :--- | :--- |
| `agentic-core` | `/api/chat` | SSE Stream | Active |
| `ecosystem` | `/api/ecosystem` | REST | Active |

<details>
<summary>▶ Technical Appendix & Payload Schema</summary>

\`\`\`json
{
  "event": "side_agent_execution",
  "agentId": "agent-conversational",
  "status": "completed"
}
\`\`\`
</details>
```
