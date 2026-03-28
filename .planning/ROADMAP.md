# Roadmap: A2A Test Client

## Overview

This roadmap delivers a dual-role A2A protocol test client in three phases: first the backend protocol layer (server + client) testable via curl, then the React SPA with client-mode UI and streaming, and finally the server-mode UI and polish that complete the dual-role differentiator. The backend-first approach isolates protocol bugs from UI bugs, following research recommendations.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Protocol Foundation** - Express server with A2A server and client protocol support, testable via curl between two instances (completed 2026-03-28)
- [ ] **Phase 2: Client UI and Streaming** - React SPA with chat interface, SSE streaming, connection panel, and task visualization
- [ ] **Phase 3: Server Mode and Completeness** - Incoming task management, response composer, auth, artifacts, and remaining protocol methods

## Phase Details

### Phase 1: Protocol Foundation
**Goal**: Two instances can exchange A2A messages at the protocol level without any UI
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, CLNT-01, CLNT-02, CLNT-03, SRVR-01
**Success Criteria** (what must be TRUE):
  1. Server starts on a CLI-specified port with agent name/description args, and serves an Agent Card at the well-known URL
  2. A second instance on a different port can connect to the first by URL and fetch its Agent Card
  3. Instance A can send a message to Instance B via message/send and receive a JSON-RPC response
  4. Both instances run simultaneously without port conflicts or shared state collisions
**Plans:** 2/2 plans complete

Plans:
- [x] 01-01-PLAN.md — Project scaffolding, Express server, CLI args, Agent Card serving
- [x] 01-02-PLAN.md — A2A client/server protocol integration (UIBridgeExecutor, message/send, reply handler, two-instance exchange)

### Phase 2: Client UI and Streaming
**Goal**: Users can visually interact with remote A2A agents through a chat interface with real-time streaming
**Depends on**: Phase 1
**Requirements**: CLNT-04, CLNT-05, UI-01, UI-02, UI-03, UI-05, UI-06, STRM-01, STRM-02, STRM-03
**Success Criteria** (what must be TRUE):
  1. User can enter a remote agent URL in a connection panel, connect, and see the remote agent's card details
  2. User can type and send messages in a chat interface and see responses rendered with sender, timestamp, and status
  3. Streaming messages from a remote agent render incrementally in real time via SSE
  4. User can view raw JSON-RPC request/response pairs for any message exchange
  5. Task state changes are reflected in real time with visual status badges
**Plans:** 3/3 plans complete

Plans:
- [x] 02-01-PLAN.md — Vite + React scaffold, server API routes (connect/send/events/task), SSE bridge, ConnectionContext, hooks, and connection panel
- [x] 02-02-PLAN.md — Chat components (MessageBubble, MessageInput, TaskThread, StatusBadge, JsonDrawer, StreamingIndicator), wired into App layout
- [x] 02-03-PLAN.md — Gap closure: Express 5 wildcard fix, streaming indicator lifecycle, raw JSON-RPC exchange pipeline

### Phase 3: Server Mode and Completeness
**Goal**: Users can act as a server-side agent (receiving and responding to tasks) with full protocol coverage including auth and artifacts
**Depends on**: Phase 2
**Requirements**: SRVR-02, SRVR-03, SRVR-04, SRVR-05, CLNT-06, CLNT-07, UI-04, AUTH-01, AUTH-02
**Success Criteria** (what must be TRUE):
  1. Incoming tasks from remote agents appear in a management panel with sender, status, and message history
  2. User can compose and send responses to incoming tasks, controlling task state transitions (working, input-required, completed, failed)
  3. User can edit their agent's name, description, and skills via the UI, with changes reflected immediately in the served Agent Card
  4. User can configure auth tokens for outgoing connections and set bearer token requirements for their own endpoint
  5. User can create/attach artifacts, cancel tasks, and resubscribe to SSE streams for existing tasks
**Plans**: TBD

Plans:
- [ ] 03-01: Server mode UI (incoming task panel, response composer, state control, artifacts)
- [ ] 03-02: Agent Card editor, authentication, and remaining protocol methods (cancel, resubscribe)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Protocol Foundation | 2/2 | Complete   | 2026-03-28 |
| 2. Client UI and Streaming | 3/3 | Complete | 2026-03-27 |
| 3. Server Mode and Completeness | 0/2 | Not started | - |
