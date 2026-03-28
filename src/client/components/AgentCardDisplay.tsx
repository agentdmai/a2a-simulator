import type { AgentCardInfo } from '../types/index';

interface Props {
  agentCard: AgentCardInfo;
}

export default function AgentCardDisplay({ agentCard }: Props) {
  return (
    <div className="mt-4 space-y-3">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{agentCard.name}</h3>
        <p className="text-sm text-slate-600 mt-1">{agentCard.description}</p>
      </div>

      {agentCard.skills.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Skills</h4>
          <div className="space-y-2">
            {agentCard.skills.map((skill) => (
              <div key={skill.id} className="p-2 bg-white rounded border border-slate-200">
                <p className="text-sm font-medium text-slate-800">{skill.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{skill.description}</p>
                {skill.tags && skill.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {skill.tags.map((tag) => (
                      <span key={tag} className="px-1.5 py-0.5 text-xs bg-slate-100 text-slate-600 rounded">
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
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Capabilities</h4>
        <div className="flex flex-wrap gap-2">
          <span className={`px-2 py-0.5 text-xs rounded ${agentCard.capabilities.streaming ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
            Streaming: {agentCard.capabilities.streaming ? 'Yes' : 'No'}
          </span>
          <span className={`px-2 py-0.5 text-xs rounded ${agentCard.capabilities.pushNotifications ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
            Push: {agentCard.capabilities.pushNotifications ? 'Yes' : 'No'}
          </span>
          <span className={`px-2 py-0.5 text-xs rounded ${agentCard.capabilities.stateTransitionHistory ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
            History: {agentCard.capabilities.stateTransitionHistory ? 'Yes' : 'No'}
          </span>
        </div>
      </div>

      <div className="text-xs text-slate-400 truncate" title={agentCard.url}>
        {agentCard.url}
      </div>
    </div>
  );
}
