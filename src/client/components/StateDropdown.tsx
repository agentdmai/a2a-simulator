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
      className="text-sm border border-bd rounded-md px-2 py-2 bg-bg text-fg focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
    >
      {states.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}
