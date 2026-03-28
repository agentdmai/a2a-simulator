---
phase: 01-protocol-foundation
plan: 02
subsystem: api
tags: [a2a-sdk, express, json-rpc, agent-executor, human-in-the-loop]

# Dependency graph
requires:
  - phase: 01-protocol-foundation-01
    provides: "Express 5 server with CLI args, Agent Card, placeholder executor, AppState"
provides:
  - "UIBridgeExecutor implementing AgentExecutor for human-in-the-loop message handling"
  - "Reply handler with POST /api/reply and GET /api/pending endpoints"
  - "Full A2A message exchange loop: send -> input-required -> reply -> completed"
affects: [02-client-ui-streaming]

# Tech tracking
tech-stack:
  added: []
  patterns: ["UIBridgeExecutor publishes Task event then status-update for SDK ResultManager compatibility", "Reply handler publishes completed status-update with agent message via stored eventBus"]

key-files:
  created:
    - src/server/executor.ts
    - src/server/reply-handler.ts
  modified:
    - src/server/app.ts

key-decisions:
  - "Publish Task event before status-update so SDK ResultManager registers the task before processing status"
  - "JSON-RPC endpoint is at POST / (root), not /jsonrpc -- SDK's setupRoutes mounts handler at basePath root"
  - "Use blocking:false for message/send to get immediate response with input-required state"

patterns-established:
  - "UIBridgeExecutor pattern: publish Task event + input-required status-update, store eventBus for later reply"
  - "Reply handler pattern: lookup pending task, publish completed status-update via stored eventBus, delete from map"

requirements-completed: [CLNT-01, CLNT-02, CLNT-03, SRVR-01]

# Metrics
duration: 5min
completed: 2026-03-28
---

# Phase 01 Plan 02: A2A Client-Server Protocol Integration Summary

**UIBridgeExecutor with human-in-the-loop message exchange via JSON-RPC message/send, /api/pending, and /api/reply endpoints**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-28T01:31:03Z
- **Completed:** 2026-03-28T01:36:55Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- UIBridgeExecutor implements SDK AgentExecutor interface, sets incoming tasks to input-required state
- Reply handler provides GET /api/pending and POST /api/reply for human-in-the-loop interaction
- Full message exchange loop verified via curl: message/send -> input-required -> /api/pending -> /api/reply -> completed
- TypeScript compiles cleanly with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract UIBridgeExecutor and create reply handler** - `38d59ea` (feat)
2. **Task 2: Wire executor and reply routes into app, verify message exchange** - `8d0414d` (feat)

## Files Created/Modified
- `src/server/executor.ts` - UIBridgeExecutor class implementing AgentExecutor, publishes input-required status and stores pending tasks
- `src/server/reply-handler.ts` - Express router with POST /api/reply and GET /api/pending for human response flow
- `src/server/app.ts` - Updated to use UIBridgeExecutor and mount reply router (removed inline placeholder executor)

## Decisions Made
- Publish a Task event (kind: "task") before the status-update event so the SDK's ResultManager registers the task. Without this, ResultManager logs "unknown task" and the non-blocking response never resolves.
- JSON-RPC endpoint is at POST / (root path), not /jsonrpc. The SDK's A2AExpressApp.setupRoutes mounts the JSON-RPC handler at the basePath root.
- Use blocking:false in message/send configuration so the response returns immediately with the task in input-required state, rather than waiting for completion.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Publish Task event before status-update for SDK ResultManager**
- **Found during:** Task 2 (integration testing)
- **Issue:** SDK's ResultManager.processEvent ignores status-update events for unknown tasks. The non-blocking sendMessage response hung indefinitely because ResultManager never registered the task.
- **Fix:** UIBridgeExecutor now publishes a Task event (kind: "task") before the status-update event. This creates the task in ResultManager first.
- **Files modified:** src/server/executor.ts
- **Verification:** curl message/send returns JSON-RPC response with task in input-required state
- **Committed in:** 8d0414d (Task 2 commit)

**2. [Rule 1 - Bug] JSON-RPC endpoint path is / not /jsonrpc**
- **Found during:** Task 2 (integration testing)
- **Issue:** Plan specified curl to POST /jsonrpc but the SDK mounts the JSON-RPC handler at the root of the basePath (POST /). Requests to /jsonrpc returned 404.
- **Fix:** Used correct POST / path in verification. No code change needed -- this was a plan documentation issue.
- **Files modified:** None (verification path correction only)
- **Committed in:** N/A

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Task event publishing fix was essential for the non-blocking message flow. No scope creep.

## Issues Encountered
None beyond the deviations documented above.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all endpoints are fully wired with real data flow.

## Next Phase Readiness
- Full A2A protocol foundation complete: Agent Card, message/send, pending tasks, reply
- Ready for Phase 02: Client UI with React SPA and SSE streaming
- The UIBridgeExecutor pattern is validated and working for human-in-the-loop interaction

## Self-Check: PASSED

- src/server/executor.ts: FOUND
- src/server/reply-handler.ts: FOUND
- Commit 38d59ea: FOUND
- Commit 8d0414d: FOUND

---
*Phase: 01-protocol-foundation*
*Completed: 2026-03-28*
