/**
 * Gestionnaire de zones dynamiques
 * Permet d'ajouter, modifier et supprimer des zones dynamiques sur une page
 */

import { useState } from "react";
import { useTemplateEditorStore } from "@/stores/templateEditorStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AVAILABLE_ZONE_TYPES, DynamicZoneType } from "@/types/pdf-template";
import { Plus, Trash2, Table, Settings, FileText, Lock, User, ListChecks, Pen } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ZONE_ICONS: Record<DynamicZoneType, React.ComponentType<{ className?: string }>> = {
  invest_table: Table,
  options_block: Settings,
  location_block: FileText,
  service_client_info: User,
  service_invest_table: Table,
  service_conditions: ListChecks,
  service_signature: Pen,
};

export function DynamicZoneManager() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedZoneType, setSelectedZoneType] = useState<DynamicZoneType | null>(null);

  const {
    currentVersion,
    selectedPageNumber,
    getDynamicZonesForCurrentPage,
    addDynamicZone,
    updateDynamicZone,
    removeDynamicZone,
    selectedDynamicZoneId,
    selectDynamicZone,
  } = useTemplateEditorStore();

  const isEditable = currentVersion?.status === 'brouillon';
  const dynamicZones = getDynamicZonesForCurrentPage();

  const handleAddZone = () => {
    if (!selectedZoneType) return;
    
    const newZone = addDynamicZone(selectedPageNumber, selectedZoneType, false);
    if (newZone) {
      toast.success(`Zone "${AVAILABLE_ZONE_TYPES.find(z => z.type === selectedZoneType)?.label}" ajoutée`);
      setAddDialogOpen(false);
      setSelectedZoneType(null);
    }
  };

  const handleDeleteClick = (zoneId: string) => {
    setZoneToDelete(zoneId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (zoneToDelete) {
      const success = removeDynamicZone(zoneToDelete);
      if (success) {
        toast.success("Zone dynamique supprimée");
      }
    }
    setDeleteDialogOpen(false);
    setZoneToDelete(null);
  };

  const handleToggleRequired = (zoneId: string, isRequired: boolean) => {
    updateDynamicZone(zoneId, { isRequired });
  };

  if (dynamicZones.length === 0 && !isEditable) {
    return null;
  }

  return (
    <>
      <Card className="mt-2">
        <CardHeader className="pb-2 py-2 px-2">
          <CardTitle className="text-xs flex items-center gap-1.5">
            <Lock className="h-3 w-3" />
            Zones dynamiques ({dynamicZones.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 py-2 space-y-2">
          {dynamicZones.length === 0 ? (
            <p className="text-[10px] text-muted-foreground text-center py-2">
              Aucune zone dynamique sur cette page
            </p>
          ) : (
            <div className="space-y-1.5">
              {dynamicZones.map((zone) => {
                const Icon = ZONE_ICONS[zone.type];
                const isSelected = selectedDynamicZoneId === zone.id;
                
                return (
                  <div
                    key={zone.id}
                    className={cn(
                      "p-2 rounded border cursor-pointer transition-colors",
                      isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                    )}
                    onClick={() => selectDynamicZone(isSelected ? null : zone.id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Icon className="h-3 w-3 shrink-0 text-muted-foreground" />
                        <span className="text-[10px] font-medium truncate">
                          {zone.description}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {zone.isRequired && (
                          <Badge variant="secondary" className="text-[8px] h-4 px-1">
                            Requis
                          </Badge>
                        )}
                        {isEditable && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(zone.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {isSelected && isEditable && (
                      <div className="mt-2 pt-2 border-t space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px]">Obligatoire</Label>
                          <Switch
                            checked={zone.isRequired}
                            onCheckedChange={(checked) => handleToggleRequired(zone.id, checked)}
                          />
                        </div>
                        <div className="text-[9px] text-muted-foreground">
                          Source: {zone.sourceSheet}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {isEditable && (
            <>
              <Separator />
              <Button
                variant="outline"
                size="sm"
                className="w-full h-7 text-[10px] gap-1"
                onClick={() => setAddDialogOpen(true)}
              >
                <Plus className="h-3 w-3" />
                Ajouter une zone
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog d'ajout de zone */}
      <AlertDialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ajouter une zone dynamique</AlertDialogTitle>
            <AlertDialogDescription>
              Sélectionnez le type de zone à ajouter sur la page {selectedPageNumber}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <Select
              value={selectedZoneType || ""}
              onValueChange={(value) => setSelectedZoneType(value as DynamicZoneType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Type de zone..." />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_ZONE_TYPES.map((zoneType) => {
                  const Icon = ZONE_ICONS[zoneType.type];
                  return (
                    <SelectItem key={zoneType.type} value={zoneType.type}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{zoneType.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            
            {selectedZoneType && (
              <p className="mt-2 text-sm text-muted-foreground">
                {AVAILABLE_ZONE_TYPES.find(z => z.type === selectedZoneType)?.description}
              </p>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddZone} disabled={!selectedZoneType}>
              Ajouter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette zone dynamique ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les données de cette zone ne seront plus injectées automatiquement lors de la génération du PDF.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}