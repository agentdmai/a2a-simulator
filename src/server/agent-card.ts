import type { AgentCard } from '@a2a-js/sdk';

/**
 * Ensure the advertised base URL ends in a slash. A2A clients resolve both the
 * JSON-RPC service endpoint and the .well-known card against this value with
 * `new URL(relativePath, baseUrl)`, which drops the last path segment when the
 * base has no trailing slash.
 */
function ensureTrailingSlash(url: string): string {
  return url.endsWith('/') ? url : `${url}/`;
}

export function buildAgentCard(opts: {
  port: number;
  name: string;
  description: string;
  publicUrl?: string;
}): AgentCard {
  // `url` is the canonical service endpoint every remote client POSTs messages
  // to (A2A spec). It MUST be the externally reachable origin — not localhost —
  // or a remote caller (e.g. the AgentDM grid) and a second simulator instance
  // both end up POSTing to their own loopback instead of this agent. Defaults
  // to localhost for local two-instance testing; set PUBLIC_URL (or pass
  // --public-url) when the simulator is deployed behind a public domain.
  const baseUrl = ensureTrailingSlash(opts.publicUrl ?? `http://localhost:${opts.port}/`);
  return {
    name: opts.name,
    description: opts.description,
    url: baseUrl,
    provider: { organization: 'A2A Test Client', url: baseUrl },
    protocolVersion: '0.3.0',
    version: '1.0.0',
    capabilities: {
      streaming: true,
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
