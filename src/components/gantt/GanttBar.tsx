import { useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import type { GanttRow } from '@/types/gantt';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { STATUS_LABELS } from '@/types/gantt';

interface Props {
  row: GanttRow;
  x: number;
  width: number;
  y: number;
  height: number;
  onDragEnd: (newX: number) => void;
  onResizeEnd: (newX: number, newWidth: number) => void;
  getOwnerName?: (id: string | null | undefined) => string;
}

const barColors = {
  milestone: { base: 'bg-orange-500', done: 'bg-orange-600', notStarted: 'bg-orange-400' },
  project: { base: 'bg-blue-500', done: 'bg-blue-600', notStarted: 'bg-blue-400' },
  task: { base: 'bg-violet-500', done: 'bg-violet-600', notStarted: 'bg-violet-400' },
  subtask: { base: 'bg-amber-500', done: 'bg-amber-600', notStarted: 'bg-amber-400' },
};

export function GanttBar({ row, x, width, y, height, onDragEnd, onResizeEnd, getOwnerName }: Props) {
  const barRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<'left' | 'right' | false>(false);
  const dragStart = useRef({ mouseX: 0, barX: x, barW: width });

  const colors = barColors[row.type];
  const colorClass = row.status === 'done' ? colors.done : row.status === 'not_started' ? colors.notStarted : colors.base;

  const handleMouseDown = useCallback((e: React.MouseEvent, mode: 'drag' | 'resize-left' | 'resize-right') => {
    e.preventDefault();
    e.stopPropagation();
    dragStart.current = { mouseX: e.clientX, barX: x, barW: width };

    if (mode === 'drag') setIsDragging(true);
    else setIsResizing(mode === 'resize-left' ? 'left' : 'right');

    const handleMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - dragStart.current.mouseX;
      if (mode === 'drag' && barRef.current) {
        barRef.current.style.left = `${dragStart.current.barX + dx}px`;
      } else if (mode === 'resize-left' && barRef.current) {
        const newX = dragStart.current.barX + dx;
        const newW = dragStart.current.barW - dx;
        if (newW > 8) {
          barRef.current.style.left = `${newX}px`;
          barRef.current.style.width = `${newW}px`;
        }
      } else if (mode === 'resize-right' && barRef.current) {
        const newW = dragStart.current.barW + dx;
        if (newW > 8) {
          barRef.current.style.width = `${newW}px`;
        }
      }
    };

    const handleMouseUp = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      setIsDragging(false);
      setIsResizing(false);

      const dx = ev.clientX - dragStart.current.mouseX;
      if (Math.abs(dx) < 3) return;

      if (mode === 'drag') {
        onDragEnd(dragStart.current.barX + dx);
      } else if (mode === 'resize-left') {
        const newX = dragStart.current.barX + dx;
        const newW = dragStart.current.barW - dx;
        if (newW > 8) onResizeEnd(newX, newW);
      } else {
        const newW = dragStart.current.barW + dx;
        if (newW > 8) onResizeEnd(dragStart.current.barX, newW);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [x, width, onDragEnd, onResizeEnd]);

  const barHeight = row.type === 'project' ? 26 : row.type === 'task' ? 22 : 16;
  const barY = (height - barHeight) / 2;
  const ownerName = getOwnerName?.(row.owner) || '';

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            ref={barRef}
            className={cn(
              'absolute rounded-sm cursor-grab active:cursor-grabbing transition-shadow group/bar flex items-center overflow-hidden',
              colorClass,
              row.status === 'not_started' && 'opacity-60 border border-dashed border-current',
              (isDragging || isResizing) && 'shadow-lg z-30 ring-2 ring-ring',
            )}
            style={{ left: x, top: y + barY, width, height: barHeight }}
            onMouseDown={(e) => handleMouseDown(e, 'drag')}
          >
            {/* Resize handles */}
            <div
              className="absolute left-0 top-0 bottom-0 w-3 cursor-col-resize opacity-0 group-hover/bar:opacity-100 hover:bg-black/20 rounded-l-sm z-10"
              onMouseDown={(e) => handleMouseDown(e, 'resize-left')}
            />
            <div
              className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize opacity-0 group-hover/bar:opacity-100 hover:bg-black/20 rounded-r-sm z-10"
              onMouseDown={(e) => handleMouseDown(e, 'resize-right')}
            />
            {/* Done check */}
            {row.status === 'done' && barHeight >= 16 && (
              <div className="absolute right-1 top-1/2 -translate-y-1/2 z-10">
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
            {/* Label on bar — sticky so it stays visible during horizontal scroll */}
            {width > 60 && barHeight >= 16 && (
              <span className="sticky left-2 text-[11px] text-white font-medium truncate px-2" style={{ maxWidth: width - 24 }}>
                {row.title}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p className="font-medium">{row.title}</p>
          <p className="text-muted-foreground">{row.start_date} → {row.end_date}</p>
          <p>{STATUS_LABELS[row.status]}{ownerName ? ` • ${ownerName}` : ''}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
