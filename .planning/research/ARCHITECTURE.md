# Architecture Research

**Domain:** A2A Protocol Test Client (dual-role agent client/server with React UI)
**Researched:** 2026-03-27
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
Instance A (port 3000)                    Instance B (port 3001)
┌──────────────────────────────┐          ┌──────────────────────────────┐
│         Express Server       │          │         Express Server       │
│                              │          │                              │
│  ┌────────────────────────┐  │          │  ┌────────────────────────┐  │
│  │    React SPA (static)  │  │          │  │    React SPA (static)  │  │
│  │  - Agent Card Config   │  │          │  │  - Agent Card Config   │  │
│  │  - Chat Interface      │  │          │  │  - Chat Interface      │  │
│  │  - Task Lifecycle View │  │          │  │  - Task Lifecycle View │  │
│  └────────┬───────────────┘  │          │  └────────┬───────────────┘  │
│           │ HTTP/WS          │          │           │ HTTP/WS          │
│  ┌────────┴───────────────┐  │          │  ┌────────┴───────────────┐  │
│  │   Internal API Layer   │  │          │  │   Internal API Layer   │  │
│  │  /api/config           │  │          │  │  /api/config           │  │
│  │  /api/connect          │  │          │  │  /api/connect          │  │
│  │  /api/send             │  │          │  │  /api/send             │  │
│  │  /api/tasks            │  │          │  │  /api/tasks            │  │
│  │  /api/events (SSE)     │  │          │  │  /api/events (SSE)     │  │
│  └────────┬───────────────┘  │          │  └────────┬───────────────┘  │
│           │                  │          │           │                  │
│  ┌────────┴───────────────┐  │  JSON-   │  ┌────────┴───────────────┐  │
│  │  A2A Server (inbound)  │◄─┼──RPC────┼──│  A2A Client (outbound) │  │
│  │  /.well-known/agent..  │  │          │  │  sendMessage()         │  │
│  │  JSON-RPC endpoint     │  │          │  │  sendMessageStream()   │  │
│  │  SSE streaming         │──┼──SSE────►┼──│  getTask()             │  │
│  └────────────────────────┘  │          │  └────────────────────────┘  │
│                              │          │                              │
│  ┌────────────────────────┐  │          │  ┌────────────────────────┐  │
│  │  In-Memory State       │  │          │  │  In-Memory State       │  │
│  │  - Agent Card config   │  │          │  │  - Agent Card config   │  │
│  │  - Task Store          │  │          │  │  - Task Store          │  │
│  │  - Connected agents    │  │          │  │  - Connected agents    │  │
│  └────────────────────────┘  │          │  └────────────────────────┘  │
└──────────────────────────────┘          └──────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Express Server | Single entry point: serves SPA, internal API, and A2A protocol endpoints on one port | Express.js with `@a2a-js/sdk/server/express` integration |
| React SPA | Agent card configuration UI, chat interface, task lifecycle visualization, connection management | Vite-built React app served as static files by Express |
| Internal API Layer | Bridge between React UI and server-side A2A logic; not part of A2A protocol | Express REST routes under `/api/*` plus SSE endpoint for UI updates |
| A2A Server (inbound) | Receives JSON-RPC calls from remote agents, manages task lifecycle, streams SSE responses | `A2AExpressApp` + `DefaultRequestHandler` + custom `AgentExecutor` from `@a2a-js/sdk` |
| A2A Client (outbound) | Sends messages to remote agents, subscribes to streaming responses, fetches agent cards | `A2AClient` from `@a2a-js/sdk/client` |
| In-Memory State | Stores agent card config, active tasks, connected agent details, conversation history | `InMemoryTaskStore` from SDK + custom state objects |

## Recommended Project Structure

```
a2a/
├── src/
│   ├── server/                 # Node.js server code
│   │   ├── index.ts            # Entry point: CLI args, Express setup, start
│   │   ├── app.ts              # Express app assembly (SPA + API + A2A routes)
│   │   ├── a2a-server.ts       # A2A inbound: AgentExecutor, request handler setup
│   │   ├── a2a-client.ts       # A2A outbound: connect to remote agents, send messages
│   │   ├── api-routes.ts       # Internal REST API for the React UI
│   │   ├── sse-bridge.ts       # SSE relay: forwards A2A events to UI clients
│   │   └── state.ts            # In-memory state management (agent card, tasks, connections)
│   └── client/                 # React SPA code
│       ├── main.tsx            # React entry point
│       ├── App.tsx             # Root component with layout
│       ├── components/
│       │   ├── AgentCardConfig.tsx   # Form to configure this instance's agent identity
│       │   ├── ConnectionPanel.tsx   # Connect to remote agents by URL
│       │   ├── ChatInterface.tsx     # Message thread display with streaming updates
│       │   ├── MessageInput.tsx      # Compose and send messages
│       │   ├── TaskStatus.tsx        # Task lifecycle state visualization
│       │   └── ArtifactViewer.tsx    # Display task artifacts
│       ├── hooks/
│       │   ├── useSSE.ts            # Subscribe to server-sent events from backend
│       │   ├── useApi.ts            # Internal API calls
│       │   └── useAgentConfig.ts    # Agent card state management
│       └── types/
│           └── index.ts             # Shared types for client-server contract
├── vite.config.ts              # Vite config with proxy for dev server
├── tsconfig.json               # TypeScript config (shared)
├── tsconfig.server.json        # Server-specific TS config (Node target)
├── package.json
└── dist/                       # Build output
    ├── server/                 # Compiled server JS
    └── client/                 # Vite-built SPA assets
```

### Structure Rationale

- **`src/server/`:** Clean separation of server concerns. Each file has a single responsibility. `a2a-server.ts` and `a2a-client.ts` are the dual-role heart of the architecture -- one handles inbound A2A protocol requests, the other makes outbound requests to remote agents.
- **`src/client/`:** Standard React SPA structure. Components map directly to the UI requirements (agent config, connection, chat, tasks). Hooks encapsulate the SSE subscription and API communication patterns.
- **`sse-bridge.ts`:** Critical glue component. When this instance's A2A server receives an inbound message from a remote agent, the SSE bridge pushes that event to the React UI in real-time. Without this, the UI would need to poll.
- **Single `package.json`:** Both server and client live in one package. Two instances run from the same codebase with different CLI args (port, agent name). This matches the WebStorm run configuration requirement.

## Architectural Patterns

### Pattern 1: Dual-Role Agent (Client + Server in One Process)

**What:** Each instance is simultaneously an A2A server (accepting inbound requests) and an A2A client (making outbound requests). The server side uses the SDK's `A2AExpressApp` and `AgentExecutor`. The client side uses `A2AClient` to connect to remote agents.

**When to use:** Always -- this is the core architecture of the test client. Every instance must both serve and consume the A2A protocol.

**Trade-offs:** Simple deployment (one process), but the AgentExecutor must bridge between the protocol layer and the UI. The executor does not call an LLM; it relays inbound messages to the UI and waits for the human user to respond.

**Example:**
```typescript
// a2a-server.ts - The AgentExecutor bridges protocol to UI
class UIBridgeExecutor implements AgentExecutor {
  constructor(private sseBridge: SSEBridge, private state: AppState) {}

  async execute(ctx: RequestContext, eventBus: IExecutionEventBus): Promise<void> {
    const taskId = ctx.task?.id || uuidv4();

    // Publish task as "input-required" -- waiting for human to reply via UI
    eventBus.publish({
      kind: 'status-update',
      taskId,
      contextId: ctx.userMessage.contextId || uuidv4(),
      status: {
        state: TaskState.InputRequired,
        message: ctx.userMessage,
        timestamp: new Date().toISOString(),
      },
      final: false,
    });

    // Push to UI via SSE bridge so the React chat shows the incoming message
    this.sseBridge.emit(taskId, ctx.userMessage);

    // Store task for later -- user will reply via the internal API
    this.state.pendingTasks.set(taskId, { eventBus, ctx });
  }
}
```

### Pattern 2: SSE Bridge (Protocol SSE to UI SSE)

**What:** Two separate SSE streams exist in this architecture. (1) A2A protocol SSE: streams between A2A servers over the network using the SDK's `sendMessageStream`. (2) UI SSE: streams from the Node.js backend to the React SPA running in the browser. The SSE Bridge component translates between these two streams.

**When to use:** Always. The React UI needs real-time updates when: a remote agent sends a streaming response, a remote agent sends a new message to this instance, or a task status changes.

**Trade-offs:** Adds a translation layer, but keeps the React client decoupled from A2A protocol details. The UI SSE is simpler (just events the UI cares about) while the protocol SSE follows the full A2A spec.

**Example:**
```typescript
// sse-bridge.ts
class SSEBridge {
  private clients: Map<string, express.Response[]> = new Map();

  // React UI connects to /api/events
  addClient(res: express.Response): void {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
    // Store response for broadcasting
  }

  // Called when A2A server receives inbound message or when
  // A2A client receives streaming response from remote agent
  emit(taskId: string, event: UIEvent): void {
    const data = JSON.stringify(event);
    // Broadcast to all connected UI clients
    for (const res of this.clients.values()) {
      res.forEach(r => r.write(`data: ${data}\n\n`));
    }
  }
}
```

### Pattern 3: Static SPA with API Proxy (Dev) / Static Serve (Prod)

**What:** In development, Vite runs its dev server with HMR and proxies `/api/*` and `/.well-known/*` requests to the Express backend. In production, Express serves the built SPA assets via `express.static()` and handles all routes on one port.

**When to use:** Always. This is how the single-port requirement is met.

**Trade-offs:** Dev requires running both Vite and Express (Vite proxies to Express), but production is a single process. Using Vite's proxy config keeps the dev experience fast with HMR while the Express server handles all A2A protocol concerns.

**Example:**
```typescript
// vite.config.ts (development)
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/.well-known': 'http://localhost:3000',
    }
  }
});

// app.ts (production)
app.use(express.static(path.join(__dirname, '../client')));
// A2A and API routes registered before this catch-all
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});
```

## Data Flow

### Flow 1: User Sends Message to Remote Agent (Outbound)

```
[React UI: MessageInput]
    │ POST /api/send { remoteUrl, text }
    ▼
[api-routes.ts]
    │ Creates MessageSendParams with uuid, role:"user", text part
    ▼
[a2a-client.ts: A2AClient.sendMessageStream()]
    │ JSON-RPC to remote agent's endpoint
    ▼
[Remote Agent's A2A Server]
    │ Returns SSE stream with TaskStatusUpdateEvent / TaskArtifactUpdateEvent
    ▼
[a2a-client.ts: iterates async stream]
    │ For each event: update state.tasks, forward to SSE bridge
    ▼
[sse-bridge.ts]
    │ SSE push to browser
    ▼
[React UI: ChatInterface updates in real-time]
```

### Flow 2: Remote Agent Sends Message to This Instance (Inbound)

```
[Remote A2A Client]
    │ JSON-RPC POST to this instance's endpoint
    ▼
[A2AExpressApp → DefaultRequestHandler]
    │ Validates request, creates/retrieves task
    ▼
[UIBridgeExecutor.execute()]
    │ Sets task to "input-required", stores pending task
    │ Pushes inbound message to SSE bridge
    ▼
[sse-bridge.ts → React UI]
    │ Chat shows new inbound message, prompts user to reply
    ▼
[User types reply in React UI]
    │ POST /api/reply { taskId, text }
    ▼
[api-routes.ts]
    │ Retrieves pending task's eventBus from state
    │ Publishes TaskStatusUpdateEvent with user's reply
    ▼
[DefaultRequestHandler → A2A SSE response to remote client]
```

### Flow 3: Agent Card Discovery

```
[React UI: ConnectionPanel]
    │ POST /api/connect { agentCardUrl }
    ▼
[a2a-client.ts]
    │ HTTP GET to remote /.well-known/agent-card.json
    ▼
[Remote Agent]
    │ Returns AgentCard JSON
    ▼
[state.ts: stores connected agent details]
    │ Returns agent card to UI
    ▼
[React UI: shows remote agent name, skills, capabilities]
```

### Key Data Flows

1. **Outbound messaging:** UI -> Internal API -> A2AClient -> Remote Agent -> SSE stream back -> SSE Bridge -> UI update. The A2A client handles the full JSON-RPC protocol; the UI only deals with simplified events.
2. **Inbound messaging:** Remote A2AClient -> This A2A Server -> UIBridgeExecutor -> SSE Bridge -> UI shows message -> User replies via Internal API -> EventBus publishes to A2A response stream.
3. **Agent card serving:** Remote agents discover this instance at `GET /.well-known/agent-card.json`. The card is dynamically generated from the current UI configuration stored in `state.ts`.

## Scaling Considerations

This is a local dev/testing tool, not a production service. Scaling is not a concern, but multi-instance support is.

| Concern | Approach |
|---------|----------|
| Two instances on one machine | CLI args: `--port 3000 --name "Agent A"` vs `--port 3001 --name "Agent B"`. Same codebase, different runtime config. |
| Dev server port conflicts | Vite dev server runs on port+1000 (e.g., 4000/4001) with proxy to Express. Or use a single `concurrently` setup. |
| State isolation | Each instance has its own in-memory state. No shared state between instances. |
| SSE connection limits | Browsers limit SSE connections per domain (~6). With two instances on different ports, this is not an issue. |

## Anti-Patterns

### Anti-Pattern 1: Embedding A2A Protocol Logic in React Components

**What people do:** Directly call remote A2A endpoints from the React SPA using fetch/axios, bypassing the server.
**Why it's wrong:** CORS issues (remote agents won't have CORS headers for your UI origin). The React app cannot serve A2A protocol endpoints. Leaks protocol complexity into UI code.
**Do this instead:** All A2A communication goes through the Express server. The React UI talks only to the Internal API (`/api/*`). The server handles all JSON-RPC, SSE protocol concerns, and relays simplified events to the UI.

### Anti-Pattern 2: Using WebSockets Instead of SSE for UI Updates

**What people do:** Set up WebSocket connections between React and Express for real-time updates.
**Why it's wrong:** Adds unnecessary complexity and a dependency (ws/socket.io). The communication is unidirectional (server -> UI for updates). SSE is simpler, works natively in browsers via `EventSource`, and matches the A2A protocol's own streaming mechanism.
**Do this instead:** Use native SSE (`EventSource` in browser, `res.write()` on server). For the rare bidirectional need (user sends reply), use a regular POST request.

### Anti-Pattern 3: Shared State Between Instances

**What people do:** Try to use a shared database or file for state between the two test instances.
**Why it's wrong:** Defeats the purpose of testing agent-to-agent communication. Each instance should be fully independent, communicating only via the A2A protocol.
**Do this instead:** Each instance owns its state completely in-memory. The only communication between instances is through A2A protocol messages over HTTP.

### Anti-Pattern 4: Blocking AgentExecutor

**What people do:** Make the `AgentExecutor.execute()` method block until the human user replies in the UI.
**Why it's wrong:** Ties up the Express request handler. If the user takes 30 seconds to reply, the HTTP connection to the remote agent hangs. May timeout.
**Do this instead:** The executor publishes `input-required` status immediately and returns. The pending task is stored with its `eventBus` reference. When the user replies via the Internal API, the reply is published through the stored eventBus asynchronously. For streaming connections, the remote client receives the status update and waits.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Remote A2A Agents | `A2AClient` from `@a2a-js/sdk` | JSON-RPC over HTTP(S). SSE for streaming. Discover via agent card URL. |
| Remote Agent Cards | HTTP GET to `/.well-known/agent-card.json` | Standard discovery endpoint. May require auth headers. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| React SPA <-> Express API | REST (`/api/*`) + SSE (`/api/events`) | UI never touches A2A protocol directly |
| Internal API <-> A2A Client | Direct function calls | Same process; api-routes.ts imports and calls a2a-client.ts |
| Internal API <-> A2A Server | Shared state + EventBus references | When user replies, API retrieves the stored eventBus and publishes |
| A2A Server <-> Remote Client | JSON-RPC + SSE (A2A protocol) | Handled entirely by `@a2a-js/sdk` |

### Build Order (Dependency Chain)

The following order reflects technical dependencies -- each layer builds on the previous:

1. **Server skeleton + CLI args** -- Express server that starts on a configurable port. No A2A yet.
2. **A2A Server (inbound)** -- Integrate `@a2a-js/sdk` server, serve agent card, handle JSON-RPC. Test with curl.
3. **A2A Client (outbound)** -- Connect to remote agents, send messages, consume responses. Two instances can now talk at the protocol level.
4. **SSE Bridge** -- Forward A2A events to browser clients via SSE.
5. **Internal API** -- REST endpoints for the React UI to configure agent card, connect to agents, send messages.
6. **React SPA** -- UI components consuming the Internal API and SSE stream. Agent config, connection panel, chat interface, task lifecycle display.

This order means the protocol layer is testable with curl/CLI before any UI exists, reducing debugging surface area.

## Sources

- [A2A Protocol Specification](https://a2a-protocol.org/latest/specification/) -- Official protocol spec (task lifecycle, JSON-RPC methods, SSE streaming)
- [A2A Streaming & Async Operations](https://a2a-protocol.org/latest/topics/streaming-and-async/) -- SSE event structure, resubscription, push notifications
- [a2a-js GitHub (Official SDK)](https://github.com/a2aproject/a2a-js) -- `@a2a-js/sdk` package structure, Express integration, client/server APIs
- [A2A JS SDK Tutorial](https://a2aprotocol.ai/blog/a2a-javascript-sdk) -- Complete code examples for server, client, executor, streaming
- [Google A2A Announcement](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/) -- Protocol overview and design philosophy

---
*Architecture research for: A2A Protocol Test Client*
*Researched: 2026-03-27*
