import { forwardRef, useMemo, useCallback, useState, useRef, useEffect, useImperativeHandle } from 'react';
import { differenceInDays, addDays, format, eachDayOfInterval, isWeekend, getISOWeek, getISOWeekYear, getYear } from 'date-fns';
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
  getOwnerName?: (id: string | null | undefined) => string;
  rowHeights?: number[];
}

const DEFAULT_ROW_HEIGHT = 40;
const END_DATE = new Date(2027, 11, 31);

const getColWidth = (zoom: ZoomLevel) => {
  switch (zoom) {
    case 'day': return 40;
    case 'week': return 24;
    case 'month': return 8;
    case 'year': return 6;
  }
};

export const GanttTimeline = forwardRef<HTMLDivElement, Props>(({ rows, zoom, viewStart, onUpdateDates, dependencies, tasks, getOwnerName, rowHeights = [] }, ref) => {
  const colWidth = getColWidth(zoom);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);

  useImperativeHandle(ref, () => innerRef.current!);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const onScroll = () => setScrollLeft(el.scrollLeft);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Always work with workdays
  const workDays = useMemo(() => {
    const allDays = eachDayOfInterval({ start: viewStart, end: END_DATE });
    return allDays.filter(d => !isWeekend(d));
  }, [viewStart]);

  const totalWidth = workDays.length * colWidth;

  // Current week detection
  const now = new Date();
  const currentISOWeek = getISOWeek(now);
  const currentISOWeekYear = getISOWeekYear(now);

  // Group days by year
  const yearGroups = useMemo(() => {
    const groups: { label: string; x: number; width: number }[] = [];
    let currentYear = -1;
    let startIdx = 0;
    workDays.forEach((d, i) => {
      const y = getYear(d);
      if (y !== currentYear) {
        if (currentYear !== -1) {
          groups.push({ label: String(currentYear), x: startIdx * colWidth, width: (i - startIdx) * colWidth });
        }
        currentYear = y;
        startIdx = i;
      }
    });
    if (currentYear !== -1) {
      groups.push({ label: String(currentYear), x: startIdx * colWidth, width: (workDays.length - startIdx) * colWidth });
    }
    return groups;
  }, [workDays, colWidth]);

  // Group days by month
  const monthGroups = useMemo(() => {
    const groups: { label: string; x: number; width: number }[] = [];
    let currentMonth = '';
    let startIdx = 0;
    workDays.forEach((d, i) => {
      const m = format(d, 'MMMM yyyy', { locale: fr });
      if (m !== currentMonth) {
        if (currentMonth) {
          groups.push({ label: currentMonth, x: startIdx * colWidth, width: (i - startIdx) * colWidth });
        }
        currentMonth = m;
        startIdx = i;
      }
    });
    if (currentMonth) {
      groups.push({ label: currentMonth, x: startIdx * colWidth, width: (workDays.length - startIdx) * colWidth });
    }
    return groups;
  }, [workDays, colWidth]);

  // Group days by ISO week
  const weekGroups = useMemo(() => {
    const groups: { label: string; x: number; width: number; isCurrent: boolean }[] = [];
    let currentWeekKey = '';
    let startIdx = 0;
    let currentWeekNum = 0;
    let currentWeekYr = 0;
    workDays.forEach((d, i) => {
      const wk = getISOWeek(d);
      const yr = getISOWeekYear(d);
      const key = `${yr}-${wk}`;
      if (key !== currentWeekKey) {
        if (currentWeekKey) {
          groups.push({
            label: `S${currentWeekNum}`,
            x: startIdx * colWidth,
            width: (i - startIdx) * colWidth,
            isCurrent: currentWeekNum === currentISOWeek && currentWeekYr === currentISOWeekYear,
          });
        }
        currentWeekKey = key;
        currentWeekNum = wk;
        currentWeekYr = yr;
        startIdx = i;
      }
    });
    if (currentWeekKey) {
      groups.push({
        label: `S${currentWeekNum}`,
        x: startIdx * colWidth,
        width: (workDays.length - startIdx) * colWidth,
        isCurrent: currentWeekNum === currentISOWeek && currentWeekYr === currentISOWeekYear,
      });
    }
    return groups;
  }, [workDays, colWidth, currentISOWeek, currentISOWeekYear]);

  // dayToX based on workday index
  const dayToX = useCallback((date: Date) => {
    const t = date.getTime();
    let lo = 0, hi = workDays.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (workDays[mid].getTime() < t) lo = mid + 1;
      else hi = mid;
    }
    // Check if lo-1 is closer
    if (lo > 0 && Math.abs(workDays[lo - 1].getTime() - t) < Math.abs(workDays[lo].getTime() - t)) {
      lo = lo - 1;
    }
    return lo * colWidth;
  }, [workDays, colWidth]);

  const xToDate = useCallback((x: number) => {
    const idx = Math.round(x / colWidth);
    const clampedIdx = Math.max(0, Math.min(idx, workDays.length - 1));
    return workDays[clampedIdx];
  }, [workDays, colWidth]);

  // Today line
  const todayX = dayToX(new Date());
  const showToday = todayX >= 0 && todayX <= totalWidth;

  const showDayLabels = zoom === 'day' || zoom === 'week';
  const isYearView = zoom === 'year';

  // Determine header groups based on zoom
  const header1Groups = isYearView ? yearGroups : monthGroups;
  const header2Groups = isYearView ? monthGroups : weekGroups;

  return (
    <div ref={innerRef} className="flex-1 overflow-x-auto overflow-y-auto relative">
      <div style={{ width: totalWidth, minWidth: '100%' }}>
        {/* Header Level 1 */}
        <div className="border-b border-border flex bg-muted/30 sticky top-0 z-20" style={{ width: totalWidth, height: 32 }}>
          {header1Groups.map((m, i) => (
            <div
              key={i}
              className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center justify-center border-r border-border/50 truncate"
              style={{ width: m.width, left: m.x, position: 'absolute' }}
            >
              {m.width > 40 ? m.label : m.width > 20 ? m.label.substring(0, 3) : ''}
            </div>
          ))}
        </div>

        {/* Header Level 2 */}
        <div className="border-b border-border flex sticky top-[32px] z-20" style={{ width: totalWidth, height: 28 }}>
          {header2Groups.map((w, i) => (
            <div
              key={i}
              className={cn(
                'text-[11px] font-medium flex items-center justify-center border-r border-border/40 truncate',
                'isCurrent' in w && w.isCurrent ? 'bg-destructive/15 text-destructive font-bold' : 'bg-card text-muted-foreground'
              )}
              style={{ width: w.width, left: w.x, position: 'absolute' }}
            >
              {w.width > 15 ? w.label : ''}
            </div>
          ))}
        </div>

        {/* Header Level 3 — Days (hidden for month/year) */}
        {(zoom === 'day' || zoom === 'week') && (
          <div className={cn('border-b border-border flex sticky z-20', 'top-[60px]')} style={{ height: showDayLabels ? 24 : 12, width: totalWidth }}>
            {workDays.map((d, i) => (
              <div
                key={i}
                className="flex items-center justify-center border-r border-border/20 flex-shrink-0"
                style={{ width: colWidth }}
              >
                {showDayLabels && (
                  <span className="text-[9px] text-muted-foreground truncate">
                    {format(d, 'd', { locale: fr })}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Rows + bars */}
        <div className="relative" style={{ height: rows.reduce((sum, _, i) => sum + (rowHeights[i] || DEFAULT_ROW_HEIGHT), 0) }}>
          {/* Grid lines — adapted to zoom level */}
          {(isYearView || zoom === 'month' ? monthGroups : weekGroups).map((g, i) => (
            <div key={i} className="absolute top-0 bottom-0 border-r border-border/20" style={{ left: g.x + g.width }} />
          ))}

          {/* Row backgrounds */}
          {rows.map((_, i) => {
            const rowTop = rows.slice(0, i).reduce((sum, __, j) => sum + (rowHeights[j] || DEFAULT_ROW_HEIGHT), 0);
            const rowH = rowHeights[i] || DEFAULT_ROW_HEIGHT;
            return (
              <div key={i} className={cn('absolute w-full border-b border-border/10', i % 2 === 0 ? 'bg-transparent' : 'bg-muted/20')} style={{ top: rowTop, height: rowH }} />
            );
          })}

          {/* Today line */}
          {showToday && (
            <div className="absolute top-0 bottom-0 w-px bg-destructive/60 z-20" style={{ left: todayX }}>
              <div className="absolute -top-1 -left-1.5 w-3 h-3 rounded-full bg-destructive" />
            </div>
          )}

          {/* Bars */}
          {rows.map((row, i) => {
            const rowTop = rows.slice(0, i).reduce((sum, __, j) => sum + (rowHeights[j] || DEFAULT_ROW_HEIGHT), 0);
            const rowH = rowHeights[i] || DEFAULT_ROW_HEIGHT;

            // Milestones (Axes): render as colored section band, no bar
            if (row.type === 'milestone') {
              return (
                <div
                  key={`milestone-${row.id}`}
                  className="absolute w-full bg-orange-100/40 dark:bg-orange-900/20 border-t-2 border-orange-400/50"
                  style={{ top: rowTop, height: rowH }}
                />
              );
            }

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
                y={rowTop}
                height={rowH}
                scrollLeft={scrollLeft}
                getOwnerName={getOwnerName}
                onDragEnd={(newX) => {
                  const newStart = xToDate(newX);
                  const duration = differenceInDays(endDate, startDate);
                  const newEnd = addDays(newStart, duration);
                  onUpdateDates(row.type as 'project' | 'task' | 'subtask', row.id, format(newStart, 'yyyy-MM-dd'), format(newEnd, 'yyyy-MM-dd'));
                }}
                onResizeEnd={(newX, newW) => {
                  const newStart = xToDate(newX);
                  const newEnd = xToDate(newX + newW);
                  onUpdateDates(row.type as 'project' | 'task' | 'subtask', row.id, format(newStart, 'yyyy-MM-dd'), format(newEnd, 'yyyy-MM-dd'));
                }}
              />
            );
          })}

          {/* Dependency lines */}
          <DependencyLines
            dependencies={dependencies}
            rows={rows}
            rowHeight={DEFAULT_ROW_HEIGHT}
            rowHeights={rowHeights}
            dayToX={dayToX}
            tasks={tasks}
          />
        </div>
      </div>
    </div>
  );
});

GanttTimeline.displayName = 'GanttTimeline';
