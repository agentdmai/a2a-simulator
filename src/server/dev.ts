import { program } from 'commander';
import { createApp } from './app.js';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

program
  .requiredOption('-p, --port <number>', 'Port to listen on', parseInt)
  .requiredOption('-n, --name <string>', 'Agent name')
  .option('-d, --description <string>', 'Agent description', 'A2A Test Agent')
  .option('--vite-port <number>', 'Vite dev server port')
  .parse();

const opts = program.opts<{ port: number; name: string; description: string; vitePort: string | undefined }>();
const vitePort = opts.vitePort ? parseInt(opts.vitePort, 10) : 5173;

// Start Express (A2A agent)
const app = createApp(opts);
app.listen(opts.port, () => {
  console.log(`${opts.name} listening on port ${opts.port}`);
  console.log(`Agent Card: http://localhost:${opts.port}/.well-known/agent-card.json`);
});

// Start Vite dev server with proxy pointing at this agent's port
// configFile: false prevents vite.config.ts from merging its own server.proxy (hardcoded to port 3000)
const vite = await createServer({
  configFile: false,
  plugins: [react(), tailwindcss()],
  root: '.',
  server: {
    port: vitePort,
    strictPort: true,
    proxy: {
      '/api': {
        target: `http://localhost:${opts.port}`,
        changeOrigin: true,
      },
      '/.well-known': {
        target: `http://localhost:${opts.port}`,
        changeOrigin: true,
      },
    },
  },
});

await vite.listen();
console.log(`UI: http://localhost:${vitePort}`);
