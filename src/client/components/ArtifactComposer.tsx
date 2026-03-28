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
    <div className="border border-slate-200 rounded-md p-3 space-y-2 bg-white">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Artifact name"
        className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        type="text"
        value={mimeType}
        onChange={(e) => setMimeType(e.target.value)}
        placeholder="text/plain"
        className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Artifact content..."
        rows={6}
        className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleAdd}
          disabled={!name.trim()}
          className="px-3 py-1 text-sm border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          Discard Artifact
        </button>
      </div>
    </div>
  );
}
