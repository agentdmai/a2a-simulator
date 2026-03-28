import { useState, useRef, type KeyboardEvent, type FormEvent } from 'react';

interface MessageInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

export default function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = !disabled && text.trim().length > 0;

  function handleInput(e: FormEvent<HTMLTextAreaElement>) {
    const target = e.currentTarget;
    setText(target.value);
    target.style.height = 'auto';
    target.style.height = target.scrollHeight + 'px';
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend) {
        send();
      }
    }
  }

  function send() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }

  return (
    <div className="flex items-end gap-2 p-4 border-t border-slate-200 bg-slate-50">
      <textarea
        ref={textareaRef}
        value={text}
        onInput={handleInput}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        rows={1}
        disabled={disabled}
        className={`flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-[6rem] overflow-y-auto ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      />
      <button
        type="button"
        onClick={send}
        disabled={!canSend}
        className={`bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium ${
          !canSend ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
        }`}
      >
        Send
      </button>
    </div>
  );
}
