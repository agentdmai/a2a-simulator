# A2A Test Client

## What This Is

A dual-role Google A2A (Agent-to-Agent) protocol test client that acts as both an A2A server and client simultaneously. It provides a React-based web UI for configuring agent identity, connecting to remote agents, and exchanging messages with full task lifecycle support including SSE streaming. Designed to run two instances side-by-side from WebStorm run configurations for local agent-to-agent testing.

## Core Value

Enable rapid testing and debugging of A2A agent interactions by providing a visual, interactive tool that can both host and connect to A2A agents — with two instances testable against each other from a single IDE.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Single Node.js server serves both the A2A protocol endpoints and the React SPA
- [ ] Agent Card configuration via UI (name, description, skills, endpoint URL)
- [ ] Authentication support (API keys / auth tokens) for connecting to secured agents
- [ ] Connect to remote agents by entering their agent card URL or details
- [ ] Full A2A task lifecycle: create task, send messages, receive responses, get artifacts
- [ ] SSE streaming for real-time task status updates
- [ ] Chat-style interface showing incoming and outgoing messages with status indicators
- [ ] Message input for composing and sending messages to connected agents
- [ ] CLI args for port, agent name, and other config (maps to WebStorm run configurations)
- [ ] Two instances can run simultaneously on different ports and communicate with each other
- [ ] Uses Google's official a2a-node SDK

### Out of Scope

- Mobile app — desktop browser only
- Persistent storage / database — in-memory state is sufficient for testing
- Production deployment / Docker — this is a local dev/testing tool
- Multi-user / auth on the UI itself — single user per instance
- LLM integration — this is a protocol test tool, not an AI agent

## Context

- Google A2A is an open protocol for agent-to-agent communication (announced 2025)
- The official SDK is `a2a-node` on npm (github.com/google/a2a-node)
- A2A defines Agent Cards, Tasks, Messages, Artifacts, and streaming via SSE
- The user runs WebStorm and wants two run configurations (e.g., port 3000 and port 3001) to test agents talking to each other
- React SPA served by the same Node.js server that hosts A2A endpoints
- TypeScript preferred (a2a-node is TypeScript)

## Constraints

- **Stack**: Node.js + React SPA + Google a2a-node SDK
- **Architecture**: Single server process per instance (one port for both UI and A2A, or multiple ports if needed)
- **Runtime**: Must support two simultaneous instances via different CLI args
- **IDE**: CLI args must work as WebStorm run configuration parameters

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React SPA over vanilla HTML | Richer UI for task lifecycle visualization, streaming updates | — Pending |
| CLI args over config files | Maps directly to WebStorm run configurations, simpler for dev testing | — Pending |
| Single npm package | Both server and client in one project, run two instances for testing | — Pending |
| Google a2a-node SDK | Official SDK, maintained by Google, TypeScript support | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-27 after initialization*
