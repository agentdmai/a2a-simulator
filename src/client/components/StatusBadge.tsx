import type { TaskState } from '../types/index';

const statusStyles: Record<TaskState, string> = {
  submitted: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  working: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  'input-required': 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  completed: 'bg-brand/15 text-brand',
  failed: 'bg-red-500/15 text-red-600 dark:text-red-400',
  canceled: 'bg-neutral-500/15 text-fg-muted',
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
