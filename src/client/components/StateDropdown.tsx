interface StateDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

const states = ['completed', 'working', 'input-required', 'failed'] as const;

export default function StateDropdown({ value, onChange }: StateDropdownProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-sm border border-slate-300 rounded-md px-2 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    >
      {states.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}
