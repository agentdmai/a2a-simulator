# Project Research Summary

**Project:** A2A Test Client
**Domain:** Developer tooling / Protocol testing (A2A agent-to-agent protocol)
**Researched:** 2026-03-27
**Confidence:** HIGH

## Executive Summary

The A2A Test Client is a dual-role developer tool that acts as both an A2A protocol server and client simultaneously, with a React-based UI for interactive testing. The recommended approach uses the official `@a2a-js/sdk` package (not the `a2a-node` name referenced in the project brief) running on Express 5, which has first-class SDK integration. Each instance is a single Node.js process serving a React SPA, an internal REST/SSE API for the UI, and full A2A protocol endpoints -- all on one port. Two instances on different ports simulate bidirectional agent-to-agent communication.

Existing tools (A2A Inspector, A2A Validation Tool) are client-only: they connect to agents but cannot act as agents themselves. The core differentiator of this project is the dual-role architecture where each instance both serves and consumes the A2A protocol, with a human-in-the-loop response composer replacing the LLM. The architecture is well-understood -- Express + React SPA with Vite proxy in dev, static serving in production -- and the SDK provides most of the protocol plumbing (task store, request handler, Express middleware, client).

The primary risks are: (1) SSE stream lifecycle management, since two separate SSE layers exist (A2A protocol SSE between agents, and UI SSE from backend to browser) and both need careful cleanup; (2) task state machine correctness, since A2A has 7 states with strict transition rules that are easy to get wrong; and (3) the POST-based streaming requirement, which means native browser `EventSource` cannot be used -- a fetch-based SSE library is required. All three risks are well-understood with clear mitigation strategies documented in the research.

## Key Findings

### Recommended Stack

The stack is dictated largely by the `@a2a-js/sdk` package, which ships Express middleware as its primary integration. Fighting this (e.g., using Hono or Fastify) would mean writing custom adapters for no benefit. The frontend uses React 19 with Vite 8 and Zustand for state -- lightweight choices appropriate for a developer tool. See [STACK.md](./STACK.md) for full details.

**Core technologies:**
- **@a2a-js/sdk ^0.3.10**: Official A2A protocol SDK -- provides client, server, Express middleware, task store, and TypeScript types
- **Express ^5.2**: HTTP server -- first-class SDK support via `A2AExpressApp`, serves SPA + API + A2A on one port
- **React ^19 + Vite ^8**: Frontend SPA -- fast dev with HMR, proxy to Express backend, production static build
- **TypeScript ^5.7**: Full-stack type safety -- shared types between client and server eliminate protocol mismatches
- **Zustand ^5**: Client state management -- lightweight, no boilerplate, fits the modest state needs of a dev tool
- **Commander ^13**: CLI argument parsing -- port, agent name, description for WebStorm run configurations
- **Tailwind CSS ^4**: Utility styling -- fast to build chat UIs and forms without component library overhead

### Expected Features

The feature set splits cleanly into table stakes (matching existing tools) and differentiators (the dual-role capability). See [FEATURES.md](./FEATURES.md) for full analysis including anti-features.

**Must have (table stakes):**
- Connect to remote agent by URL and display their Agent Card
- Send messages via `message/send` with chat-style UI
- SSE streaming via `message/stream` with incremental rendering
- Task lifecycle visualization (7 states with real-time updates)
- Raw JSON-RPC message view for protocol debugging
- CLI args for port, name, and configuration

**Should have (differentiators):**
- Dual-role: act as both A2A server AND client simultaneously
- Incoming task management panel (see tasks other agents sent to you)
- Task response composer (manually reply as the server-side agent)
- Configurable Agent Card via UI (edit identity, skills, capabilities live)
- Task state control (manually transition states when acting as server)
- Authentication token management for both directions

**Defer (v2+):**
- gRPC transport (JSON-RPC covers all testing needs)
- Push notification webhooks (requires public URL/tunneling)
- Config export/import
- Automated test suites / assertions (different product)

### Architecture Approach

The architecture is a single Express process per instance with three route layers: static SPA serving, internal REST+SSE API for the React UI, and A2A protocol endpoints. The critical architectural pattern is the SSE Bridge -- a component that translates between A2A protocol SSE events and simplified UI SSE events, keeping the React frontend decoupled from protocol details. The `UIBridgeExecutor` (implementing the SDK's `AgentExecutor` interface) handles inbound messages by setting tasks to `input-required` and pushing to the UI, rather than blocking until a human responds. See [ARCHITECTURE.md](./ARCHITECTURE.md) for full component diagrams and data flows.

**Major components:**
1. **Express Server** -- single entry point serving SPA, internal API, and A2A endpoints on one configurable port
2. **A2A Server (inbound)** -- `A2AExpressApp` + `UIBridgeExecutor` receiving messages from remote agents, relaying to UI
3. **A2A Client (outbound)** -- `A2AClient` connecting to remote agents, sending messages, consuming SSE streams
4. **SSE Bridge** -- translates A2A protocol events into UI events; critical glue between protocol and frontend
5. **Internal API Layer** -- REST routes (`/api/*`) bridging React UI to server-side A2A logic
6. **React SPA** -- agent config, connection panel, chat interface, task lifecycle visualization

### Critical Pitfalls

The top pitfalls span SDK identity, protocol correctness, and streaming lifecycle. See [PITFALLS.md](./PITFALLS.md) for the complete list with recovery strategies.

1. **SDK package confusion** -- The project brief says "a2a-node" but the correct package is `@a2a-js/sdk`. Verify before writing any code. Recovery cost: LOW.
2. **Task state machine violations** -- A2A has 7 states with strict transitions. Implement a proper state machine upfront; do not use ad-hoc string checks. Terminal states are immutable. Recovery cost: MEDIUM.
3. **SSE stream lifecycle leaks** -- Two SSE layers (protocol and UI) both need cleanup on disconnect. Listen for `req.on('close')`, send keep-alives, close streams on terminal task states. Recovery cost: MEDIUM.
4. **Native EventSource cannot POST** -- A2A streaming uses POST with JSON-RPC body. Use `@microsoft/fetch-event-source` or the SDK client instead of native `EventSource`. Recovery cost: MEDIUM.
5. **Agent Card URL/port mismatch** -- The card's `url` field must match the actual listening port. Auto-derive from CLI args, add self-connection guard. Recovery cost: LOW.
6. **Context ID vs Task ID confusion** -- Clients must not generate task IDs (server-only). Clients should track `contextId` for conversation threading. Recovery cost: HIGH if done wrong.

## Implications for Roadmap

Based on combined research, the build should follow a backend-first approach: get the protocol layer working and testable with curl before building any UI. This matches the architecture's dependency chain and reduces debugging surface area.

### Phase 1: Project Setup and Server Skeleton
**Rationale:** Everything depends on a running Express server with correct SDK integration. The SDK package confusion pitfall must be resolved immediately.
**Delivers:** Express server starting on CLI-configurable port, correct `@a2a-js/sdk` installed, TypeScript compilation working, Vite dev proxy configured.
**Addresses:** CLI args (port, name), server startup, dev tooling setup.
**Avoids:** SDK package confusion (Pitfall 1), port binding issues (Pitfall 6).

### Phase 2: A2A Server (Inbound Protocol)
**Rationale:** The A2A server side must exist before anything can discover or talk to this instance. Agent Card serving is the foundation of A2A identity.
**Delivers:** Agent Card served at well-known URL (auto-derived from port), JSON-RPC endpoint accepting `message/send`, `UIBridgeExecutor` setting tasks to `input-required`, `InMemoryTaskStore` tracking tasks.
**Addresses:** Agent Card serving, Agent Card validation, incoming task handler.
**Avoids:** Agent Card schema mismatches (Pitfall 5), task state violations (Pitfall 2), blocking executor anti-pattern.

### Phase 3: A2A Client (Outbound Protocol)
**Rationale:** With the server working, add the client side so two instances can communicate at the protocol level (testable with curl/CLI before any UI).
**Delivers:** Connect to remote agent by URL, fetch and validate remote Agent Card, send `message/send`, consume response. Two instances can exchange messages at the protocol layer.
**Addresses:** Connect to remote agent, send messages, Agent Card display.
**Avoids:** Context/Task ID confusion (Pitfall 7), self-connection loops (Pitfall 6).

### Phase 4: SSE Streaming
**Rationale:** Streaming is a dedicated phase because it introduces the two-layer SSE architecture (protocol SSE + UI SSE) and requires careful lifecycle management. Rushing this creates hard-to-fix memory leaks.
**Delivers:** `message/stream` support (both sending and receiving), SSE Bridge component, incremental event rendering, stream cleanup on disconnect and terminal states.
**Addresses:** SSE streaming, task lifecycle visualization (real-time updates).
**Avoids:** SSE lifecycle leaks (Pitfall 3), native EventSource POST limitation (Pitfall 4).

### Phase 5: React SPA -- Core UI
**Rationale:** The protocol layer is now fully functional and testable. Build the UI on top of proven backend functionality.
**Delivers:** Connection panel, chat interface with message bubbles, task status badges, raw JSON-RPC view, SSE event consumption via hooks.
**Addresses:** Chat-style message UI, task lifecycle visualization, raw JSON-RPC view, Agent Card display.
**Avoids:** Embedding protocol logic in React (Architecture anti-pattern 1), WebSocket instead of SSE (anti-pattern 2).

### Phase 6: Server Mode UI and Differentiators
**Rationale:** With the core UI working for client mode, add the server-mode UI that makes this tool unique -- the ability to see incoming tasks and manually compose responses.
**Delivers:** Incoming task management panel, task response composer, task state control buttons, Agent Card config UI (edit identity/skills live).
**Addresses:** All differentiator features -- dual-role testing, bidirectional communication, human-in-the-loop agent simulation.
**Avoids:** Scope creep into LLM integration or automated responses (anti-feature).

### Phase 7: Polish and Completeness
**Rationale:** Final pass for authentication, artifact support, and edge cases.
**Delivers:** Auth token management (both directions), artifact display and creation, `tasks/cancel` and `tasks/resubscribe` support, error handling for all JSON-RPC error codes.
**Addresses:** Authentication, artifacts, remaining protocol methods (P2 priority).
**Avoids:** Premature optimization, feature creep beyond the testing tool scope.

### Phase Ordering Rationale

- **Backend before frontend:** The architecture research strongly recommends getting the protocol layer testable with curl before building UI. This isolates protocol bugs from UI bugs.
- **Server before client:** Agent Card serving is a prerequisite for any A2A communication. The inbound side is simpler to verify (curl a JSON-RPC request) than the outbound side.
- **Streaming as its own phase:** All four research files flag SSE as the highest-complexity, highest-risk area. Isolating it prevents streaming bugs from blocking basic message/send functionality.
- **Differentiators last in UI:** The dual-role server UI (incoming task panel, response composer) depends on all prior infrastructure. Building it last means the protocol layer is battle-tested.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (A2A Server):** The `UIBridgeExecutor` pattern -- bridging SDK's `AgentExecutor` to a human-in-the-loop UI -- is not a standard SDK usage pattern. Need to verify `eventBus` lifecycle and whether pending tasks survive across multiple SSE connections.
- **Phase 4 (SSE Streaming):** Two-layer SSE architecture needs careful design. Research the exact event format from `@a2a-js/sdk`'s streaming APIs and how `@microsoft/fetch-event-source` handles reconnection.

Phases with standard patterns (skip deep research):
- **Phase 1 (Setup):** Standard Express + Vite + TypeScript setup. Well-documented.
- **Phase 3 (A2A Client):** The SDK's `A2AClient` class handles most complexity. Standard usage patterns from tutorials.
- **Phase 5 (Core UI):** Standard React SPA patterns -- forms, chat bubbles, SSE hooks. Nothing novel.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official SDK verified on npm/GitHub. Express integration is first-class. All versions confirmed current. |
| Features | HIGH | Two competing tools analyzed. Clear table stakes vs differentiators. Anti-features well-defined. |
| Architecture | HIGH | Dual-role pattern well-documented in SDK examples. Data flows verified against protocol spec. |
| Pitfalls | MEDIUM-HIGH | Critical pitfalls verified via SDK issues and protocol spec. Some performance traps are extrapolated from similar SSE architectures. |

**Overall confidence:** HIGH

### Gaps to Address

- **@a2a-js/sdk `AgentExecutor` lifecycle:** The `UIBridgeExecutor` pattern (storing `eventBus` references for later human response) is not explicitly documented in the SDK. Needs validation during Phase 2 implementation -- verify that the eventBus remains usable after `execute()` returns.
- **Agent Card well-known URL:** The SDK may serve at `/.well-known/agent.json` vs `/.well-known/agent-card.json`. The exact path must be verified against the installed SDK version during Phase 1.
- **SSE reconnection behavior:** How does the SDK client handle dropped SSE connections mid-stream? Does `tasks/resubscribe` work seamlessly? Needs testing during Phase 4.
- **Express 5 + SDK compatibility:** Express 5 changed some middleware APIs. Verify `@a2a-js/sdk`'s Express integration works with Express 5.2 specifically (not just Express 4.x).

## Sources

### Primary (HIGH confidence)
- [@a2a-js/sdk on GitHub](https://github.com/a2aproject/a2a-js) -- SDK API surface, Express integration, package identity
- [@a2a-js/sdk on npm](https://www.npmjs.com/package/@a2a-js/sdk) -- v0.3.10, version verification
- [A2A Protocol Specification](https://a2a-protocol.org/latest/specification/) -- task states, JSON-RPC methods, agent cards
- [A2A Streaming and Async Operations](https://a2a-protocol.org/latest/topics/streaming-and-async/) -- SSE format, reconnection

### Secondary (MEDIUM confidence)
- [A2A JS SDK Tutorial (DEV Community)](https://dev.to/czmilo/a2a-js-sdk-complete-tutorial-quick-start-guide-41d2) -- setup patterns, executor examples
- [A2A Inspector (GitHub)](https://github.com/a2aproject/a2a-inspector) -- feature baseline for competing tools
- [A2A Validation Tool (GitHub)](https://github.com/llmx-tech/a2a-validation-tool) -- feature comparison
- [Semgrep Security Guide to A2A](https://semgrep.dev/blog/2025/a-security-engineers-guide-to-the-a2a-protocol/) -- security pitfalls

### Tertiary (LOW confidence)
- [Express SSE Memory Leak Issue #2248](https://github.com/expressjs/express/issues/2248) -- connection cleanup patterns (Express 4 era, may differ in 5)
- [Improving A2A Protocol Security (arxiv)](https://arxiv.org/html/2505.12490v3) -- theoretical security concerns

---
*Research completed: 2026-03-27*
*Ready for roadmap: yes*
