import { program } from 'commander';
import { createApp } from './app.js';

program
  .option('-p, --port <number>', 'Port to listen on', parseInt, parseInt(process.env.PORT || '3000'))
  .option('-n, --name <string>', 'Agent name', process.env.AGENT_NAME || 'A2A Agent')
  .option('-d, --description <string>', 'Agent description', process.env.AGENT_DESCRIPTION || 'A2A Test Agent')
  .parse();

const opts = program.opts<{ port: number; name: string; description: string }>();

const app = createApp(opts);
app.listen(opts.port, () => {
  console.log(`${opts.name} listening on port ${opts.port}`);
  console.log(`Agent Card: http://localhost:${opts.port}/.well-known/agent-card.json`);
});
