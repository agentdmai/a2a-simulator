# Feature Landscape

**Domain:** A2A Protocol Test Client / Agent Debugging Tool
**Researched:** 2026-03-27

## Competitive Landscape

Two existing tools define the current feature baseline:

1. **A2A Inspector** (official, by a2aproject) -- Web-based, FastAPI + TypeScript frontend, Socket.IO sessions. Connects to one agent per session, validates protocol compliance, shows raw JSON-RPC messages. Read-only client (cannot act as a server).
2. **A2A Validation Tool** (community, by llmx-tech) -- Electron desktop app, multi-agent connections, session management, file attachments, config export/import. Also read-only client.

**Neither tool can act as an A2A server.** Neither supports dual-instance side-by-side testing where both sides are controllable. This is the core differentiator for our project.

---

## Table Stakes

Features users expect from any A2A protocol testing tool. Missing = tool feels broken or incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Connect to remote agent by URL | Both existing tools do this; it's the minimum useful action | Low | Resolve `.well-known/agent-card.json` from base URL |
| Agent Card display | Users need to see what agent they connected to -- name, skills, capabilities | Low | Parse and render AgentCard JSON |
| Agent Card validation | Inspector does this; without it we're worse than existing tools | Medium | Validate against A2A spec schema (required fields, types) |
| Send messages (message/send) | Core protocol interaction; useless without it | Medium | JSON-RPC 2.0 request, wait for Task/Message response |
| SSE streaming (message/stream) | A2A streaming is a primary interaction mode; not optional for a test tool | Medium | EventSource or fetch-based SSE consumption, render events incrementally |
| Task lifecycle visualization | Tasks are the core A2A unit; must show state transitions (submitted -> working -> completed/failed) | Medium | Status badges, state history, transition timestamps |
| Raw JSON-RPC message view | Both competitors have this; developers need to see the wire format | Low | Slide-out or tabbed panel showing request/response JSON |
| Chat-style message UI | Natural way to visualize message exchange; both competitors use this pattern | Medium | Message bubbles with sender, timestamp, status indicators |
| CLI args for port and config | Project requirement; maps to WebStorm run configurations | Low | `--port`, `--name`, `--description` flags via yargs or commander |
| Two instances on different ports | Project requirement; must not conflict on port, state, or identity | Low | Stateless architecture per instance, port from CLI |

---

## Differentiators

Features that set this tool apart. These don't exist in competing tools.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Dual-role: server AND client** | Act as both an A2A server (accepting connections) and client (initiating connections) simultaneously. Neither existing tool does this. | High | Single Node.js process serves A2A JSON-RPC endpoints + React SPA + acts as client |
| **Configurable Agent Card via UI** | Edit your agent's identity, skills, and capabilities in the UI; changes reflected immediately at `.well-known/agent-card.json` | Medium | Form-based editor, live-updates the served agent card |
| **Bidirectional agent-to-agent testing** | Run two instances, each acting as both server and client, talking to each other | Medium | The architecture enables this; UI shows both sent and received tasks |
| **Task response composer** | When acting as server and receiving a task, manually compose responses/artifacts through the UI (human-in-the-loop agent simulation) | High | Message editor + artifact builder + status control for incoming tasks |
| **Incoming task management panel** | See and manage tasks OTHER agents have sent TO you | Medium | Inbox-style view of received tasks with status, messages, ability to respond |
| **Artifact display and creation** | View artifacts from remote agents AND create artifacts when responding as a server | Medium | Support text, files, structured data; render inline or downloadable |
| **Authentication token management** | Configure auth tokens/API keys for outgoing connections AND set auth requirements for your own server endpoint | Medium | UI for setting bearer tokens, API keys; server-side middleware for validation |
| **Task state control (as server)** | Manually transition task states (working -> input-required -> completed) when acting as the server agent | Medium | Dropdown/buttons to set task status with optional status message |

---

## Anti-Features

Features to explicitly NOT build. These are traps.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| LLM/AI integration | This is a protocol test tool, not an AI agent. Adding LLM responses conflates testing the protocol with testing AI behavior. | Manual response composition. The user IS the agent. |
| Persistent database | Adds complexity without value for a testing tool. In-memory state resets cleanly between test sessions. | In-memory task store (a2a-js SDK provides `InMemoryTaskStore`) |
| gRPC transport support | A2A v0.3 added gRPC, but JSON-RPC over HTTP is the primary transport for testing/debugging. gRPC adds protobuf compilation complexity. | JSON-RPC + HTTP+JSON transports only. Add gRPC later if needed. |
| Multi-user / collaborative sessions | Testing tool runs locally per developer. Multi-user adds auth, session isolation, and deployment complexity. | Single user per instance. Run separate instances for separate developers. |
| Request collection/history persistence | Postman-style saved collections add significant UI and storage complexity. | Session-based history (in-memory). Export as JSON for sharing if needed later. |
| Automated test suites / assertions | Turns the tool from interactive debugger into a test framework. Different product entirely. | Keep it interactive. Developers use this alongside their actual test suites. |
| Docker / production deployment | This is a `npx`-style local dev tool, not a deployed service. | `npm start -- --port 3000` or WebStorm run config. |
| Agent-to-agent routing/orchestration | Building a gateway/router is a separate product. This tool tests point-to-point connections. | Direct connections only: Instance A <-> Instance B. |
| Push notification webhooks | The protocol supports webhooks for long-running tasks, but implementing a webhook receiver adds networking complexity (public URLs, tunneling). | SSE streaming covers the interactive testing use case. Document webhook testing as out of scope. |

---

## Feature Dependencies

```
CLI args (port, name) ─────────────────────┐
                                            ▼
                                    Server startup
                                            │
                            ┌───────────────┼───────────────┐
                            ▼               ▼               ▼
                     Agent Card         React SPA       A2A Endpoints
                     serving            serving         (JSON-RPC)
                     (.well-known)          │               │
                            │               │               │
                            ▼               ▼               ▼
                     Agent Card ◄──── Agent Card      Incoming task
                     config UI        display         handler
                                            │               │
                                            ▼               ▼
                                     Connect to        Incoming task
                                     remote agent      management panel
                                            │               │
                                            ▼               ▼
                                     Send message      Task response
                                     (message/send)    composer
                                            │               │
                                            ▼               ▼
                                     SSE streaming     Task state
                                     (message/stream)  control
                                            │
                                            ▼
                                     Task lifecycle
                                     visualization
                                            │
                                            ▼
                                     Artifact display
                                            │
                                            ▼
                                     Raw JSON-RPC
                                     message view
```

Key dependency chains:
- **Server infrastructure** must exist before any A2A endpoints or UI serving
- **Agent Card serving** must work before remote agents can discover you
- **Agent Card config UI** depends on both the SPA and the card serving endpoint
- **Connect to remote** must work before any message sending
- **message/send** should work before message/stream (simpler, easier to debug)
- **Incoming task handler** must exist before task response composer or state control
- **Artifact support** depends on task lifecycle being functional

---

## MVP Recommendation

### Phase 1: Core Infrastructure + Client Mode
Prioritize being a working A2A client first (matches existing tools):
1. CLI args, server startup, SPA serving
2. Agent Card serving with defaults from CLI args
3. Connect to remote agent, display their Agent Card
4. message/send with response display
5. Raw JSON-RPC message view
6. Chat-style message UI

### Phase 2: Streaming + Server Mode (Differentiators)
Add what makes this tool unique:
1. SSE streaming (message/stream) with incremental rendering
2. Task lifecycle visualization (state badges, history)
3. Incoming task handler (receive tasks from other agents)
4. Task response composer (manually reply as server)
5. Task state control

### Phase 3: Polish + Full Feature Set
Complete the experience:
1. Agent Card config UI (edit identity, skills in the UI)
2. Artifact display and creation
3. Authentication token management
4. Agent Card validation against spec

### Defer
- **gRPC transport**: Add only if user demand materializes. JSON-RPC covers testing needs.
- **Push notification webhooks**: Requires public URL or tunneling; SSE covers interactive use cases.
- **Config export/import**: Nice-to-have after core features work.

---

## Protocol Methods Coverage

The tool should support these A2A JSON-RPC methods:

| Method | Role: Client | Role: Server | Priority |
|--------|-------------|--------------|----------|
| `message/send` | Send message, get Task/Message back | Receive message, compose response | P0 (MVP) |
| `message/stream` | Send message, consume SSE stream | Receive message, stream response events | P1 |
| `tasks/get` | Fetch task state by ID | Serve task state by ID | P1 |
| `tasks/cancel` | Request task cancellation | Handle cancellation request | P2 |
| `tasks/resubscribe` | Re-subscribe to SSE for existing task | Serve SSE re-subscription | P2 |

---

## Sources

- [A2A Inspector - GitHub](https://github.com/a2aproject/a2a-inspector) -- Official debugging tool, feature baseline
- [A2A Inspector Deep Dive](https://a2aprotocol.ai/docs/guide/a2a-inspector) -- Detailed feature documentation
- [A2A Validation Tool - GitHub](https://github.com/llmx-tech/a2a-validation-tool) -- Community desktop tool, feature comparison
- [A2A Protocol Specification](https://a2a-protocol.org/latest/specification/) -- Protocol methods, task lifecycle, agent cards
- [A2A JS SDK - GitHub](https://github.com/a2aproject/a2a-js) -- Official JavaScript SDK, v0.3.0 support
- [awesome-a2a](https://github.com/ai-boost/awesome-a2a) -- Ecosystem overview
- [A2A Streaming & Async](https://a2a-protocol.org/latest/topics/streaming-and-async/) -- SSE and push notification details
- [Google A2A Announcement](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/) -- Protocol origin and design principles
- [A2A Protocol Upgrade Blog](https://cloud.google.com/blog/products/ai-machine-learning/agent2agent-protocol-is-getting-an-upgrade) -- v0.3 features (gRPC, signed cards)
