import { useState } from 'react';
import { X } from 'lucide-react';

interface SkillsTagInputProps {
  skills: string[];
  onChange: (skills: string[]) => void;
}

export default function SkillsTagInput({ skills, onChange }: SkillsTagInputProps) {
  const [input, setInput] = useState('');

  function addSkill(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (skills.includes(trimmed)) return; // silently ignore duplicates
    onChange([...skills, trimmed]);
  }

  function removeSkill(name: string) {
    onChange(skills.filter((s) => s !== name));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(input);
      setInput('');
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    // If user types comma, treat it as add trigger
    if (val.includes(',')) {
      const parts = val.split(',');
      for (const part of parts) {
        addSkill(part);
      }
      setInput('');
    } else {
      setInput(val);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-2">
        {skills.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center gap-1 bg-bg-alt text-fg py-1 px-2 rounded text-sm"
          >
            {skill}
            <button
              type="button"
              onClick={() => removeSkill(skill)}
              aria-label={`Remove ${skill}`}
              className="text-fg-muted hover:text-fg"
            >
              <X size={14} />
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Add skill (Enter or comma to add)"
        className="w-full px-3 py-2 text-sm border border-bd rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand bg-bg text-fg"
      />
    </div>
  );
}
