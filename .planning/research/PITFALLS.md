# Pitfalls Research

**Domain:** A2A Protocol Test Client (dual-role agent server/client with React UI)
**Researched:** 2026-03-27
**Confidence:** MEDIUM-HIGH

## Critical Pitfalls

### Pitfall 1: SDK Package Identity Confusion (a2a-node vs @a2a-js/sdk)

**What goes wrong:**
The PROJECT.md references "Google's official a2a-node SDK" and `a2a-node` on npm. However, the official SDK has been reorganized under the `a2aproject` GitHub organization as `@a2a-js/sdk` (npm package `@a2a-js/sdk`), not `a2a-node`. Installing the wrong package or an outdated version leads to missing APIs, incompatible types, and wasted debugging time.

**Why it happens:**
The A2A protocol ecosystem moved rapidly through 2025-2026. Google initially hosted the repo at `google/A2A` and `google-a2a/A2A`, then transitioned to `a2aproject/a2a-js`. Blog posts and tutorials reference different package names depending on when they were written.

**How to avoid:**
- Verify the correct package name from the official repo (https://github.com/a2aproject/a2a-js) before installing
- Use `@a2a-js/sdk` as the npm package (currently at protocol spec v0.3.0)
- Pin the exact version in package.json to avoid surprise breaking changes in this fast-moving SDK

**Warning signs:**
- Import paths don't resolve
- TypeScript types don't match protocol documentation
- `/.well-known/agent.json` vs `/.well-known/agent-card.json` endpoint mismatch

**Phase to address:**
Phase 1 (project setup). Verify the correct SDK package before writing any code.

---

### Pitfall 2: Task State Machine Violations

**What goes wrong:**
Sending messages to tasks in terminal states (completed, canceled, rejected, failed) causes protocol errors. Mishandling the `input-required` state -- treating it as terminal or ignoring it -- breaks the conversational flow. Not implementing `auth-required` state handling leaves agents stuck.

**Why it happens:**
Developers implement the "happy path" (submitted -> working -> completed) and forget that A2A tasks have 7 states with strict transition rules. Terminal states are immutable -- you cannot restart or append to them. The `input-required` state is a special "interrupted" state that pauses the stream and requires the client to send a new message to resume.

**How to avoid:**
- Implement a proper state machine for task lifecycle, not ad-hoc status string checks
- Map all 7 states: submitted, working, input-required, auth-required, completed, failed, canceled, rejected
- Distinguish terminal states (completed, failed, canceled, rejected) from interrupted states (input-required, auth-required)
- Display state transitions visually in the UI so testers can observe the lifecycle

**Warning signs:**
- Tasks getting "stuck" in working state with no way to recover
- `TaskNotFoundError` responses when trying to continue conversations
- UI showing stale task status after the remote agent has moved on

**Phase to address:**
Phase 2 (core protocol implementation). The task state machine is the backbone of A2A -- get it right before building UI around it.

---

### Pitfall 3: SSE Stream Lifecycle Mismanagement

**What goes wrong:**
SSE connections leak memory on the server when clients disconnect without cleanup. On the React client side, `EventSource` connections persist after component unmount, causing memory leaks and ghost event handlers that update unmounted components. Streams that drop mid-task leave the client in an inconsistent state with no recovery path.

**Why it happens:**
SSE connections are long-lived and stateful, which conflicts with React's component lifecycle. Express does not automatically detect client disconnection -- you must listen for the `close` event on the response object. The browser's native `EventSource` API auto-reconnects on failure, which can cause duplicate subscriptions if not managed carefully.

**How to avoid:**
- Server: Listen for `req.on('close')` to clean up SSE connections and remove them from active client tracking
- Server: Send keep-alive comments (`:\n\n`) every 15-30 seconds to detect dead connections
- Client: Use `useRef` for EventSource instances, never `useState`
- Client: Always call `eventSource.close()` in useEffect cleanup
- Client: Use `@microsoft/fetch-event-source` instead of native `EventSource` for better error handling and POST support (A2A uses POST for streaming, which native EventSource does not support)
- Implement `SubscribeToTask` as a reconnection mechanism when streams drop

**Warning signs:**
- Node.js process memory growing steadily during testing
- "EventEmitter memory leak detected" warnings in console
- React "Can't perform a React state update on an unmounted component" warnings
- Tasks appearing stuck in "working" state after closing the browser tab

**Phase to address:**
Phase 3 (SSE streaming implementation). This should be a dedicated phase with explicit connection lifecycle testing.

---

### Pitfall 4: Native EventSource Cannot POST (A2A Requires POST for Streaming)

**What goes wrong:**
Developers reach for the browser's native `EventSource` API for SSE, but A2A's `SendStreamingMessage` method uses HTTP POST with a JSON-RPC body. Native `EventSource` only supports GET requests. The streaming simply does not work.

**Why it happens:**
Most SSE tutorials and examples use the native `EventSource` API with GET endpoints. Developers assume SSE means `new EventSource(url)` and discover too late that A2A streams require POST bodies containing the message payload.

**How to avoid:**
- Use `@microsoft/fetch-event-source` (or similar library) which supports POST, custom headers, and request bodies while still parsing SSE format
- Alternatively, use the `@a2a-js/sdk` client which handles transport details internally
- Design the client-side streaming layer around `fetch` with manual SSE parsing if avoiding dependencies

**Warning signs:**
- Streaming endpoint returns data but client receives nothing
- Native EventSource connects but no events fire
- "Method not allowed" or empty response bodies

**Phase to address:**
Phase 1 (architecture/tech selection). Choose the SSE client library before implementation begins.

---

### Pitfall 5: Agent Card Endpoint and Schema Mismatches

**What goes wrong:**
The agent card is served at the wrong URL, has missing required fields, or declares capabilities the agent does not actually support. Remote agents fail to discover or connect because they expect `/.well-known/agent.json` (SDK default) while code serves at a different path. Capability declarations (streaming, pushNotifications) that are false or missing cause clients to attempt unsupported operations.

**Why it happens:**
The agent card well-known URL has changed across protocol versions. The SDK tutorial mentions `/.well-known/agent.json` while the protocol spec references `/.well-known/agent-card.json`. Fields like `capabilities.streaming` default differently depending on SDK version. Developers fill in minimal card data during prototyping and never update capabilities to match actual implementation.

**How to avoid:**
- Verify the well-known URL the SDK version you use actually serves (check `setupRoutes()` behavior)
- Always set `capabilities.streaming: true` only after streaming is actually implemented and tested
- Include a card validation step in the connection flow -- fetch your own agent card and verify it parses correctly
- Make the agent card configurable via the UI (as the project requires) but validate all required fields before serving

**Warning signs:**
- 404 when fetching agent card from the other instance
- Remote agent connects but immediately errors on first streaming attempt
- "UnsupportedOperationError" responses from agents that should support the operation

**Phase to address:**
Phase 2 (agent card and server setup). Validate the card schema against the protocol spec before implementing task handling.

---

### Pitfall 6: Port and Endpoint Confusion in Dual-Instance Testing

**What goes wrong:**
Two instances on different ports (e.g., 3000 and 3001) accidentally reference themselves instead of the remote agent, creating a self-loop. Or the agent card URL served by instance A still points to localhost:3000 while instance B tries to connect to it, resulting in instance B talking to itself if it is also on port 3000.

**Why it happens:**
The agent card's `url` field (the endpoint URL for the A2A server) must match the actual listening port. When this is configured via UI, users may enter the wrong URL. When configured via CLI, the agent card URL must be dynamically set based on the port argument. Hardcoded URLs or defaults that don't account for the port argument create subtle routing bugs.

**How to avoid:**
- Auto-populate the agent card's `url` field from the server's actual listening address and port
- Display the agent card URL prominently in the UI so the user can verify and copy it
- Add a self-connection guard: reject or warn if a client attempts to connect to its own agent card URL
- Use CLI args that explicitly set both the port and the advertised URL: `--port 3001 --url http://localhost:3001`

**Warning signs:**
- Both instances showing identical agent names/descriptions
- Messages appearing to send successfully but never arriving at the other instance
- Task IDs not found on the remote agent (because the request went to self)

**Phase to address:**
Phase 2 (server setup and CLI args). The port/URL binding must be correct from the start.

---

### Pitfall 7: Context ID and Task ID Confusion

**What goes wrong:**
Mixing up `contextId` and `taskId` causes the remote agent to reject messages with mismatched IDs. Creating new tasks when intending to continue a conversation (or vice versa) breaks message threading. Client-generated task IDs are rejected -- only the server generates task IDs.

**Why it happens:**
A2A uses two distinct identifiers: `taskId` (server-generated, identifies a unit of work) and `contextId` (groups related tasks into a conversation). The spec states that clients MUST NOT provide taskIds for new tasks -- only the server assigns them. But clients CAN provide `contextId` to group tasks. These subtleties are easy to miss.

**How to avoid:**
- Never generate task IDs on the client side; always use server-returned task IDs
- Generate and track `contextId` on the client to maintain conversation threading
- Validate that `contextId` matches when sending follow-up messages to existing tasks
- Display both IDs in the UI for debugging purposes

**Warning signs:**
- `TaskNotFoundError` when sending messages to tasks that should exist
- Conversations appearing fragmented -- each message creates a new unrelated task
- Error responses about contextId/taskId mismatch

**Phase to address:**
Phase 2 (task lifecycle implementation). ID management is foundational to correct protocol behavior.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skipping task state validation | Faster initial implementation | Protocol violations, stuck tasks, impossible-to-debug state | Never -- state machine is cheap to implement upfront |
| Hardcoded agent card | Quick first demo | Cannot test different configurations, blocks UI-based config | First hour of prototyping only, replace immediately |
| No SSE cleanup on disconnect | Less server code | Memory leaks during extended testing sessions | Never -- leaks accumulate quickly with two instances |
| Storing all messages in a flat array | Simple data model | Cannot reconstruct conversation threads, no task grouping | MVP only -- restructure before streaming phase |
| Ignoring `historyLength` parameter | Less request parsing | Sends excessive data over wire, breaks large conversations | MVP, but implement before performance testing |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| @a2a-js/sdk Express integration | Adding A2A routes before body-parser/CORS middleware | Ensure `express.json()` and CORS middleware are registered before `setupRoutes()` |
| @a2a-js/sdk InMemoryTaskStore | Assuming task store persists across server restarts | Document that in-memory store is ephemeral; display warning in UI when tasks are lost |
| Agent Card fetch (client side) | Using `fetch()` without error handling for network failures | Wrap in try/catch, handle CORS errors (common when connecting to external agents), show clear error in UI |
| SSE with Express behind proxy | Proxy buffers SSE responses, killing real-time updates | Set `X-Accel-Buffering: no` header, disable compression for SSE endpoints, configure `res.flushHeaders()` |
| Dual-instance communication | Both instances using same default agent name | CLI args must set distinct names; UI should prominently show "this agent's identity" |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Unbounded message history in task objects | Sluggish UI, growing memory usage | Use `historyLength` parameter, paginate message display | After ~50 messages in a single task |
| SSE connections never closed on completed tasks | File descriptor exhaustion, EventEmitter warnings | Close stream on terminal state, implement server-side timeout | After ~100 completed tasks without page refresh |
| Re-rendering entire chat on each SSE event | UI jank, dropped frames during streaming | Memoize message list, only append new messages, use React.memo | During rapid streaming (multiple events/second) |
| Fetching agent card on every message send | Unnecessary latency, wasted bandwidth | Cache agent card after first successful fetch, refresh only on error | Not a scaling issue but adds 50-200ms per operation |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Serving agent card with capabilities you have not implemented | Remote agents attempt unsupported operations, get cryptic errors | Only advertise capabilities that are fully implemented and tested |
| No input validation on message parts | Oversized payloads or malformed JSON crash the server | Validate message part schema and enforce payload size limits (e.g., 1MB max) |
| Auth tokens in agent card URL parameters | Tokens visible in logs, browser history, agent card fetches | Use HTTP headers for authentication, never URL parameters |
| No CORS restriction on A2A endpoints | Any webpage can interact with your local test agent | Configure CORS to allow only known origins (the two test instance URLs) |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Not showing task state transitions | User does not know if task is working, waiting for input, or failed | Display a state badge on each task that updates in real-time via SSE |
| No visual distinction between sent and received messages | Confusion about message direction in dual-agent testing | Use left/right alignment or color coding for user vs agent messages |
| Hiding error details from protocol responses | User sees "Error" with no debugging information | Show full JSON-RPC error code and message, with option to view raw response |
| No connection status indicator | User sends messages not knowing the remote agent is unreachable | Show connected/disconnected status with last-seen timestamp |
| Streaming text appearing all at once | Feels like polling, not streaming; defeats purpose of SSE | Render artifact chunks incrementally as they arrive via `append` events |

## "Looks Done But Isn't" Checklist

- [ ] **Agent Card:** Often missing `capabilities` block -- verify streaming/push declarations match actual implementation
- [ ] **Task Lifecycle:** Often missing `input-required` state handling -- verify you can resume a task after agent asks for more info
- [ ] **SSE Streaming:** Often missing stream cleanup -- verify server memory is stable after 20+ completed streaming tasks
- [ ] **Error Handling:** Often missing protocol error codes -- verify `TaskNotFoundError`, `UnsupportedOperationError`, etc. return proper JSON-RPC error responses
- [ ] **Dual Instance:** Often missing port-aware agent card URL -- verify instance A's card URL actually points to instance A, not a hardcoded default
- [ ] **Message Threading:** Often missing `contextId` propagation -- verify sending multiple messages to the same agent maintains conversation context
- [ ] **Task Cancellation:** Often missing entirely -- verify `cancelTask` works and transitions task to canceled state with stream closure
- [ ] **CLI Args:** Often missing validation -- verify `--port` actually changes both the server listener AND the agent card URL

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Wrong SDK package | LOW | Uninstall wrong package, install `@a2a-js/sdk`, update imports |
| Task state machine bugs | MEDIUM | Refactor to explicit state machine pattern, add transition validation |
| SSE memory leaks | MEDIUM | Add connection tracking Map, implement cleanup handlers, restart server |
| Native EventSource used for POST streams | MEDIUM | Replace with fetch-event-source library, refactor streaming hooks |
| Agent card URL hardcoded | LOW | Extract to CLI arg / environment variable, auto-derive from port |
| Context/Task ID confusion | HIGH | Requires rethinking data model; add ID tracking layer between UI and protocol |
| Port self-loop | LOW | Add self-connection guard, fix URL derivation from port arg |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| SDK package confusion | Phase 1 (Setup) | Correct import resolves; TypeScript types match protocol spec |
| Task state violations | Phase 2 (Core Protocol) | All 7 states handled; terminal states reject new messages with proper error |
| SSE stream lifecycle | Phase 3 (Streaming) | Memory stable after 50 task completions; no EventEmitter warnings |
| EventSource POST limitation | Phase 1 (Architecture) | Streaming works with POST body containing message payload |
| Agent card mismatches | Phase 2 (Server Setup) | Card fetched from well-known URL matches declared capabilities |
| Port/URL confusion | Phase 2 (CLI/Server) | Two instances on different ports show different card URLs; cross-connect works |
| Context/Task ID confusion | Phase 2 (Task Lifecycle) | Multi-message conversations maintain thread; follow-up messages reference correct IDs |

## Sources

- [A2A Protocol Specification](https://a2a-protocol.org/latest/specification/) -- task states, error codes, capability requirements
- [A2A Streaming and Async Operations](https://a2a-protocol.org/latest/topics/streaming-and-async/) -- SSE format, reconnection, stream lifecycle
- [A Security Engineer's Guide to the A2A Protocol (Semgrep)](https://semgrep.dev/blog/2025/a-security-engineers-guide-to-the-a2a-protocol/) -- agent card spoofing, token lifetime, prompt injection
- [a2a-js SDK Repository](https://github.com/a2aproject/a2a-js) -- package name, API surface, Express integration
- [A2A JS SDK Tutorial (DEV Community)](https://dev.to/czmilo/a2a-js-sdk-complete-tutorial-quick-start-guide-41d2) -- executor pattern, event bus, common setup mistakes
- [Express SSE Memory Leak Issue #2248](https://github.com/expressjs/express/issues/2248) -- connection cleanup requirements
- [A2A Protocol Upgrade Announcement (Google Cloud Blog)](https://cloud.google.com/blog/products/ai-machine-learning/agent2agent-protocol-is-getting-an-upgrade) -- protocol evolution, breaking changes
- [Improving A2A Protocol Security (arxiv)](https://arxiv.org/html/2505.12490v3) -- data protection, consent flow gaps

---
*Pitfalls research for: A2A Protocol Test Client*
*Researched: 2026-03-27*
