import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Link2, FolderPlus, Layers } from 'lucide-react';
import { STATUS_LABELS, PRIORITY_LABELS } from '@/types/gantt';
import type { GanttProject, GanttStatus, GanttPriority } from '@/types/gantt';
import type { Commercial } from '@/data/commerciaux';

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  projects: GanttProject[];
  filterProject: string;
  onFilterProjectChange: (v: string) => void;
  commerciaux: Commercial[];
  filterOwner: string;
  onFilterOwnerChange: (v: string) => void;
  filterStatus: string;
  onFilterStatusChange: (v: string) => void;
  filterPriority: string;
  onFilterPriorityChange: (v: string) => void;
  onCreateMilestone: () => void;
  onCreateProject: () => void;
  onCreateDependency: () => void;
}

export function GanttFilters({
  search, onSearchChange,
  projects, filterProject, onFilterProjectChange,
  commerciaux, filterOwner, onFilterOwnerChange,
  filterStatus, onFilterStatusChange,
  filterPriority, onFilterPriorityChange,
  onCreateMilestone, onCreateProject, onCreateDependency,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher axe, projet, tâche, responsable..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      <Select value={filterProject} onValueChange={onFilterProjectChange}>
        <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Projet" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les projets</SelectItem>
          {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={filterOwner} onValueChange={onFilterOwnerChange}>
        <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Responsable" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous</SelectItem>
          {commerciaux.map(c => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={filterStatus} onValueChange={onFilterStatusChange}>
        <SelectTrigger className="w-32 h-9"><SelectValue placeholder="Statut" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous</SelectItem>
          {(Object.entries(STATUS_LABELS) as [GanttStatus, string][]).map(([k, v]) => (
            <SelectItem key={k} value={k}>{v}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filterPriority} onValueChange={onFilterPriorityChange}>
        <SelectTrigger className="w-32 h-9"><SelectValue placeholder="Priorité" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes</SelectItem>
          {(Object.entries(PRIORITY_LABELS) as [GanttPriority, string][]).map(([k, v]) => (
            <SelectItem key={k} value={k}>{v}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button onClick={onCreateMilestone} size="sm" className="gap-1.5">
        <Layers className="h-4 w-4" /> Créer un axe
      </Button>

      <Button onClick={onCreateProject} variant="secondary" size="sm" className="gap-1.5">
        <FolderPlus className="h-4 w-4" /> Créer un projet
      </Button>

      <Button onClick={onCreateDependency} variant="outline" size="sm" className="gap-1.5">
        <Link2 className="h-4 w-4" /> Dépendance
      </Button>
    </div>
  );
}
