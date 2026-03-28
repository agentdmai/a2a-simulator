---
phase: 02-client-ui-and-streaming
plan: 01
subsystem: ui
tags: [react, vite, tailwindcss, sse, a2a-sdk, express, eventsource]

# Dependency graph
requires:
  - phase: 01-protocol-foundation
    provides: Express server with A2A SDK routes, UIBridgeExecutor, agent card builder
provides:
  - Vite + React SPA shell with Tailwind CSS and split-panel layout
  - Server-side API routes (connect/disconnect/send/task/events)
  - SSEBridge relaying A2A protocol events to browser clients
  - A2AClientManager wrapping SDK ClientFactory for outbound connections
  - ConnectionContext with useReducer for client state management
  - useSSE hook with exponential backoff reconnect
  - ConnectionPanel UI with agent card display
affects: [02-02-PLAN, chat-ui, streaming]

# Tech tracking
tech-stack:
  added: [react@19, react-dom@19, vite@8, tailwindcss@4, @vitejs/plugin-react@6, @tailwindcss/vite@4, lucide-react@1]
  patterns: [split-panel layout, useReducer context pattern, SSE with backoff, REST API hooks]

key-files:
  created:
    - vite.config.ts
    - index.html
    - tsconfig.client.json
    - src/client/main.tsx
    - src/client/App.tsx
    - src/client/index.css
    - src/client/vite-env.d.ts
    - src/client/types/index.ts
    - src/client/context/ConnectionContext.tsx
    - src/client/hooks/useSSE.ts
    - src/client/hooks/useApi.ts
    - src/client/hooks/useRelativeTime.ts
    - src/client/components/ConnectionPanel.tsx
    - src/client/components/AgentCardDisplay.tsx
    - src/client/components/ConnectionStatus.tsx
    - src/client/components/ReconnectBanner.tsx
    - src/server/a2a-client.ts
    - src/server/sse-bridge.ts
    - src/server/api-routes.ts
  modified:
    - package.json
    - tsconfig.json
    - src/server/app.ts
    - src/server/agent-card.ts

key-decisions:
  - "Defined StreamEventData type locally since A2AStreamEventData is not publicly exported from @a2a-js/sdk"
  - "Added vite-env.d.ts for Vite client type declarations (CSS module imports)"
  - "express.json() middleware moved before SDK routes for consistent body parsing"

patterns-established:
  - "Split-panel layout: w-80 left panel + flex-1 right panel"
  - "useReducer + Context for connection state management"
  - "SSE reconnect with exponential backoff [1s, 2s, 4s] and maxRetries=5"
  - "REST API hooks returning typed responses via useApi()"
  - "SDK subpath imports: @a2a-js/sdk/client for ClientFactory"

requirements-completed: [CLNT-04, CLNT-05, STRM-01, STRM-02, STRM-03, UI-05]

# Metrics
duration: 6min
completed: 2026-03-28
---

# Phase 2 Plan 1: Client UI Foundation Summary

**Vite + React SPA shell with connection panel, SSE bridge, and A2A client manager for remote agent connectivity**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-28T02:10:40Z
- **Completed:** 2026-03-28T02:17:00Z
- **Tasks:** 3
- **Files modified:** 23

## Accomplishments
- Full Vite + React + Tailwind CSS build pipeline with dev proxy to Express backend
- Server-side A2AClientManager, SSEBridge, and REST API routes for connect/disconnect/send/task/events
- Client-side ConnectionContext with useReducer, useSSE with exponential backoff, useApi REST hooks
- ConnectionPanel with URL input, connect/disconnect buttons, AgentCardDisplay, ConnectionStatus indicator, and ReconnectBanner

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies and scaffold Vite + React shell** - `af11b6c` (feat)
2. **Task 2: Create server-side API routes, SSE bridge, and A2A client manager** - `72b9d74` (feat)
3. **Task 3: Create client types, ConnectionContext, hooks, and connection panel components** - `4d1da40` (feat)

## Files Created/Modified
- `vite.config.ts` - Vite config with React, Tailwind plugins and /api proxy
- `index.html` - Vite entry point
- `tsconfig.client.json` - Browser TypeScript config with JSX support
- `src/client/main.tsx` - React entry point
- `src/client/App.tsx` - Root component with ConnectionProvider, SSE wiring, split-panel layout
- `src/client/index.css` - Tailwind CSS import
- `src/client/types/index.ts` - All client TypeScript types (ConnectionStatus, TaskState, AgentCardInfo, etc.)
- `src/client/context/ConnectionContext.tsx` - React Context + useReducer for connection state
- `src/client/hooks/useSSE.ts` - EventSource hook with exponential backoff reconnect
- `src/client/hooks/useApi.ts` - REST API hooks (connect, disconnect, sendMessage, getTask)
- `src/client/hooks/useRelativeTime.ts` - Relative timestamp formatter ("2m ago")
- `src/client/components/ConnectionPanel.tsx` - Left panel with URL input, connect/disconnect, agent card
- `src/client/components/AgentCardDisplay.tsx` - Agent card rendering (name, skills, capabilities)
- `src/client/components/ConnectionStatus.tsx` - Color-coded status dot indicator
- `src/client/components/ReconnectBanner.tsx` - SSE reconnect/failed banner
- `src/server/a2a-client.ts` - A2AClientManager wrapping SDK ClientFactory
- `src/server/sse-bridge.ts` - SSEBridge with heartbeat and stream relay
- `src/server/api-routes.ts` - REST API router for SPA backend
- `src/server/app.ts` - Updated with API router, SSEBridge, static file serving
- `src/server/agent-card.ts` - Updated streaming capability to true

## Decisions Made
- Defined `StreamEventData` type locally as union `Message | Task | TaskStatusUpdateEvent | TaskArtifactUpdateEvent` because `A2AStreamEventData` is not publicly exported from `@a2a-js/sdk`
- Added `vite-env.d.ts` with Vite client type reference to resolve CSS import type errors
- Moved `express.json()` middleware before SDK routes in app.ts for consistent body parsing across all endpoints

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] A2AStreamEventData type not exported from SDK**
- **Found during:** Task 2 (A2A client manager)
- **Issue:** Plan imported `A2AStreamEventData` from `@a2a-js/sdk` but it is not publicly exported
- **Fix:** Defined local `StreamEventData` type as equivalent union type from SDK source
- **Files modified:** src/server/a2a-client.ts, src/server/sse-bridge.ts
- **Verification:** `tsc --noEmit` passes with no errors
- **Committed in:** 72b9d74 (Task 2 commit)

**2. [Rule 3 - Blocking] CSS import type error in tsconfig.client.json**
- **Found during:** Task 3 (client compilation verification)
- **Issue:** `import './index.css'` in main.tsx caused TS2882 without Vite client type declarations
- **Fix:** Added `src/client/vite-env.d.ts` with `/// <reference types="vite/client" />`
- **Files modified:** src/client/vite-env.d.ts
- **Verification:** `tsc --noEmit -p tsconfig.client.json` passes cleanly
- **Committed in:** 4d1da40 (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary for TypeScript compilation. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## Known Stubs
None -- all components are wired to real data sources or produce correct empty states.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- SPA shell ready for Plan 02's chat UI components (MessageBubble, MessageInput, ChatPanel, JsonDrawer, TaskThread)
- SSE pipeline operational end-to-end: server bridge relays A2A events to browser EventSource
- ConnectionContext available for chat components to consume connection/task state
- API hooks ready for sending messages and fetching tasks

---
*Phase: 02-client-ui-and-streaming*
*Completed: 2026-03-28*
