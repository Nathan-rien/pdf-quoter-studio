import { useState } from "react";
import { useTemplateEditorStore } from "@/stores/templateEditorStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import type { DynamicZoneType } from "@/types/pdf-template";
import { User, Table, ListChecks, FileSignature, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SERVICE_DATA_TYPES = [
  {
    type: "service_client_info" as DynamicZoneType,
    label: "Client",
    description: "Raison sociale, adresse, SIRET et contact du bénéficiaire",
    sourceSheet: "client",
    icon: User,
    color: "text-blue-600 bg-blue-50 border-blue-200",
    required: true,
  },
  {
    type: "service_conditions" as DynamicZoneType,
    label: "Données contrat",
    description: "Durée, date de démarrage, périodicité, mode de règlement, services souscrits",
    sourceSheet: "données",
    icon: ListChecks,
    color: "text-purple-600 bg-purple-50 border-purple-200",
    required: false,
  },
  {
    type: "service_invest_table" as DynamicZoneType,
    label: "Tableau Invest",
    description: "Tableau des lignes produits avec désignation, quantité et prix HT",
    sourceSheet: "invest",
    icon: Table,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    required: false,
  },
  {
    type: "service_signature" as DynamicZoneType,
    label: "Signatures",
    description: "Bloc de signature avec les noms du commercial Cybertek et du client",
    sourceSheet: "client",
    icon: FileSignature,
    color: "text-orange-600 bg-orange-50 border-orange-200",
    required: true,
  },
  {
    type: "service_options" as DynamicZoneType,
    label: "Options disponibles",
    description: "Liste des options disponibles sélectionnées avec leurs prix",
    sourceSheet: "options",
    icon: ListChecks,
    color: "text-amber-600 bg-amber-50 border-amber-200",
    required: false,
  },
];

export function DynamicZoneManager() {
  const [selectedType, setSelectedType] = useState<DynamicZoneType | null>(null);
  const [selectedPage, setSelectedPage] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState<string | null>(null);

  const {
    currentVersion,
    selectedPageNumber,
    addDynamicZone,
    removeDynamicZone,
    getAllDynamicZones,
  } = useTemplateEditorStore();

  if (!currentVersion) {
    return null;
  }

  const isEditable = currentVersion.status === "brouillon";
  const allZones = getAllDynamicZones();

  const getZonePage = (type: DynamicZoneType): number | null => {
    const zone = allZones.find((z) => z.type === type);
    return zone ? zone.pageNumber : null;
  };

  const handleConfirmAdd = () => {
    if (!selectedType || !selectedPage) return;

    const typeDef = SERVICE_DATA_TYPES.find((t) => t.type === selectedType);
    if (!typeDef) return;

    const existingZone = allZones.find((z) => z.type === selectedType);
    if (existingZone) {
      removeDynamicZone(existingZone.id);
    }

    const pageNum = parseInt(selectedPage, 10);
    addDynamicZone(pageNum, selectedType, typeDef.required, typeDef.description);

    toast.success(`Bloc "${typeDef.label}" ajouté sur la page ${pageNum}`);
    setSelectedType(null);
    setSelectedPage("");
  };

  const handleCardClick = (type: DynamicZoneType) => {
    if (!isEditable) return;

    if (selectedType === type) {
      setSelectedType(null);
      setSelectedPage("");
    } else {
      setSelectedType(type);
      setSelectedPage(String(selectedPageNumber));
    }
  };

  const handleDeleteZone = (type: DynamicZoneType) => {
    const zone = allZones.find((z) => z.type === type);
    if (!zone) return;
    setZoneToDelete(zone.id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (zoneToDelete) {
      removeDynamicZone(zoneToDelete);
      toast.success("Zone supprimée");
    }
    setDeleteDialogOpen(false);
    setZoneToDelete(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs uppercase text-muted-foreground tracking-wide">
            Données dynamiques
          </CardTitle>
          <p className="text-[10px] text-muted-foreground">
            Cliquez sur un type pour l&apos;associer à une page du document.
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {SERVICE_DATA_TYPES.map((typeDef) => {
            const Icon = typeDef.icon;
            const placedOnPage = getZonePage(typeDef.type);
            const isSelected = selectedType === typeDef.type;
            const isPlaced = placedOnPage !== null;

            return (
              <div key={typeDef.type}>
                <div
                  className={cn(
                    "rounded-lg border p-3 transition-colors",
                    isEditable ? "cursor-pointer" : "opacity-60 cursor-default",
                    isSelected && "ring-2 ring-primary border-primary",
                    isPlaced && !isSelected && "border-emerald-300 bg-emerald-50/50",
                    !isPlaced && !isSelected && "border-border bg-card"
                  )}
                  onClick={() => handleCardClick(typeDef.type)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border",
                        typeDef.color
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold">{typeDef.label}</span>
                        {typeDef.required && (
                          <Badge variant="secondary" className="text-[9px] h-4 px-1">
                            Requis
                          </Badge>
                        )}
                        {isPlaced && (
                          <Badge className="text-[9px] h-4 px-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
                            <CheckCircle2 className="h-3 w-3 mr-0.5" />
                            Page {placedOnPage}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                        {typeDef.description}
                      </p>
                    </div>
                    {isPlaced && isEditable && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteZone(typeDef.type);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>

                {isSelected && isEditable && (
                  <div className="mt-2 pl-3 border-l-4 border-primary/30 bg-muted/30 rounded-r p-3 space-y-2">
                    <p className="text-xs font-medium">Sur quelle page placer ce bloc ?</p>
                    <Select value={selectedPage} onValueChange={setSelectedPage}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Choisir une page..." />
                      </SelectTrigger>
                      <SelectContent>
                        {currentVersion.pages.map((p) => (
                          <SelectItem
                            key={p.pageNumber}
                            value={String(p.pageNumber)}
                            className="text-xs"
                          >
                            Page {p.pageNumber} — {(p as any).title || `Page ${p.pageNumber}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        disabled={!selectedPage}
                        onClick={handleConfirmAdd}
                      >
                        Confirmer
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          setSelectedType(null);
                          setSelectedPage("");
                        }}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer cette zone ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les données de cette zone ne seront plus injectées automatiquement lors de la génération du PDF.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
