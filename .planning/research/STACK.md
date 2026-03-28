# Technology Stack

**Project:** A2A Test Client
**Researched:** 2026-03-27

## Important Clarification: a2a-node vs @a2a-js/sdk

The PROJECT.md references "Google's official a2a-node SDK." This package name does not exist on npm under Google's organization. The actual official SDK is **`@a2a-js/sdk`** published by the `a2aproject` organization (which is the successor to the `google/A2A` GitHub repo, now at `a2aproject/a2a-js`). The `@dexwox-labs/a2a-node` package is a third-party community SDK -- do not use it.

**Confidence:** HIGH -- verified via npm registry, GitHub repo, and multiple tutorials.

## Recommended Stack

### A2A Protocol SDK

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @a2a-js/sdk | ^0.3.10 | A2A protocol client and server | Official SDK from A2A project (Google-originated). Implements A2A spec v0.3.0. Provides `A2AExpressApp`, `A2AClient`, `InMemoryTaskStore`, `DefaultRequestHandler`, agent card serving, JSON-RPC and REST transports. 88+ dependents on npm. |

**Confidence:** HIGH -- verified via GitHub README, npm, and tutorial walkthroughs.

**Key API surface:**
- **Server:** `AgentExecutor` interface, `DefaultRequestHandler`, `A2AExpressApp` (Express route builder), `InMemoryTaskStore`, `ExecutionEventBus`
- **Client:** `A2AClient` class, `ClientFactory.createFromUrl()`
- **Types:** `AgentCard`, `Message`, `Task`, `TaskStatusUpdateEvent`, `TaskArtifactUpdateEvent`
- **Transports:** JSON-RPC, HTTP+JSON/REST, gRPC (all supported client+server)
- **Express integration:** `agentCardHandler()`, `jsonRpcHandler()`, `restHandler()` from `@a2a-js/sdk/server/express`

### Web Framework (Backend)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Express | ^5.2 | HTTP server for A2A endpoints + SPA serving | @a2a-js/sdk has first-class Express integration (`A2AExpressApp`). Express 5 is now the stable default on npm (since March 2025). No reason to fight the SDK's built-in framework support. SSE works natively via `res.write()`. |

**Confidence:** HIGH -- Express is a peer dependency of @a2a-js/sdk; Express 5.2.1 is current stable.

**Why not Hono/Fastify:** The A2A SDK ships Express middleware (`A2AExpressApp`, route handlers). Using Hono or Fastify would require writing custom adapters around the SDK's internals -- unnecessary complexity for a dev testing tool. Performance differences are irrelevant for a local test client.

### Frontend Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React | ^19 | SPA UI for agent configuration, chat, task monitoring | Project requirement. React 19 is current stable. |
| Vite | ^8 | Dev server, build tool, HMR | Current standard for React SPAs in 2026. Vite 8 uses Rolldown bundler and Oxc compiler. Lightning fast HMR. Dev proxy to Express backend. |
| @vitejs/plugin-react | ^6 | React Fast Refresh in Vite | Uses Oxc for React Refresh transform. Pairs with Vite 8. |

**Confidence:** HIGH -- Vite 8 is current stable, verified via vite.dev.

### TypeScript Tooling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| TypeScript | ^5.7 | Type safety across frontend + backend | @a2a-js/sdk is written in TypeScript. Shared types between client/server eliminate protocol mismatches. |
| tsx | ^4 | Run TypeScript server directly (dev mode) | Zero-config TS execution for Node.js. No separate compile step during development. Faster iteration than tsc + node. |
| @types/express | ^5 | Express type definitions | Required for Express 5 TypeScript support. |

**Confidence:** HIGH -- standard tooling, well-established.

### CLI Argument Parsing

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| commander | ^13 | Parse CLI args (port, agent name, etc.) | 35M+ weekly downloads. Lightweight, excellent TypeScript support. Maps cleanly to WebStorm run configuration parameters. Simpler than yargs for this use case (no subcommands needed). |

**Confidence:** HIGH -- most popular CLI parser, verified via npm.

### State Management (Frontend)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| zustand | ^5 | Client-side state (agent config, UI state, connection status) | Tiny (~1KB), zero boilerplate, works great with React 19. No providers/context wrappers needed. Perfect for a tool with modest state needs. |

**Confidence:** HIGH -- industry standard for small-to-medium React apps.

**Why not TanStack Query:** This app does not do typical REST API fetching with caching. The A2A interactions are stateful task lifecycles with SSE streams -- they don't fit the query/cache pattern. Zustand stores + manual fetch/EventSource is the right approach.

**Why not Redux:** Overkill. This is a dev testing tool, not an enterprise app.

### UI Components

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | ^4 | Utility-first styling | Fast to build chat UIs and forms. No component library dependency. Vite has native PostCSS support. |

**Confidence:** MEDIUM -- Tailwind 4 is current stable. Good fit but alternatives (CSS modules, vanilla CSS) would also work fine for this scope.

**Why not a component library (MUI, Ant, shadcn):** This is a developer testing tool, not a customer-facing product. Tailwind utilities are sufficient for forms, chat bubbles, and status indicators. Adding a component library introduces bundle bloat and design opinion overhead for minimal benefit.

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| eventsource | ^3 | SSE client for Node.js | If @a2a-js/sdk's client doesn't handle SSE natively; for streaming task updates from remote agents |
| uuid | ^11 | Generate unique task/message IDs | For creating A2A message and task identifiers |
| cors | ^2 | CORS middleware for Express | Only needed if frontend dev server and Express run on different ports during development |

**Confidence:** MEDIUM -- these are standard utilities; exact need depends on SDK gaps discovered during implementation.

## Project Structure

```
a2a/
  package.json            # Single package (NOT a monorepo)
  tsconfig.json           # Base TS config
  tsconfig.node.json      # Server TS config
  vite.config.ts          # Vite config with proxy to Express
  src/
    server/
      index.ts            # Express + A2A server entry point
      agent-executor.ts   # AgentExecutor implementation
      agent-card.ts       # Agent card configuration
    client/               # React SPA
      main.tsx            # React entry
      App.tsx
      components/
      stores/             # Zustand stores
  public/                 # Static assets
  dist/                   # Vite build output (served by Express in prod)
```

**Why single package, not monorepo:** The project is a single tool (not multiple apps/libraries). A monorepo with workspaces adds configuration complexity (pnpm workspaces, turborepo) for zero benefit. One `package.json`, two tsconfig files (node + client), done.

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

```bash
# Initialize project
npm create vite@latest a2a-test-client -- --template react-ts
cd a2a-test-client

# Core A2A SDK + Express
npm install @a2a-js/sdk express

# CLI, state, utilities
npm install commander zustand uuid

# Dev dependencies
npm install -D typescript @types/express @types/uuid tsx tailwindcss @tailwindcss/vite

# Optional (if SDK doesn't cover SSE client needs)
npm install eventsource
npm install -D @types/eventsource
```

## Key Configuration

### vite.config.ts (dev proxy)
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/.well-known': 'http://localhost:3000',
      '/a2a': 'http://localhost:3000',
    },
  },
  build: {
    outDir: 'dist/client',
  },
});
```

### Express serving built SPA (production)
```typescript
import express from 'express';
import path from 'path';

const app = express();
// ... A2A SDK route setup ...

// Serve built React SPA
app.use(express.static(path.join(__dirname, '../client')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});
```

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
