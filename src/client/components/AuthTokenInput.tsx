import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface AuthTokenInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

export default function AuthTokenInput({ value, onChange, disabled }: AuthTokenInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={disabled}
        placeholder="Bearer token (optional)"
        className={`w-full px-3 py-2 pr-10 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          disabled ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'
        }`}
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        aria-label={visible ? 'Hide token' : 'Show token'}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
