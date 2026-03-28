import type { AgentCard } from '@a2a-js/sdk';

export function buildAgentCard(opts: { port: number; name: string; description: string }): AgentCard {
  return {
    name: opts.name,
    description: opts.description,
    url: `http://localhost:${opts.port}/`,
    provider: { organization: 'A2A Test Client', url: 'http://localhost' },
    protocolVersion: '0.3.0',
    version: '1.0.0',
    capabilities: {
      streaming: false,
      pushNotifications: false,
      stateTransitionHistory: true,
    },
    defaultInputModes: ['text/plain'],
    defaultOutputModes: ['text/plain'],
    skills: [
      {
        id: 'human-agent',
        name: opts.name,
        description: opts.description,
        tags: ['test', 'human-in-the-loop'],
        examples: ['Hello', 'How are you?'],
        inputModes: ['text/plain'],
        outputModes: ['text/plain'],
      },
    ],
    supportsAuthenticatedExtendedCard: false,
  };
}
