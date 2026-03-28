import type { ReactNode } from 'react';

interface LeftPanelTabsProps {
  activeTab: 'connection' | 'incoming';
  onTabChange: (tab: 'connection' | 'incoming') => void;
  incomingCount: number;
  children: ReactNode;
}

export default function LeftPanelTabs({ activeTab, onTabChange, incomingCount, children }: LeftPanelTabsProps) {
  return (
    <div className="w-80 flex-shrink-0 border-r border-bd bg-bg-alt flex flex-col overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-bd">
        <button
          type="button"
          onClick={() => onTabChange('connection')}
          className={`flex-1 py-2 text-xs text-center ${
            activeTab === 'connection'
              ? 'font-semibold text-fg border-b-2 border-brand'
              : 'text-fg-muted hover:text-fg'
          }`}
        >
          Connection
        </button>
        <button
          type="button"
          onClick={() => onTabChange('incoming')}
          className={`flex-1 py-2 text-xs text-center flex items-center justify-center gap-1 ${
            activeTab === 'incoming'
              ? 'font-semibold text-fg border-b-2 border-brand'
              : 'text-fg-muted hover:text-fg'
          }`}
        >
          Incoming
          {incomingCount > 0 && (
            <span className="bg-brand text-primary-fg text-xs px-1 rounded-full min-w-[18px] text-center leading-tight">
              {incomingCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
