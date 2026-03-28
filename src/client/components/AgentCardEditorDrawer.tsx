import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useConnection } from '../context/ConnectionContext';
import { useApi } from '../hooks/useApi';
import SkillsTagInput from './SkillsTagInput';
import AuthToggle from './AuthToggle';
interface AgentCardEditorDrawerProps {
  open: boolean;
  onClose: () => void;
  onSaveSuccess?: (message: string) => void;
}

export default function AgentCardEditorDrawer({ open, onClose, onSaveSuccess }: AgentCardEditorDrawerProps) {
  const { state, dispatch } = useConnection();
  const api = useApi();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [url, setUrl] = useState('');
  const [authEnabled, setAuthEnabled] = useState(false);
  const [authToken, setAuthToken] = useState('');

  // Populate form when drawer opens
  useEffect(() => {
    if (open && state.ownAgentCard) {
      setName(state.ownAgentCard.name);
      setDescription(state.ownAgentCard.description);
      setSkills(state.ownAgentCard.skills.map((s) => s.name));
      setUrl(state.ownAgentCard.url);
    }
  }, [open, state.ownAgentCard]);

  if (!open) return null;

  async function handleSave() {
    const skillObjects = skills.map((s) => ({ name: s, description: s }));
    const result = await api.updateAgentCard({ name, description, skills: skillObjects });

    // Update auth config
    await api.updateAuthConfig({ enabled: authEnabled, token: authToken || undefined });

    if (result.ok && result.agentCard) {
      dispatch({ type: 'OWN_AGENT_CARD_LOADED', card: result.agentCard });
    }

    onSaveSuccess?.('Agent Card updated');
    onClose();
  }

  function handleDiscard() {
    // Reset to original values
    if (state.ownAgentCard) {
      setName(state.ownAgentCard.name);
      setDescription(state.ownAgentCard.description);
      setSkills(state.ownAgentCard.skills.map((s) => s.name));
    }
    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />

      {/* Drawer panel */}
      <div className="fixed right-0 top-0 bottom-0 w-[480px] z-50 bg-bg border-l border-bd shadow-xl overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-bd bg-bg-alt">
          <h3 className="text-lg font-semibold text-fg">Edit Agent Card</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded hover:bg-bg-alt text-fg-muted"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 p-6 space-y-6">
          {/* Agent Name */}
          <div>
            <label className="block text-sm text-fg-muted mb-1">Agent Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-bd rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand bg-bg text-fg"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-fg-muted mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-bd rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand bg-bg text-fg resize-none"
            />
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm text-fg-muted mb-1">Skills</label>
            <SkillsTagInput skills={skills} onChange={setSkills} />
          </div>

          {/* URL (read-only) */}
          <div>
            <label className="block text-sm text-fg-muted mb-1">URL</label>
            <input
              type="text"
              value={url}
              readOnly
              className="w-full px-3 py-2 text-sm border border-bd rounded-md bg-bg-alt text-fg-muted cursor-not-allowed"
            />
          </div>

          {/* Divider */}
          <hr className="border-bd" />

          {/* Auth section */}
          <div className="space-y-4">
            <AuthToggle enabled={authEnabled} onToggle={setAuthEnabled} />
            {authEnabled && (
              <div>
                <label className="block text-sm text-fg-muted mb-1">Bearer Token</label>
                <input
                  type="password"
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  placeholder="Token required from clients"
                  className="w-full px-3 py-2 text-sm border border-bd rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand bg-bg text-fg"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-bd space-y-2">
          <button
            type="button"
            onClick={handleSave}
            className="w-full px-4 py-2 text-sm font-medium text-primary-fg bg-primary rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-brand"
          >
            Save Agent Card
          </button>
          <button
            type="button"
            onClick={handleDiscard}
            className="w-full px-4 py-2 text-sm font-medium text-fg-muted bg-transparent rounded-md hover:bg-bg-alt focus:outline-none"
          >
            Discard Changes
          </button>
        </div>
      </div>
    </>
  );
}
