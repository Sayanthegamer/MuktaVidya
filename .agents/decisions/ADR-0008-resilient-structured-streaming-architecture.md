# ADR-0008: Resilient Structured Streaming Architecture & Zero-Flash Math UI

- **Date:** 2026-10-07
- **Status:** 🟢 Accepted
- **Decider(s):** Lead Architect (Authorized by Human Engineer)
- **Governance Tier:** Tier 1 (Impacted Vectors: Vector 6: Concurrency & Execution Model, Vector 7: Public & Module Interfaces, Vector 8: Algorithmic & Dependency Choices)

---

## 1. Context & Problem Statement
In Muktavidya (`open-solver`), the previous solution rendering pipeline suffered from three compounding failure modes:
1. **The Monospace Flash:** During token streaming, `ChatMessageItem` dumped the raw string into a monospaced `<pre>` block. When streaming concluded, the component abruptly switched to `ReactMarkdown`, causing visual layout snapping and jarring font jumps.
2. **Catastrophic KaTeX Render Crashes:** `rehype-katex` was initialized with default settings (`throwOnError: true`). Any model hallucination in math syntax (unclosed brackets, invalid LaTeX macros, double subscripts) caused React to throw an unhandled exception, collapsing the UI into `SolutionErrorBoundary` with `"Render failed. Showing raw text"`.
3. **Fragile Prompt Formatting & Regex Band-Aids:** Relying on freeform markdown prompts without structural guarantees caused section misalignment and broken code-fence parsing in `DiagramRenderer`.

## 2. The Decision: Hybrid Resilient Stream & Progressive Bento Architecture
We adopt the **Hybrid Resilient Streaming Architecture**:
1. **Live Continuous Markdown Streaming (Zero `<pre>` Flash):**
   - Eliminate the `<pre>` raw monospace tag during streaming entirely.
   - Stream directly into `ReactMarkdown` with a token-safe streaming cursor. The DOM hierarchy remains identical during and after streaming.
2. **Fail-Safe KaTeX Pipeline (`throwOnError: false`):**
   - Configure `rehype-katex` with `{ throwOnError: false, errorColor: '#ef4444', strict: false }`.
   - Implement an unclosed math boundary guard so that partial `$` or `$$` delimiters during live streaming are handled gracefully without syntax crashes.
3. **Semantic Section Mapping (Modern Bento Layout):**
   - Parse standard exam solution sections (`### Subject`, `### Given`, `### Approach`, `### Solution`/Steps, `### Answer`) into modern expressive UI components (Subject badges, Given checklists, Step cards, and glowing Final Answer callouts).
   - Conversational follow-ups maintain natural fluid markdown without being forced into an artificial test schema.
4. **Resilient Diagram Boundaries:**
   - Render placeholder skeletons (`"Rendering diagram..."`) while diagram code blocks (SVG/ECharts) are actively streaming, instantly mounting the interactive visual upon block closure.

## 3. Rejected Alternatives ("Why Not That?")
* **Pure Rigid JSON Schema for All Chat Turns (`responseJsonSchema`):**
  - *Why Considered:* Guaranteed JSON object keys from the Gemini engine.
  - *Why Rejected:* Forcing all responses into a rigid single schema breaks natural multi-turn tutoring ("Can you explain step 2 in simpler terms?"). Partial JSON token streaming requires complex mid-string unescaping and increases token latency.
* **Server-Sent Events (SSE) Micro-Event Protocol:**
  - *Why Considered:* Fine-grained server-driven event boundaries.
  - *Why Rejected:* Requires server-side buffering and custom stream framing on Vercel serverless routes, adding needless latency and infrastructure complexity compared to streaming tokens directly.

## 4. Conscious Trade-offs (What We Sacrificed)
* We sacrificed rigid server-enforced JSON validation across all fields in exchange for conversational flexibility, lowest token latency, and universal support for both structured initial solutions and freeform follow-up questions.

## 5. Revisit Trigger (When to Change Your Mind)
* Revisit if Muktavidya shifts from an interactive student tutor into a batch evaluation API requiring machine-to-machine JSON contracts, or if Gemini SDK releases native first-class streaming JSON object hooks with zero unescaping overhead.
