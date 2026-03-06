import type { GanttDependency, GanttRow, GanttTask } from '@/types/gantt';
import { addDays } from 'date-fns';

interface Props {
  dependencies: GanttDependency[];
  rows: GanttRow[];
  rowHeight: number;
  dayToX: (date: Date) => number;
  tasks: GanttTask[];
}

export function DependencyLines({ dependencies, rows, rowHeight, dayToX, tasks }: Props) {
  const lines = dependencies.map(dep => {
    const sourceTask = tasks.find(t => t.id === dep.source_task_id);
    const targetTask = tasks.find(t => t.id === dep.target_task_id);
    if (!sourceTask || !targetTask) return null;

    const sourceIdx = rows.findIndex(r => r.type === 'task' && r.id === dep.source_task_id);
    const targetIdx = rows.findIndex(r => r.type === 'task' && r.id === dep.target_task_id);
    if (sourceIdx === -1 || targetIdx === -1) return null;

    let x1: number, x2: number;
    if (dep.dependency_type === 'finish_to_start') {
      x1 = dayToX(addDays(new Date(sourceTask.end_date), 1));
      x2 = dayToX(new Date(targetTask.start_date));
    } else {
      x1 = dayToX(new Date(sourceTask.start_date));
      x2 = dayToX(new Date(targetTask.start_date));
    }

    const y1 = sourceIdx * rowHeight + rowHeight / 2;
    const y2 = targetIdx * rowHeight + rowHeight / 2;
    const midX = x1 + (x2 - x1) / 2;

    return (
      <g key={dep.id}>
        <path
          d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
          fill="none"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth={1.5}
          strokeDasharray="4 2"
          opacity={0.5}
        />
        {/* Arrow */}
        <polygon
          points={`${x2},${y2} ${x2 - 6},${y2 - 4} ${x2 - 6},${y2 + 4}`}
          fill="hsl(var(--muted-foreground))"
          opacity={0.5}
        />
      </g>
    );
  }).filter(Boolean);

  if (lines.length === 0) return null;

  return (
    <svg className="absolute inset-0 pointer-events-none z-10" style={{ width: '100%', height: rows.length * rowHeight }}>
      {lines}
    </svg>
  );
}
