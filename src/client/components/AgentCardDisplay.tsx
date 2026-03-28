import type { AgentCardInfo } from '../types/index';

interface Props {
  agentCard: AgentCardInfo;
}

export default function AgentCardDisplay({ agentCard }: Props) {
  return (
    <div className="mt-4 space-y-3">
      <div>
        <h3 className="text-lg font-semibold text-fg">{agentCard.name}</h3>
        <p className="text-sm text-fg-muted mt-1">{agentCard.description}</p>
      </div>

      {agentCard.skills.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-2">Skills</h4>
          <div className="space-y-2">
            {agentCard.skills.map((skill) => (
              <div key={skill.id} className="p-2 bg-bg rounded border border-bd">
                <p className="text-sm font-medium text-fg">{skill.name}</p>
                <p className="text-xs text-fg-muted mt-0.5">{skill.description}</p>
                {skill.tags && skill.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {skill.tags.map((tag) => (
                      <span key={tag} className="px-1.5 py-0.5 text-xs bg-bg-alt text-fg-muted rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-2">Capabilities</h4>
        <div className="flex flex-wrap gap-2">
          <span className={`px-2 py-0.5 text-xs rounded ${agentCard.capabilities.streaming ? 'bg-brand/10 text-brand' : 'bg-bg-alt text-fg-muted'}`}>
            Streaming: {agentCard.capabilities.streaming ? 'Yes' : 'No'}
          </span>
          <span className={`px-2 py-0.5 text-xs rounded ${agentCard.capabilities.pushNotifications ? 'bg-brand/10 text-brand' : 'bg-bg-alt text-fg-muted'}`}>
            Push: {agentCard.capabilities.pushNotifications ? 'Yes' : 'No'}
          </span>
          <span className={`px-2 py-0.5 text-xs rounded ${agentCard.capabilities.stateTransitionHistory ? 'bg-brand/10 text-brand' : 'bg-bg-alt text-fg-muted'}`}>
            History: {agentCard.capabilities.stateTransitionHistory ? 'Yes' : 'No'}
          </span>
        </div>
      </div>

      <div className="text-xs text-fg-muted truncate" title={agentCard.url}>
        {agentCard.url}
      </div>
    </div>
  );
}
