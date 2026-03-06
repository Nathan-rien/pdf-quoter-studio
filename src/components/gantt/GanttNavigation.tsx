import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import type { ZoomLevel } from '@/types/gantt';
import { cn } from '@/lib/utils';

interface Props {
  zoom: ZoomLevel;
  onZoomChange: (z: ZoomLevel) => void;
  onNavigate: (dir: 'prev' | 'next' | 'today') => void;
}

const zoomOptions: { value: ZoomLevel; label: string }[] = [
  { value: 'day', label: 'Jour' },
  { value: 'week', label: 'Semaine' },
];

export function GanttNavigation({ zoom, onZoomChange, onNavigate }: Props) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={() => onNavigate('prev')}>
          <ChevronLeft className="h-4 w-4" />
          Précédent
        </Button>
        <Button variant="outline" size="sm" onClick={() => onNavigate('today')} className="gap-1">
          <Calendar className="h-3.5 w-3.5" />
          Aujourd'hui
        </Button>
        <Button variant="outline" size="sm" onClick={() => onNavigate('next')}>
          Suivant
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
        {zoomOptions.map(opt => (
          <button
            key={opt.value}
            className={cn(
              'px-3 py-1 text-sm rounded-md transition-colors',
              zoom === opt.value ? 'bg-background text-foreground shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => onZoomChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
