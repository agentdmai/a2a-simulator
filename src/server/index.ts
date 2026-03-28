import { program } from 'commander';
import { createApp } from './app.js';

program
  .requiredOption('-p, --port <number>', 'Port to listen on', parseInt)
  .requiredOption('-n, --name <string>', 'Agent name')
  .option('-d, --description <string>', 'Agent description', 'A2A Test Agent')
  .parse();

const opts = program.opts<{ port: number; name: string; description: string }>();

const app = createApp(opts);
app.listen(opts.port, () => {
  console.log(`${opts.name} listening on port ${opts.port}`);
  console.log(`Agent Card: http://localhost:${opts.port}/.well-known/agent-card.json`);
});
