# A2A Simulator

A Client-Server simulator for the [Google A2A (Agent-to-Agent)](https://github.com/a2aproject/A2A) protocol. Each instance runs as both an A2A server and client simultaneously, letting you test bidirectional agent communication from a single tool.

Inspired by the [A2A Inspector](https://github.com/a2aproject/a2a-inspector), which provides a client-only view of A2A interactions. This project goes further by embedding a full A2A server alongside the client, so you can observe and control both sides of a conversation. Run two instances side by side and watch messages flow in both directions.

![Light and Dark mode support](https://img.shields.io/badge/theme-light%20%26%20dark-green)

## What It Does

The simulator gives you a chat-like UI where you act as the human behind an A2A agent. You can connect to a remote agent, send messages, and see streaming responses in real time. At the same time, your instance is hosting its own A2A endpoints, so other agents (or a second simulator instance) can connect to you.

This makes it possible to debug the full lifecycle of A2A task exchanges: message sending, streaming status updates, `input-required` round trips, artifact attachments, task cancellation, and resubscription.

Every message includes a "View raw" link that opens the underlying JSON-RPC request and response, so you can inspect exactly what's going over the wire.

## Quick Start

```bash
npm install
```

### Running Two Instances

Open two terminals:

```bash
# Terminal 1
npm run dev -- --port 3000 --name "Agent Alpha"

# Terminal 2
npm run dev -- --port 3001 --name "Agent Beta"
```

Open `http://localhost:5173` (Vite dev server proxies to port 3000 by default). In the connection panel, enter `http://localhost:3001` and click Connect. You're now Agent Alpha talking to Agent Beta.

To see Agent Beta's perspective, open its Vite dev server on a different port or build and serve both instances.

### WebStorm / IDE Setup

The CLI args (`--port`, `--name`, `--description`) map directly to run configuration parameters. Create two Node.js run configurations pointing at `src/server/index.ts` with different port and name arguments.

## How It Works

Each instance runs a single Express server that handles:

1. **A2A protocol endpoints** via `@a2a-js/sdk`: the agent card at `/.well-known/agent-card.json` and JSON-RPC message handling at the root.
2. **A REST API** for the browser UI: connecting to remote agents, sending messages, replying to incoming tasks, and managing the agent card.
3. **Server-Sent Events** bridge that pushes real-time updates to the browser as task events stream in.

When a remote agent sends you a message, the server parks it as an `input-required` task and notifies the browser via SSE. You see it appear in the Incoming tab, type a response, pick a state (`working`, `completed`, `input-required`, `failed`), and optionally attach artifacts. Your reply flows back through the A2A protocol to the sender.

## Features

**Bidirectional testing.** Both instances can send and receive. You control the responses manually, which is exactly what you want when debugging protocol edge cases.

**Streaming support.** Messages stream in real time via SSE. You can send multiple `working` status updates before completing a task, simulating an agent that thinks in steps.

**Task lifecycle.** Full support for the A2A task state machine: `submitted` → `working` → `input-required` → `completed`/`failed`/`canceled`. Cancel and resubscribe buttons are available on active tasks.

**Artifacts.** Attach named artifacts with MIME types to any response. They show up inline in the conversation thread.

**Authentication.** Configure bearer token authentication on your instance through the Agent Card editor. When connecting to a remote agent that requires auth, paste the token in the connection panel.

**Agent Card editing.** Modify your agent's name, description, skills, and auth settings on the fly without restarting.

**Dark mode.** Light, dark, and system-preference themes with a toggle in the top bar.

**Raw JSON inspection.** Click "View raw" on any message to see the JSON-RPC request and response in a slide-out drawer.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| A2A SDK | `@a2a-js/sdk` (protocol v0.3.0) |
| Backend | Express 5, Node.js |
| Frontend | React 19, Vite 8 |
| Styling | Tailwind CSS 4 |
| Language | TypeScript |
| CLI | Commander |
| Icons | Lucide React |

## Project Structure

```
src/
  server/
    index.ts          Entry point, CLI arg parsing
    app.ts            Express app factory
    executor.ts       Bridges incoming A2A messages to the UI
    reply-handler.ts  Handles human replies to pending tasks
    api-routes.ts     REST API for the browser
    a2a-client.ts     Wraps @a2a-js/sdk client for outbound calls
    sse-bridge.ts     SSE connection manager
    agent-card.ts     Agent card builder
    state.ts          In-memory app state
  client/
    App.tsx           Root component
    context/          Connection state (useReducer)
    hooks/            useSSE, useApi, useRelativeTime
    components/       All UI components
    types/            TypeScript interfaces
```

## Building for Production

```bash
npm run build:client
npm run build
npm start -- --port 3000 --name "Agent Alpha"
```

The production build serves the React SPA and A2A endpoints from the same Express server on a single port.

## License

MIT
