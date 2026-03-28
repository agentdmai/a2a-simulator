import { useState, useEffect } from 'react';
import { useConnection } from '../context/ConnectionContext';
import { useApi } from '../hooks/useApi';
import ConnectionStatus from './ConnectionStatus';
import AgentCardDisplay from './AgentCardDisplay';
import AuthTokenInput from './AuthTokenInput';

interface ConnectionPanelProps {
  onOpenEditor?: () => void;
}

export default function ConnectionPanel({ onOpenEditor }: ConnectionPanelProps) {
  const { state, dispatch } = useConnection();
  const api = useApi();
  const [url, setUrl] = useState('http://localhost:3001');
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
        <h2 className="text-lg font-semibold text-slate-900">Connection</h2>
        <ConnectionStatus status={state.status} />
      </div>

      <div className="space-y-3">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          readOnly={isConnected}
          placeholder="https://localhost:3001"
          className={`w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            isConnected ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'
          }`}
        />

        <AuthTokenInput
          value={authToken}
          onChange={setAuthToken}
          disabled={isConnected}
        />

        {state.error && (
          <p className="text-sm text-red-600">
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
            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
        className="mt-4 w-full px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Edit Agent Card
      </button>
    </div>
  );
}
