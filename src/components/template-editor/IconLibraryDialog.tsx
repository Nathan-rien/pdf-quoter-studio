/**
 * Dialog modal pour sélectionner une icône depuis la bibliothèque Lucide
 */

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IconPicker } from "./IconPicker";
import { icons } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";

interface IconLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (iconName: string) => void;
  currentIcon?: string;
}

export function IconLibraryDialog({
  open,
  onOpenChange,
  onSelect,
  currentIcon,
}: IconLibraryDialogProps) {
  const [selectedIcon, setSelectedIcon] = useState<string | undefined>(currentIcon);

  const handleConfirm = useCallback(() => {
    if (selectedIcon) {
      onSelect(selectedIcon);
      onOpenChange(false);
    }
  }, [selectedIcon, onSelect, onOpenChange]);

  const handleCancel = useCallback(() => {
    setSelectedIcon(currentIcon);
    onOpenChange(false);
  }, [currentIcon, onOpenChange]);

  // Récupérer l'icône sélectionnée pour la prévisualisation
  const SelectedIconComponent = selectedIcon 
    ? (icons as Record<string, LucideIcon>)[selectedIcon]
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Bibliothèque d'icônes
          </DialogTitle>
          <DialogDescription>
            Plus de 1400 icônes disponibles. Recherchez ou parcourez par catégorie.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <IconPicker
            value={selectedIcon}
            onChange={setSelectedIcon}
            maxHeight={350}
          />
        </div>

        {/* Prévisualisation de l'icône sélectionnée */}
        {selectedIcon && SelectedIconComponent && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-background border">
              <SelectedIconComponent className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium">{selectedIcon}</p>
              <p className="text-xs text-muted-foreground">
                Cliquez sur Confirmer pour ajouter cette icône
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel}>
            Annuler
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedIcon}>
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
