import type { TaskData } from '../types/index';
import IncomingTaskEntry from './IncomingTaskEntry';

interface IncomingTaskListProps {
  tasks: TaskData[];
  selectedTaskId: string | null;
  onSelect: (contextId: string) => void;
}

export default function IncomingTaskList({ tasks, selectedTaskId, onSelect }: IncomingTaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-400">No incoming tasks</h3>
          <p className="mt-2 text-sm text-slate-400">
            When remote agents send tasks to this instance, they will appear here.
          </p>
        </div>
      </div>
    );
  }

  // Sort by most recent first (reverse order of insertion)
  const sorted = [...tasks].reverse();

  return (
    <div>
      {sorted.map((task) => (
        <IncomingTaskEntry
          key={task.contextId}
          task={task}
          selected={selectedTaskId === task.contextId}
          onClick={() => onSelect(task.contextId)}
        />
      ))}
    </div>
  );
}
