<!-- GSD:project-start source:PROJECT.md -->
## Project

**A2A Test Client**

A dual-role Google A2A (Agent-to-Agent) protocol test client that acts as both an A2A server and client simultaneously. It provides a React-based web UI for configuring agent identity, connecting to remote agents, and exchanging messages with full task lifecycle support including SSE streaming. Designed to run two instances side-by-side from WebStorm run configurations for local agent-to-agent testing.

**Core Value:** Enable rapid testing and debugging of A2A agent interactions by providing a visual, interactive tool that can both host and connect to A2A agents — with two instances testable against each other from a single IDE.

### Constraints

- **Stack**: Node.js + Express 5 + React 19 + Vite 8 + @a2a-js/sdk
- **Architecture**: Single server process per instance (one port for both UI and A2A, or multiple ports if needed)
- **Runtime**: Must support two simultaneous instances via different CLI args
- **IDE**: CLI args must work as WebStorm run configuration parameters
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Important Clarification: a2a-node vs @a2a-js/sdk
## Recommended Stack
### A2A Protocol SDK
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @a2a-js/sdk | ^0.3.10 | A2A protocol client and server | Official SDK from A2A project (Google-originated). Implements A2A spec v0.3.0. Provides `A2AExpressApp`, `A2AClient`, `InMemoryTaskStore`, `DefaultRequestHandler`, agent card serving, JSON-RPC and REST transports. 88+ dependents on npm. |
- **Server:** `AgentExecutor` interface, `DefaultRequestHandler`, `A2AExpressApp` (Express route builder), `InMemoryTaskStore`, `ExecutionEventBus`
- **Client:** `A2AClient` class, `ClientFactory.createFromUrl()`
- **Types:** `AgentCard`, `Message`, `Task`, `TaskStatusUpdateEvent`, `TaskArtifactUpdateEvent`
- **Transports:** JSON-RPC, HTTP+JSON/REST, gRPC (all supported client+server)
- **Express integration:** `agentCardHandler()`, `jsonRpcHandler()`, `restHandler()` from `@a2a-js/sdk/server/express`
### Web Framework (Backend)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Express | ^5.2 | HTTP server for A2A endpoints + SPA serving | @a2a-js/sdk has first-class Express integration (`A2AExpressApp`). Express 5 is now the stable default on npm (since March 2025). No reason to fight the SDK's built-in framework support. SSE works natively via `res.write()`. |
### Frontend Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React | ^19 | SPA UI for agent configuration, chat, task monitoring | Project requirement. React 19 is current stable. |
| Vite | ^8 | Dev server, build tool, HMR | Current standard for React SPAs in 2026. Vite 8 uses Rolldown bundler and Oxc compiler. Lightning fast HMR. Dev proxy to Express backend. |
| @vitejs/plugin-react | ^6 | React Fast Refresh in Vite | Uses Oxc for React Refresh transform. Pairs with Vite 8. |
### TypeScript Tooling
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| TypeScript | ^5.7 | Type safety across frontend + backend | @a2a-js/sdk is written in TypeScript. Shared types between client/server eliminate protocol mismatches. |
| tsx | ^4 | Run TypeScript server directly (dev mode) | Zero-config TS execution for Node.js. No separate compile step during development. Faster iteration than tsc + node. |
| @types/express | ^5 | Express type definitions | Required for Express 5 TypeScript support. |
### CLI Argument Parsing
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| commander | ^13 | Parse CLI args (port, agent name, etc.) | 35M+ weekly downloads. Lightweight, excellent TypeScript support. Maps cleanly to WebStorm run configuration parameters. Simpler than yargs for this use case (no subcommands needed). |
### State Management (Frontend)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| zustand | ^5 | Client-side state (agent config, UI state, connection status) | Tiny (~1KB), zero boilerplate, works great with React 19. No providers/context wrappers needed. Perfect for a tool with modest state needs. |
### UI Components
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | ^4 | Utility-first styling | Fast to build chat UIs and forms. No component library dependency. Vite has native PostCSS support. |
### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| eventsource | ^3 | SSE client for Node.js | If @a2a-js/sdk's client doesn't handle SSE natively; for streaming task updates from remote agents |
| uuid | ^11 | Generate unique task/message IDs | For creating A2A message and task identifiers |
| cors | ^2 | CORS middleware for Express | Only needed if frontend dev server and Express run on different ports during development |
## Project Structure
## Dev/Production Architecture
### Development
- Vite dev server on port 5173 (default) serves React with HMR
- Express server on port 3000 (configurable via CLI) serves A2A endpoints
- Vite `server.proxy` forwards `/a2a/*` and `/.well-known/*` requests to Express
- Run with: `tsx src/server/index.ts --port 3000 --name "Agent Alpha"`
### Production (Local Build)
- `vite build` outputs to `dist/`
- Express serves `dist/` as static files AND A2A endpoints on same port
- Run with: `node dist/server/index.js --port 3000 --name "Agent Alpha"`
### Two-Instance Testing
- Instance 1: `--port 3000 --name "Agent Alpha"`
- Instance 2: `--port 3001 --name "Agent Beta"`
- Each instance is both server (hosts its own A2A endpoints) and client (connects to the other)
## Alternatives Considered
| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| A2A SDK | @a2a-js/sdk | @dexwox-labs/a2a-node | Third-party, not official. Lower adoption (fewer dependents). |
| HTTP framework | Express 5 | Hono | SDK ships Express middleware; Hono would require custom adapter work. |
| HTTP framework | Express 5 | Fastify | Same reason as Hono. SDK's Express integration is the path of least resistance. |
| Build tool | Vite 8 | Webpack | Slower DX, more config. Vite is the 2026 standard. |
| TS runner | tsx | ts-node | tsx is faster, zero-config, uses esbuild under the hood. |
| State mgmt | Zustand | Redux Toolkit | Overkill for a dev tool's UI state needs. |
| State mgmt | Zustand | TanStack Query | A2A task lifecycle doesn't fit query/cache patterns. |
| CLI parser | Commander | Yargs | Yargs is heavier; commander is sufficient for simple arg parsing. |
| Styling | Tailwind CSS 4 | MUI/Ant Design | Component library overhead not justified for a dev tool. |
| Package structure | Single package | pnpm monorepo | One tool, one package. Monorepo adds config overhead for no benefit. |
## Installation
# Initialize project
# Core A2A SDK + Express
# CLI, state, utilities
# Dev dependencies
# Optional (if SDK doesn't cover SSE client needs)
## Key Configuration
### vite.config.ts (dev proxy)
### Express serving built SPA (production)
## Sources
- [@a2a-js/sdk on GitHub](https://github.com/a2aproject/a2a-js) -- Official JavaScript SDK, protocol spec v0.3.0
- [@a2a-js/sdk on npm](https://www.npmjs.com/package/@a2a-js/sdk) -- v0.3.10, last published ~1 month ago
- [A2A JS SDK Tutorial](https://dev.to/czmilo/a2a-js-sdk-complete-tutorial-quick-start-guide-41d2) -- Complete setup guide with Express examples
- [Express 5.1.0 release announcement](https://expressjs.com/2025/03/31/v5-1-latest-release.html) -- Express 5 is now default on npm
- [Vite 8 announcement](https://vite.dev/blog/announcing-vite8) -- Current stable, Rolldown + Oxc integration
- [Vite Getting Started](https://vite.dev/guide/) -- Requires Node.js 20.19+ or 22.12+
- [Commander vs Yargs comparison](https://npm-compare.com/commander,yargs) -- Commander at 35M+ weekly downloads
- [React state management 2025](https://www.developerway.com/posts/react-state-management-2025) -- Zustand + TanStack Query as modern standard
- [A2A Protocol specification](https://github.com/a2aproject/A2A) -- Protocol repo with spec and samples
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
