import type { TaskState } from '../types/index';

const statusStyles: Record<TaskState, string> = {
  submitted: 'bg-blue-100 text-blue-800',
  working: 'bg-amber-100 text-amber-800',
  'input-required': 'bg-violet-100 text-violet-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

function formatStatus(status: TaskState): string {
  return status
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function StatusBadge({ status }: { status: TaskState }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[status]}`}
    >
      {formatStatus(status)}
    </span>
  );
}
