/**
 * Dialogue de création de page avec choix de position
 */

import { useState, useEffect } from "react";
import { useTemplateEditorStore } from "@/stores/templateEditorStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilePlus } from "lucide-react";

interface CreatePageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (title: string, afterPageNumber: number | null) => void;
  defaultAfterPage?: number;
}

export function CreatePageDialog({
  open,
  onOpenChange,
  onConfirm,
  defaultAfterPage,
}: CreatePageDialogProps) {
  const { currentVersion } = useTemplateEditorStore();
  const pages = currentVersion?.pages || [];

  const [title, setTitle] = useState("Nouvelle page");
  const [position, setPosition] = useState<string>("end");

  // Réinitialiser les valeurs quand le dialogue s'ouvre
  useEffect(() => {
    if (open) {
      setTitle("Nouvelle page");
      // Si une page par défaut est fournie, l'utiliser comme position
      if (defaultAfterPage !== undefined && defaultAfterPage > 0) {
        setPosition(`after-${defaultAfterPage}`);
      } else {
        setPosition("end");
      }
    }
  }, [open, defaultAfterPage]);

  const handleConfirm = () => {
    let afterPageNumber: number | null = null;

    if (position === "start") {
      afterPageNumber = 0; // Signal pour insérer au début
    } else if (position === "end") {
      afterPageNumber = null; // Insérer à la fin
    } else if (position.startsWith("after-")) {
      const parsed = parseInt(position.replace("after-", ""), 10);
      afterPageNumber = isNaN(parsed) ? null : parsed;
    }

    console.log('[CreatePageDialog] Position:', position, '-> afterPageNumber:', afterPageNumber);
    onConfirm(title.trim() || "Nouvelle page", afterPageNumber);
  };

  // Générer les titres des pages pour le menu
  const getPageTitle = (pageNumber: number): string => {
    // Titres par défaut pour les pages protégées
    const defaultTitles: Record<number, string> = {
      4: "Offre neuf + rachat",
      5: "Offre matériel neuf",
      6: "Offre de services",
    };
    return defaultTitles[pageNumber] || `Page ${pageNumber}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FilePlus className="h-5 w-5" />
            Ajouter une nouvelle page
          </DialogTitle>
          <DialogDescription>
            Choisissez un titre et la position de la nouvelle page dans le
            document.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Champ titre */}
          <div className="space-y-2">
            <Label htmlFor="page-title">Titre (optionnel)</Label>
            <Input
              id="page-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nouvelle page"
            />
          </div>

          {/* Sélecteur de position */}
          <div className="space-y-2">
            <Label htmlFor="page-position">Position</Label>
            <Select value={position} onValueChange={setPosition}>
              <SelectTrigger id="page-position">
                <SelectValue placeholder="Choisir la position" />
              </SelectTrigger>
              <SelectContent>
                {/* Option début */}
                <SelectItem value="start">
                  Au début (avant page 1)
                </SelectItem>

                {/* Options après chaque page existante */}
                {pages.map((page) => (
                  <SelectItem
                    key={`after-${page.pageNumber}`}
                    value={`after-${page.pageNumber}`}
                  >
                    Après page {page.pageNumber} — {getPageTitle(page.pageNumber)}
                  </SelectItem>
                ))}

                {/* Option fin (si différent de "après dernière page") */}
                {pages.length > 0 && (
                  <SelectItem value="end">
                    À la fin (après page {pages[pages.length - 1]?.pageNumber})
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleConfirm}>Ajouter</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
