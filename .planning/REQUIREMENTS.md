# Requirements: A2A Test Client

**Defined:** 2026-03-27
**Core Value:** Enable rapid testing and debugging of A2A agent interactions with a dual-role visual tool

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Infrastructure

- [x] **INFRA-01**: Server starts with CLI args (--port, --name, --description) mappable to WebStorm run configurations
- [x] **INFRA-02**: Single Node.js/Express 5 server serves both A2A protocol endpoints and React SPA on one port
- [x] **INFRA-03**: Two instances can run simultaneously on different ports without conflicts
- [x] **INFRA-04**: Agent Card served at well-known URL, populated from CLI args and UI configuration

### Client Mode

- [x] **CLNT-01**: User can connect to a remote agent by entering its base URL or agent card URL
- [x] **CLNT-02**: Remote agent's Agent Card is fetched, validated, and displayed (name, description, skills, capabilities)
- [x] **CLNT-03**: User can send messages to connected agent via message/send (JSON-RPC)
- [x] **CLNT-04**: User can send streaming messages via message/stream with real-time SSE event rendering
- [x] **CLNT-05**: User can fetch task status by ID (tasks/get)
- [x] **CLNT-06**: User can cancel a task (tasks/cancel)
- [x] **CLNT-07**: User can resubscribe to SSE stream for existing task (tasks/resubscribe)

### Server Mode

- [x] **SRVR-01**: Instance acts as A2A server — receives incoming tasks from remote agents via JSON-RPC
- [x] **SRVR-02**: Incoming tasks appear in a management panel with status, sender, and message history
- [x] **SRVR-03**: User can manually compose and send responses to incoming tasks (human-in-the-loop)
- [x] **SRVR-04**: User can control task state transitions (working → input-required → completed/failed) with status messages
- [x] **SRVR-05**: User can create and attach artifacts when responding as server agent

### UI

- [x] **UI-01**: Chat-style interface showing incoming and outgoing messages with sender, timestamp, and status indicators
- [x] **UI-02**: Task lifecycle visualization with state badges and transition history
- [x] **UI-03**: Raw JSON-RPC message view for inspecting wire-format requests and responses
- [ ] **UI-04**: Agent Card configuration editor — edit own agent's name, description, skills; changes reflected immediately
- [x] **UI-05**: Connection panel for entering remote agent URL and viewing connection status
- [x] **UI-06**: Message input for composing and sending messages to connected agents

### Authentication

- [ ] **AUTH-01**: User can configure auth tokens/API keys for outgoing connections to secured agents
- [ ] **AUTH-02**: User can set auth requirements for own server endpoint (bearer token validation)

### Streaming

- [x] **STRM-01**: SSE streaming from remote agents renders events incrementally in the chat UI
- [x] **STRM-02**: Two-layer SSE architecture: protocol-level SSE (agent-to-agent) and UI-level SSE (server-to-browser)
- [x] **STRM-03**: SSE connections have proper lifecycle management (cleanup on disconnect, no memory leaks)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Protocol

- **ADV-01**: gRPC transport support
- **ADV-02**: Push notification webhook support
- **ADV-03**: Agent Card signature validation (signed cards)

### Productivity

- **PROD-01**: Session history export as JSON
- **PROD-02**: Config export/import for agent settings
- **PROD-03**: Automated protocol compliance test suite

## Out of Scope

| Feature | Reason |
|---------|--------|
| LLM/AI integration | Protocol test tool, not an AI agent — user IS the agent |
| Persistent database | In-memory state sufficient for testing; clean reset between sessions |
| Docker/production deployment | Local dev tool, run via npm start or WebStorm |
| Multi-user/collaborative sessions | Single user per instance; run separate instances per developer |
| Mobile app | Desktop browser only |
| Agent-to-agent routing/orchestration | Tests point-to-point connections, not a gateway |
| Request collection persistence | Session-based history; Postman-style collections are a different product |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1 | Complete |
| INFRA-02 | Phase 1 | Complete |
| INFRA-03 | Phase 1 | Complete |
| INFRA-04 | Phase 1 | Complete |
| CLNT-01 | Phase 1 | Complete |
| CLNT-02 | Phase 1 | Complete |
| CLNT-03 | Phase 1 | Complete |
| CLNT-04 | Phase 2 | Complete |
| CLNT-05 | Phase 2 | Complete |
| CLNT-06 | Phase 3 | Complete |
| CLNT-07 | Phase 3 | Complete |
| SRVR-01 | Phase 1 | Complete |
| SRVR-02 | Phase 3 | Complete |
| SRVR-03 | Phase 3 | Complete |
| SRVR-04 | Phase 3 | Complete |
| SRVR-05 | Phase 3 | Complete |
| UI-01 | Phase 2 | Complete |
| UI-02 | Phase 2 | Complete |
| UI-03 | Phase 2 | Complete |
| UI-04 | Phase 3 | Pending |
| UI-05 | Phase 2 | Complete |
| UI-06 | Phase 2 | Complete |
| AUTH-01 | Phase 3 | Pending |
| AUTH-02 | Phase 3 | Pending |
| STRM-01 | Phase 2 | Complete |
| STRM-02 | Phase 2 | Complete |
| STRM-03 | Phase 2 | Complete |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0

---
*Requirements defined: 2026-03-27*
*Last updated: 2026-03-27 after roadmap creation*
