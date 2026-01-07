/**
 * Overlay visuel pour les zones dynamiques protégées
 * Ces zones ne peuvent pas être modifiées dans l'éditeur
 */

import { useState } from "react";
import type { DynamicZone } from "@/types/pdf-template";
import { getDynamicZoneExplanation, blockDynamicZoneEdit } from "@/lib/template-protection";
import { 
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogAction
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Lock, Table, Settings, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DynamicZoneOverlayProps {
  zone: DynamicZone;
  style?: React.CSSProperties;
  className?: string;
  isSelected?: boolean;
  isEditable?: boolean;
}

const ZONE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'invest_table': Table,
  'location_block': Settings,
  'options_block': Settings,
};

export function DynamicZoneOverlay({ zone, style, className, isSelected, isEditable }: DynamicZoneOverlayProps) {
  const [showDialog, setShowDialog] = useState(false);
  
  const Icon = ZONE_ICONS[zone.type] || Table;
  const error = blockDynamicZoneEdit(zone.id);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditable) {
      setShowDialog(true);
    }
  };

  return (
    <>
      <div
        className={cn(
          "h-full w-full bg-warning/10 border-2 border-warning border-dashed rounded-lg",
          "transition-colors",
          isEditable ? "cursor-grab hover:bg-warning/20" : "cursor-not-allowed hover:bg-warning/15",
          isSelected && "bg-warning/20 border-solid",
          className
        )}
        style={style}
        onClick={handleClick}
        title={isEditable ? "Glisser pour déplacer la zone" : "Zone dynamique protégée - Cliquez pour plus d'informations"}
      >
        {/* Header de la zone */}
        <div className={cn(
          "flex items-center gap-2 p-2 text-warning-foreground rounded-t-md",
          isSelected ? "bg-primary" : "bg-warning/90"
        )}>
          <Lock className="h-3 w-3" />
          <span className="text-xs font-medium truncate flex-1">
            {isEditable ? "Zone déplaçable" : "Zone dynamique"}
          </span>
          <Badge variant="outline" className="text-[10px] h-4 bg-background/20 border-warning-foreground/30">
            {isEditable ? "Glisser" : "Lecture seule"}
          </Badge>
        </div>
        
        {/* Contenu de la zone */}
        <div className="flex-1 flex flex-col items-center justify-center p-3 text-center min-h-0">
          <Icon className="h-6 w-6 text-warning/60 mb-1" />
          <p className="text-[10px] font-medium text-warning-foreground/80 line-clamp-2">
            {zone.description}
          </p>
          <p className="text-[8px] text-muted-foreground mt-1">
            Source : <span className="font-mono">{zone.sourceSheet}</span>
          </p>
          {zone.isRequired && (
            <Badge variant="destructive" className="mt-1 text-[8px] h-4">
              Requis
            </Badge>
          )}
        </div>
      </div>

      {/* Dialog explicatif */}
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Zone protégée : {zone.id}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>{getDynamicZoneExplanation(zone)}</p>
              
              <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type :</span>
                  <span className="font-medium">{zone.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Source :</span>
                  <span className="font-mono text-xs bg-background px-2 py-1 rounded">
                    {zone.sourceSheet}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Page :</span>
                  <span className="font-medium">{zone.pageNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Obligatoire :</span>
                  <Badge variant={zone.isRequired ? 'destructive' : 'secondary'}>
                    {zone.isRequired ? 'Oui' : 'Non'}
                  </Badge>
                </div>
              </div>

              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm">
                <p className="font-medium text-destructive mb-1">
                  {error.cause}
                </p>
                <p className="text-muted-foreground text-xs">
                  {error.action}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Compris</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
