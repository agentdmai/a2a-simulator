import { useState, useEffect } from 'react';
import { useConnection } from '../context/ConnectionContext';
import { useApi } from '../hooks/useApi';
import ConnectionStatus from './ConnectionStatus';
import AgentCardDisplay from './AgentCardDisplay';
import AuthTokenInput from './AuthTokenInput';

interface ConnectionPanelProps {
  onOpenEditor?: () => void;
}

function getCounterpart(): { defaultUrl: string; linkUrl: string; linkLabel: string } | null {
  const host = window.location.hostname;
  if (host === 'beta.a2a.dev.agentdm.ai') {
    return {
      defaultUrl: 'https://alpha.a2a.dev.agentdm.ai:3001',
      linkUrl: 'https://alpha.a2a.dev.agentdm.ai',
      linkLabel: 'Open Alpha',
    };
  }
  if (host === 'alpha.a2a.dev.agentdm.ai') {
    return {
      defaultUrl: 'https://beta.a2a.dev.agentdm.ai:3001',
      linkUrl: 'https://beta.a2a.dev.agentdm.ai',
      linkLabel: 'Open Beta',
    };
  }
  return null;
}

export default function ConnectionPanel({ onOpenEditor }: ConnectionPanelProps) {
  const { state, dispatch } = useConnection();
  const api = useApi();
  const counterpart = getCounterpart();
  const [url, setUrl] = useState(counterpart?.defaultUrl ?? 'http://localhost:3001');
  const [authToken, setAuthToken] = useState('');

  // Fetch own agent card on mount
  useEffect(() => {
    api.getAgentCard().then((card) => {
      dispatch({ type: 'OWN_AGENT_CARD_LOADED', card });
    }).catch(() => {
      // Silently ignore fetch errors on initial load
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnect = async () => {
    dispatch({ type: 'CONNECTING', url });
    try {
      const result = await api.connect(url, authToken || undefined);
      if (result.ok && result.agentCard) {
        dispatch({ type: 'CONNECTED', agentCard: result.agentCard });
      } else {
        dispatch({ type: 'ERROR', error: result.error || 'Connection failed' });
      }
    } catch (err) {
      dispatch({ type: 'ERROR', error: (err as Error).message });
    }
  };

  const handleDisconnect = async () => {
    await api.disconnect();
    dispatch({ type: 'DISCONNECTED' });
  };

  const isConnected = state.status === 'connected';
  const isConnecting = state.status === 'connecting';

  return (
    <div className="p-6 flex flex-col overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-fg">Connection</h2>
        <ConnectionStatus status={state.status} />
      </div>

      <div className="space-y-3">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          readOnly={isConnected}
          placeholder="https://localhost:3001"
          className={`w-full px-3 py-2 text-sm border border-bd rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand bg-bg text-fg ${
            isConnected ? 'opacity-60 cursor-not-allowed' : ''
          }`}
        />

        {counterpart && (
          <a
            href={counterpart.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-brand hover:underline"
          >
            {counterpart.linkLabel} &rarr;
          </a>
        )}

        <AuthTokenInput
          value={authToken}
          onChange={setAuthToken}
          disabled={isConnected}
        />

        {state.error && (
          <p className="text-sm text-red-500">
            {state.error}
          </p>
        )}

        {isConnected ? (
          <button
            onClick={handleDisconnect}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={handleConnect}
            disabled={isConnecting || !url.trim()}
            className="w-full px-4 py-2 text-sm font-medium text-primary-fg bg-primary rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? 'Connecting...' : 'Connect'}
          </button>
        )}
      </div>

      {state.agentCard && (
        <AgentCardDisplay agentCard={state.agentCard} />
      )}

      {/* Edit Agent Card button - always visible */}
      <button
        type="button"
        onClick={onOpenEditor}
        className="mt-4 w-full px-4 py-2 text-sm font-medium text-fg-muted border border-bd rounded-md hover:bg-bg-alt focus:outline-none focus:ring-2 focus:ring-brand"
      >
        Edit Agent Card
      </button>
    </div>
  );
}
