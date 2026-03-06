import { forwardRef, useMemo, useRef, useCallback } from 'react';
import { differenceInDays, addDays, format, startOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { GanttBar } from './GanttBar';
import { DependencyLines } from './DependencyLines';
import type { GanttRow, ZoomLevel, GanttDependency, GanttTask } from '@/types/gantt';

interface Props {
  rows: GanttRow[];
  zoom: ZoomLevel;
  viewStart: Date;
  onUpdateDates: (type: 'project' | 'task' | 'subtask', id: string, start: string, end: string) => void;
  dependencies: GanttDependency[];
  tasks: GanttTask[];
}

const ROW_HEIGHT = 40;

const getColWidth = (zoom: ZoomLevel) => {
  switch (zoom) {
    case 'day': return 40;
    case 'week': return 120;
    case 'month': return 200;
  }
};

const getVisibleRange = (zoom: ZoomLevel, viewStart: Date): { start: Date; end: Date; columns: Date[] } => {
  if (zoom === 'day') {
    const days = eachDayOfInterval({ start: viewStart, end: addDays(viewStart, 30) });
    return { start: days[0], end: days[days.length - 1], columns: days };
  }
  if (zoom === 'week') {
    const weeks = eachWeekOfInterval({ start: viewStart, end: addDays(viewStart, 120) }, { weekStartsOn: 1 });
    return { start: weeks[0], end: addDays(weeks[weeks.length - 1], 6), columns: weeks };
  }
  const months = eachMonthOfInterval({ start: viewStart, end: addDays(viewStart, 365) });
  return { start: months[0], end: endOfMonth(months[months.length - 1]), columns: months };
};

export const GanttTimeline = forwardRef<HTMLDivElement, Props>(({ rows, zoom, viewStart, onUpdateDates, dependencies, tasks }, ref) => {
  const colWidth = getColWidth(zoom);
  const { start: rangeStart, end: rangeEnd, columns } = useMemo(() => getVisibleRange(zoom, viewStart), [zoom, viewStart]);
  const totalDays = differenceInDays(rangeEnd, rangeStart) + 1;
  const totalWidth = zoom === 'day' ? columns.length * colWidth : zoom === 'week' ? columns.length * colWidth : columns.length * colWidth;

  const dayToX = useCallback((date: Date) => {
    const days = differenceInDays(date, rangeStart);
    return (days / totalDays) * totalWidth;
  }, [rangeStart, totalDays, totalWidth]);

  const xToDate = useCallback((x: number) => {
    const days = Math.round((x / totalWidth) * totalDays);
    return addDays(rangeStart, days);
  }, [rangeStart, totalDays, totalWidth]);

  // Header labels
  const headerLabels = useMemo(() => {
    return columns.map((col, i) => {
      let label = '';
      let subLabel = '';
      if (zoom === 'day') {
        label = format(col, 'dd', { locale: fr });
        subLabel = format(col, 'EEE', { locale: fr });
      } else if (zoom === 'week') {
        label = `S${format(col, 'ww', { locale: fr })}`;
        subLabel = format(col, 'dd MMM', { locale: fr });
      } else {
        label = format(col, 'MMMM yyyy', { locale: fr });
        subLabel = '';
      }
      return { label, subLabel, x: i * colWidth, width: colWidth };
    });
  }, [columns, zoom, colWidth]);

  // Month header for day/week views
  const monthHeaders = useMemo(() => {
    if (zoom === 'month') return [];
    const months: { label: string; x: number; width: number }[] = [];
    let currentMonth = '';
    let startX = 0;
    columns.forEach((col, i) => {
      const m = format(col, 'MMMM yyyy', { locale: fr });
      if (m !== currentMonth) {
        if (currentMonth) {
          months.push({ label: currentMonth, x: startX, width: i * colWidth - startX });
        }
        currentMonth = m;
        startX = i * colWidth;
      }
    });
    if (currentMonth) {
      months.push({ label: currentMonth, x: startX, width: columns.length * colWidth - startX });
    }
    return months;
  }, [columns, zoom, colWidth]);

  // Today line
  const todayX = dayToX(new Date());
  const showToday = todayX >= 0 && todayX <= totalWidth;

  return (
    <div ref={ref} className="flex-1 overflow-x-auto overflow-y-auto relative">
      <div style={{ width: totalWidth, minWidth: '100%' }}>
        {/* Month header */}
        {monthHeaders.length > 0 && (
          <div className="h-6 border-b border-border flex bg-muted/30 sticky top-0 z-10">
            {monthHeaders.map((m, i) => (
              <div key={i} className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center justify-center border-r border-border/50" style={{ width: m.width, left: m.x, position: 'absolute' }}>
                {m.label}
              </div>
            ))}
          </div>
        )}
        {/* Column header */}
        <div className={cn('border-b border-border flex sticky z-10 bg-card', monthHeaders.length > 0 ? 'top-6' : 'top-0')} style={{ height: monthHeaders.length > 0 ? 28 : 40 }}>
          {headerLabels.map((h, i) => (
            <div key={i} className="flex flex-col items-center justify-center border-r border-border/30 flex-shrink-0" style={{ width: h.width }}>
              <span className="text-[11px] font-medium">{h.label}</span>
              {h.subLabel && <span className="text-[9px] text-muted-foreground">{h.subLabel}</span>}
            </div>
          ))}
        </div>

        {/* Rows + bars */}
        <div className="relative" style={{ height: rows.length * ROW_HEIGHT }}>
          {/* Grid lines */}
          {headerLabels.map((h, i) => (
            <div key={i} className="absolute top-0 bottom-0 border-r border-border/20" style={{ left: h.x + h.width }} />
          ))}

          {/* Row backgrounds */}
          {rows.map((_, i) => (
            <div key={i} className={cn('absolute w-full border-b border-border/10', i % 2 === 0 ? 'bg-transparent' : 'bg-muted/20')} style={{ top: i * ROW_HEIGHT, height: ROW_HEIGHT }} />
          ))}

          {/* Today line */}
          {showToday && (
            <div className="absolute top-0 bottom-0 w-px bg-destructive/60 z-20" style={{ left: todayX }}>
              <div className="absolute -top-1 -left-1.5 w-3 h-3 rounded-full bg-destructive" />
            </div>
          )}

          {/* Bars */}
          {rows.map((row, i) => {
            const startDate = new Date(row.start_date);
            const endDate = new Date(row.end_date);
            const x = dayToX(startDate);
            const w = dayToX(addDays(endDate, 1)) - x;

            return (
              <GanttBar
                key={`${row.type}-${row.id}`}
                row={row}
                x={x}
                width={Math.max(w, 8)}
                y={i * ROW_HEIGHT}
                height={ROW_HEIGHT}
                onDragEnd={(newX) => {
                  const newStart = xToDate(newX);
                  const duration = differenceInDays(endDate, startDate);
                  const newEnd = addDays(newStart, duration);
                  onUpdateDates(row.type, row.id, format(newStart, 'yyyy-MM-dd'), format(newEnd, 'yyyy-MM-dd'));
                }}
                onResizeEnd={(newX, newW) => {
                  const newStart = xToDate(newX);
                  const newEnd = xToDate(newX + newW);
                  onUpdateDates(row.type, row.id, format(newStart, 'yyyy-MM-dd'), format(newEnd, 'yyyy-MM-dd'));
                }}
              />
            );
          })}

          {/* Dependency lines */}
          <DependencyLines
            dependencies={dependencies}
            rows={rows}
            rowHeight={ROW_HEIGHT}
            dayToX={dayToX}
            tasks={tasks}
          />
        </div>
      </div>
    </div>
  );
});

GanttTimeline.displayName = 'GanttTimeline';
