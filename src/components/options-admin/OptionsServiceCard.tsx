import { useState } from "react";
import { ServiceOptionDefinition, ServiceItem } from "@/types/options-admin";
import { useOptionsAdminStore } from "@/stores/optionsAdminStore";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ServiceItemEditor } from "./ServiceItemEditor";
import { 
  Trash2, 
  Plus, 
  Euro,
  X,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface OptionsServiceCardProps {
  option: ServiceOptionDefinition;
}

// Helper pour migrer les anciens services (string) vers le nouveau format (ServiceItem)
const migrateService = (service: string | ServiceItem): ServiceItem => {
  return typeof service === 'string' ? { text: service } : service;
};

export function OptionsServiceCard({ option }: OptionsServiceCardProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingSubtitle, setIsEditingSubtitle] = useState(false);
  const [localTitle, setLocalTitle] = useState(option.title);
  const [localSubtitle, setLocalSubtitle] = useState(option.subtitle || "");
  const [showPriceEditor, setShowPriceEditor] = useState(!!option.price);
  const [priceAmount, setPriceAmount] = useState(option.price?.amount?.toString() || "");
  const [priceUnit, setPriceUnit] = useState(option.price?.unit || "€ HT / mois");
  const [localErp, setLocalErp] = useState(option.erpReference || "");

  const {
    options: allOptions,
    updateOption,
    deleteOption,
    addServiceToOption,
    updateService,
    removeService,
    addSubItemToService,
    updateSubItem,
    removeSubItem,
    setOptionPrice,
    removeOptionPrice,
    toggleOptionActive,
  } = useOptionsAdminStore();

  const isPack = option.kind === 'pack';
  const packableOptions = allOptions.filter((o) => o.id !== option.id && (o.kind ?? 'option') === 'option');
  const packServiceIds = option.packServiceIds ?? [];

  const togglePackService = (id: string) => {
    const next = packServiceIds.includes(id)
      ? packServiceIds.filter((x) => x !== id)
      : [...packServiceIds, id];
    updateOption(option.id, { packServiceIds: next });
  };

  const handleErpBlur = () => {
    const next = localErp.trim() || undefined;
    if (next !== option.erpReference) {
      updateOption(option.id, { erpReference: next });
    }
  };

  // Migrer les services pour l'affichage
  const services: ServiceItem[] = option.services.map(migrateService);

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (localTitle.trim() && localTitle !== option.title) {
      updateOption(option.id, { title: localTitle.trim() });
    }
  };

  const handleSubtitleBlur = () => {
    setIsEditingSubtitle(false);
    const newSubtitle = localSubtitle.trim() || undefined;
    if (newSubtitle !== option.subtitle) {
      updateOption(option.id, { subtitle: newSubtitle });
    }
  };

  const handleAddService = () => {
    addServiceToOption(option.id, "Nouveau service");
  };

  const handlePriceSave = () => {
    const raw = priceAmount.trim();
    if (raw === "") {
      // Champ vidé => l'option repasse "sans prix" (l'éditeur reste ouvert)
      if (option.price) removeOptionPrice(option.id);
      return;
    }
    const amount = parseFloat(raw.replace(",", "."));
    if (isNaN(amount) || amount < 0) return;
    setOptionPrice(option.id, amount, priceUnit.trim() || "€ HT / mois");
  };

  const handleRemovePrice = () => {
    removeOptionPrice(option.id);
    setShowPriceEditor(false);
    setPriceAmount("");
    setPriceUnit("€ HT / mois");
  };

  return (
    <Card className={option.isActive ? "" : "opacity-60"}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="py-3 px-4">
          <div className="flex items-center gap-3">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {isEditingTitle ? (
                  <Input
                    value={localTitle}
                    onChange={(e) => setLocalTitle(e.target.value)}
                    onBlur={handleTitleBlur}
                    onKeyDown={(e) => e.key === 'Enter' && handleTitleBlur()}
                    className="h-7 text-sm font-semibold"
                    autoFocus
                  />
                ) : (
                  <span 
                    className="font-semibold cursor-text hover:bg-muted/50 px-2 py-0.5 rounded"
                    onClick={() => setIsEditingTitle(true)}
                  >
                    {option.title}
                  </span>
                )}
                {isPack && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-primary/10 text-primary border border-primary/30">
                    Pack
                  </span>
                )}
                {(option.subtitle || isEditingSubtitle) && (
                  <>
                    {isEditingSubtitle ? (
                      <Input
                        value={localSubtitle}
                        onChange={(e) => setLocalSubtitle(e.target.value)}
                        onBlur={handleSubtitleBlur}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubtitleBlur()}
                        placeholder="Sous-titre..."
                        className="h-7 text-sm text-muted-foreground w-40"
                        autoFocus
                      />
                    ) : (
                      <span 
                        className="text-sm text-muted-foreground cursor-text hover:bg-muted/50 px-1 py-0.5 rounded"
                        onClick={() => setIsEditingSubtitle(true)}
                      >
                        ({option.subtitle})
                      </span>
                    )}
                  </>
                )}
                {!option.subtitle && !isEditingSubtitle && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-muted-foreground"
                    onClick={() => setIsEditingSubtitle(true)}
                  >
                    + Sous-titre
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {option.price ? (
                <span className="text-sm font-medium text-primary">
                  {option.price.amount.toFixed(2)} {option.price.unit}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">(sans prix)</span>
              )}

              <label
                className={`flex items-center gap-2 text-xs cursor-pointer rounded-md border px-2 py-1 ${
                  (option.requiresIntervention ?? true)
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5"
                  checked={option.requiresIntervention ?? true}
                  onChange={(e) =>
                    updateOption(option.id, { requiresIntervention: e.target.checked })
                  }
                />
                {(option.requiresIntervention ?? true) ? "Avec intervention" : "Sans intervention"}
              </label>

              <div className="flex items-center gap-2 pl-2 border-l border-border">
                <Switch
                  checked={option.isActive}
                  onCheckedChange={() => toggleOptionActive(option.id)}
                />
                <Label className="text-xs text-muted-foreground">
                  {option.isActive ? "Actif (visible dans les propositions)" : "Inactif (masqué)"}
                </Label>
              </div>


              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer cette option ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      L'option "{option.title}" sera définitivement supprimée. Cette action est irréversible.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteOption(option.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 px-4">
            <div className="pl-9 space-y-2">
              {/* Services list */}
              <div className="space-y-1">
                {services.map((service, index) => (
                  <ServiceItemEditor
                    key={index}
                    service={service}
                    onChange={(newValue) => updateService(option.id, index, newValue)}
                    onDelete={() => removeService(option.id, index)}
                    canDelete={services.length > 1}
                    onAddSubItem={() => addSubItemToService(option.id, index, "Nouvelle précision")}
                    onUpdateSubItem={(subIndex, value) => updateSubItem(option.id, index, subIndex, value)}
                    onDeleteSubItem={(subIndex) => removeSubItem(option.id, index, subIndex)}
                  />
                ))}
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={handleAddService}
              >
                <Plus className="h-3 w-3 mr-1" />
                Ajouter un service
              </Button>

              {/* Price editor */}
              <div className="pt-3 border-t border-border mt-3">
                {showPriceEditor || option.price ? (
                  <div className="flex items-center gap-2">
                    <Euro className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={priceAmount}
                      onChange={(e) => setPriceAmount(e.target.value)}
                      onBlur={handlePriceSave}
                      className="w-24 h-8 text-sm"
                    />
                    <Input
                      placeholder="€ HT / mois"
                      value={priceUnit}
                      onChange={(e) => setPriceUnit(e.target.value)}
                      onBlur={handlePriceSave}
                      className="flex-1 h-8 text-sm"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={handleRemovePrice}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={() => setShowPriceEditor(true)}
                  >
                    <Euro className="h-3 w-3 mr-1" />
                    Ajouter un prix
                  </Button>
                )}
              </div>


              {/* Composition du pack */}
              {isPack && (
                <div className="pt-3 border-t border-border mt-3">
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    Services inclus dans ce pack
                  </Label>
                  {packableOptions.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">Aucune option disponible.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-48 overflow-y-auto">
                      {packableOptions.map((o) => (
                        <label key={o.id} className="flex items-center gap-2 text-xs cursor-pointer p-1 rounded hover:bg-muted/50">
                          <input
                            type="checkbox"
                            checked={packServiceIds.includes(o.id)}
                            onChange={() => togglePackService(o.id)}
                            className="h-3.5 w-3.5"
                          />
                          <span className="truncate">{o.title}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Référence ERP (JAJA) — admin only */}
              <div className="pt-3 border-t border-border mt-3 flex items-center gap-2">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">
                  Référence ERP (JAJA)
                </Label>
                <Input
                  value={localErp}
                  onChange={(e) => setLocalErp(e.target.value)}
                  onBlur={handleErpBlur}
                  placeholder="Optionnel"
                  className="h-8 text-sm max-w-xs"
                />
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
