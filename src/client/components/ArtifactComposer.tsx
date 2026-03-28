import { useState } from 'react';

interface ArtifactComposerProps {
  onAdd: (artifact: { name: string; mimeType: string; content: string }) => void;
  onCancel: () => void;
}

export default function ArtifactComposer({ onAdd, onCancel }: ArtifactComposerProps) {
  const [name, setName] = useState('');
  const [mimeType, setMimeType] = useState('');
  const [content, setContent] = useState('');

  function handleAdd() {
    if (!name.trim()) return;
    onAdd({
      name: name.trim(),
      mimeType: mimeType.trim() || 'text/plain',
      content,
    });
    setName('');
    setMimeType('');
    setContent('');
  }

  return (
    <div className="border border-bd rounded-md p-3 space-y-2 bg-bg">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Artifact name"
        className="w-full px-2 py-1 text-sm border border-bd rounded bg-bg text-fg focus:outline-none focus:ring-2 focus:ring-brand"
      />
      <input
        type="text"
        value={mimeType}
        onChange={(e) => setMimeType(e.target.value)}
        placeholder="text/plain"
        className="w-full px-2 py-1 text-sm border border-bd rounded bg-bg text-fg focus:outline-none focus:ring-2 focus:ring-brand"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Artifact content..."
        rows={6}
        className="w-full px-2 py-1 text-sm border border-bd rounded bg-bg text-fg focus:outline-none focus:ring-2 focus:ring-brand resize-none"
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleAdd}
          disabled={!name.trim()}
          className="px-3 py-1 text-sm border border-bd rounded-md text-fg hover:bg-bg-alt disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-fg-muted hover:text-fg"
        >
          Discard Artifact
        </button>
      </div>
    </div>
  );
}
