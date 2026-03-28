import { useState, useRef, type KeyboardEvent, type FormEvent } from 'react';
import { Paperclip } from 'lucide-react';
import StateDropdown from './StateDropdown';
import ArtifactComposer from './ArtifactComposer';
import ArtifactChip from './ArtifactChip';

interface ArtifactEntry {
  name: string;
  mimeType: string;
  content: string;
}

interface ResponseComposerProps {
  taskId: string;
  onReply: () => void;
}

export default function ResponseComposer({ taskId, onReply }: ResponseComposerProps) {
  const [text, setText] = useState('');
  const [selectedState, setSelectedState] = useState('completed');
  const [artifacts, setArtifacts] = useState<ArtifactEntry[]>([]);
  const [showArtifactForm, setShowArtifactForm] = useState(false);
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = text.trim().length > 0 && !sending;

  function handleInput(e: FormEvent<HTMLTextAreaElement>) {
    const target = e.currentTarget;
    setText(target.value);
    target.style.height = 'auto';
    target.style.height = target.scrollHeight + 'px';
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend) handleSend();
    }
  }

  async function handleSend() {
    if (!canSend) return;
    setSending(true);
    try {
      const res = await fetch('/api/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          text: text.trim(),
          state: selectedState,
          artifacts: artifacts.length > 0 ? artifacts : undefined,
        }),
      });
      if (res.ok) {
        setText('');
        setArtifacts([]);
        setShowArtifactForm(false);
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
        onReply();
      }
    } finally {
      setSending(false);
    }
  }

  function handleAddArtifact(artifact: ArtifactEntry) {
    setArtifacts((prev) => [...prev, artifact]);
    setShowArtifactForm(false);
  }

  function handleRemoveArtifact(index: number) {
    setArtifacts((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-2">
      {/* Main row: dropdown + textarea + reply button */}
      <div className="flex items-end gap-2">
        <StateDropdown value={selectedState} onChange={setSelectedState} />
        <textarea
          ref={textareaRef}
          value={text}
          onInput={handleInput}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a response..."
          rows={1}
          className="flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-[6rem] overflow-y-auto"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className={`bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium ${
            !canSend ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
          }`}
        >
          Reply
        </button>
      </div>

      {/* Artifact chips */}
      {artifacts.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {artifacts.map((a, i) => (
            <ArtifactChip key={i} name={a.name} onRemove={() => handleRemoveArtifact(i)} />
          ))}
        </div>
      )}

      {/* Attach artifact button / composer */}
      {showArtifactForm ? (
        <ArtifactComposer
          onAdd={handleAddArtifact}
          onCancel={() => setShowArtifactForm(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowArtifactForm(true)}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <Paperclip size={14} />
          Attach Artifact
        </button>
      )}
    </div>
  );
}
