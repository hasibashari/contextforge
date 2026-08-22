---
name: Deep Web Synthesis & Citation Grounding
description: Structured research playbook for querying search engines, evaluating source credibility, and synthesizing cited analytical answers.
category: knowledge
icon: globe
assignedTools:
  - web_search
  - search_knowledge_vault
---

# Deep Web Synthesis & Citation Grounding

## Instructions

Follow this research procedure when answering technical questions requiring external web verification or factual grounding:

1. **Multi-Query Formulation**:
   - Deconstruct complex questions into 2-3 focused search queries covering different technical angles, releases, or documentation keywords.

2. **Source Authority & Verification**:
   - Prioritize official documentation (e.g. `docs.github.com`, `nodejs.org`, `nextjs.org`, official RFCs) over unverified blogs.
   - Cross-verify factual claims with at least 2 independent reputable sources before asserting conclusions.

3. **Synthesis Structure**:
   - **Direct Answer**: Provide a concise 2-sentence executive summary answering the user's primary question immediately.
   - **Comparative Breakdown**: Use Markdown tables or bulleted feature comparisons to highlight trade-offs, pros, and cons.
   - **Code / Implementation Examples**: Provide runnable, modern code snippets when applicable.

4. **Footnote Citations**:
   - Embed numbered markdown footnote citations `[^1]`, `[^2]` directly adjacent to key facts.
   - Append a `### References` section at the end of the response listing source domain names and URLs.

## Examples

```markdown
### Analysis of Next.js 15 Server Actions

Next.js 15 introduces asynchronous request handling and enhanced security cookies for Server Actions[^1].

| Feature | Next.js 14 | Next.js 15 |
| :--- | :--- | :--- |
| `cookies()` / `headers()` | Synchronous access | Asynchronous `await` access[^1] |
| React Support | React 18 / 19 RC | React 19 Default[^2] |

### Key Improvements
1. **Async Request Lifecycle**: Prevents blocking renders during header inspection.
2. **Security Headers**: Enhanced origin checking by default on POST actions.

### References
- [^1]: [Next.js 15 Release Notes](https://nextjs.org/blog/next-15)
- [^2]: [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19)
```
