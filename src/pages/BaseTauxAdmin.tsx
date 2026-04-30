import { useState, useRef, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Database, FileSpreadsheet, Check, AlertCircle, Search, Filter, Pencil } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import type { BaseTauxEntry } from "@/data/base-taux";
import { useBaseTauxStore } from "@/stores/baseTauxStore";
import { cn } from "@/lib/utils";

// Compatibilité avec l'ancien API (utilisé ailleurs si besoin)
export function getBaseTauxData(): BaseTauxEntry[] {
  return useBaseTauxStore.getState().entries;
}

export function setBaseTauxData(data: BaseTauxEntry[]) {
  useBaseTauxStore.getState().setAll(data);
}

interface ImportResult {
  success: boolean;
  count: number;
  partners: string[];
  errors: string[];
}

type EditableField = "montantMin" | "montantMax" | "dureeMois" | "taux";

interface EditingCell {
  index: number; // index dans le tableau global (entries)
  field: EditableField;
  value: string;
}

export default function BaseTauxAdmin() {
  const baseTauxData = useBaseTauxStore((s) => s.entries);
  const updateEntry = useBaseTauxStore((s) => s.updateEntry);
  const setAll = useBaseTauxStore((s) => s.setAll);
  const reset = useBaseTauxStore((s) => s.reset);

  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPartner, setFilterPartner] = useState<string>("all");
  const [filterDuree, setFilterDuree] = useState<string>("all");
  const [editing, setEditing] = useState<EditingCell | null>(null);
  const [recentlyEdited, setRecentlyEdited] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get unique partners and durations for filters
  const uniquePartners = useMemo(
    () => [...new Set(baseTauxData.map((r) => r.partenaire))].sort(),
    [baseTauxData]
  );
  const uniqueDurees = useMemo(
    () => [...new Set(baseTauxData.map((r) => r.dureeMois))].sort((a, b) => a - b),
    [baseTauxData]
  );

  // Filter data — on conserve l'index global pour l'édition
  const filteredData = useMemo(() => {
    return baseTauxData
      .map((row, globalIndex) => ({ row, globalIndex }))
      .filter(({ row }) => {
        const matchesSearch =
          searchQuery === "" ||
          row.partenaire.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPartner = filterPartner === "all" || row.partenaire === filterPartner;
        const matchesDuree = filterDuree === "all" || row.dureeMois === parseInt(filterDuree);
        return matchesSearch && matchesPartner && matchesDuree;
      });
  }, [baseTauxData, searchQuery, filterPartner, filterDuree]);

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setImportResult(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });

      const sheetName = workbook.SheetNames.find(
        (name) =>
          name.toLowerCase().includes("base taux") || name.toLowerCase().includes("basetaux")
      );

      if (!sheetName) {
        throw new Error("Onglet 'Base Taux' non trouvé dans le fichier Excel");
      }

      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

      const parsedData: BaseTauxEntry[] = [];
      const errors: string[] = [];
      let headerRowIndex = -1;

      for (let i = 0; i < Math.min(10, jsonData.length); i++) {
        const row = jsonData[i];
        if (row && Array.isArray(row)) {
          const rowStr = row.map((c) => String(c || "").toLowerCase()).join(" ");
          if (rowStr.includes("partenaire") && (rowStr.includes("taux") || rowStr.includes("coef"))) {
            headerRowIndex = i;
            break;
          }
        }
      }

      if (headerRowIndex === -1) {
        throw new Error(
          "En-têtes non trouvés. Colonnes attendues: Partenaire, Montant min, Montant max, Durée, Taux"
        );
      }

      const headerRow = jsonData[headerRowIndex].map((c) => String(c || "").toLowerCase());
      const partenaireIdx = headerRow.findIndex((h) => h.includes("partenaire"));
      const montantMinIdx = headerRow.findIndex((h) => h.includes("min"));
      const montantMaxIdx = headerRow.findIndex((h) => h.includes("max"));
      const dureeIdx = headerRow.findIndex(
        (h) => h.includes("dur") || h.includes("mois") || h === "durée location"
      );
      const tauxIdx = headerRow.findIndex((h) => h.includes("taux") || h.includes("coef"));

      const convertDureeToMonths = (value: number): number => {
        const quarterMap: Record<number, number> = {
          6: 18,
          8: 24,
          12: 36,
          16: 48,
          20: 60,
        };
        return quarterMap[value] || value;
      };

      for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || !Array.isArray(row) || row.length < 3) continue;

        const partenaire = String(row[partenaireIdx] || "").trim();
        if (!partenaire) continue;

        const montantMin = parseFloat(
          String(row[montantMinIdx] || "0").replace(/[^\d.,]/g, "").replace(",", ".")
        );
        const montantMax = parseFloat(
          String(row[montantMaxIdx] || "0").replace(/[^\d.,]/g, "").replace(",", ".")
        );
        const dureeRaw = parseFloat(
          String(row[dureeIdx] || "0").replace(/[^\d.,]/g, "").replace(",", ".")
        );
        const taux = parseFloat(
          String(row[tauxIdx] || "0").replace(/[^\d.,]/g, "").replace(",", ".")
        );

        if (isNaN(montantMin) || isNaN(taux) || isNaN(dureeRaw)) {
          errors.push(`Ligne ${i + 1}: Valeurs numériques invalides`);
          continue;
        }

        parsedData.push({
          partenaire,
          montantMin,
          montantMax: montantMax || 500000,
          dureeMois: convertDureeToMonths(dureeRaw),
          taux,
        });
      }

      if (parsedData.length === 0) {
        throw new Error("Aucune donnée valide trouvée dans le fichier");
      }

      setAll(parsedData);
      setRecentlyEdited(new Set());

      const uniqueImportedPartners = [...new Set(parsedData.map((r) => r.partenaire))];

      setImportResult({
        success: true,
        count: parsedData.length,
        partners: uniqueImportedPartners,
        errors,
      });

      toast.success(`${parsedData.length} entrées importées avec succès`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      setImportResult({
        success: false,
        count: 0,
        partners: [],
        errors: [errorMessage],
      });
      toast.error(`Erreur d'import: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    e.target.value = "";
  };

  const handleReset = () => {
    reset();
    setRecentlyEdited(new Set());
    setImportResult(null);
    toast.info("Données réinitialisées aux valeurs par défaut");
  };

  // ===== Édition inline =====
  const startEdit = (index: number, field: EditableField, currentValue: number) => {
    setEditing({ index, field, value: String(currentValue) });
  };

  const cancelEdit = () => setEditing(null);

  const commitEdit = () => {
    if (!editing) return;
    const raw = editing.value.trim().replace(",", ".");
    const num = parseFloat(raw);

    if (raw === "" || isNaN(num)) {
      toast.error("Valeur invalide");
      setEditing(null);
      return;
    }

    const current = baseTauxData[editing.index];
    if (!current) {
      setEditing(null);
      return;
    }

    // Validation par champ
    if (editing.field === "montantMin") {
      if (num < 0) {
        toast.error("Le montant min doit être ≥ 0");
        return;
      }
      if (num >= current.montantMax) {
        toast.error("Le montant min doit être inférieur au montant max");
        return;
      }
    } else if (editing.field === "montantMax") {
      if (num <= current.montantMin) {
        toast.error("Le montant max doit être supérieur au montant min");
        return;
      }
    } else if (editing.field === "dureeMois") {
      if (!Number.isInteger(num) || num <= 0) {
        toast.error("La durée doit être un entier positif (en mois)");
        return;
      }
    } else if (editing.field === "taux") {
      if (num <= 0) {
        toast.error("Le taux doit être supérieur à 0");
        return;
      }
    }

    // Pas de mise à jour si valeur inchangée
    if ((current as any)[editing.field] === num) {
      setEditing(null);
      return;
    }

    updateEntry(editing.index, { [editing.field]: num } as Partial<BaseTauxEntry>);
    setRecentlyEdited((prev) => {
      const next = new Set(prev);
      next.add(editing.index);
      return next;
    });
    toast.success("Modifié");
    setEditing(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  };

  const renderEditableCell = (
    globalIndex: number,
    field: EditableField,
    displayValue: string,
    align: "right" | "left" = "right"
  ) => {
    const isEditing = editing?.index === globalIndex && editing.field === field;
    const isMono = field === "taux";

    if (isEditing) {
      return (
        <Input
          autoFocus
          type="text"
          inputMode="decimal"
          value={editing!.value}
          onChange={(e) => setEditing({ ...editing!, value: e.target.value })}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          className={cn(
            "h-7 px-2 py-1 text-sm",
            align === "right" && "text-right",
            isMono && "font-mono"
          )}
        />
      );
    }

    return (
      <button
        type="button"
        onClick={() =>
          startEdit(globalIndex, field, baseTauxData[globalIndex][field] as number)
        }
        className={cn(
          "group w-full rounded px-2 py-1 -mx-2 -my-1 hover:bg-accent/50 transition-colors flex items-center gap-1",
          align === "right" ? "justify-end" : "justify-start",
          isMono && "font-mono"
        )}
        title="Cliquer pour modifier"
      >
        <span>{displayValue}</span>
        <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 shrink-0" />
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Database className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Gestion Base Taux</h2>
            <p className="text-muted-foreground text-xs">
              Importez un fichier Excel ou modifiez directement les valeurs (Montant min, Montant
              max, Durée, Taux). Toute modification est appliquée immédiatement aux calculs.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardHeader className="py-2 px-3">
            <CardDescription className="text-xs">Total entrées</CardDescription>
            <CardTitle className="text-xl">{baseTauxData.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="py-2 px-3">
            <CardDescription className="text-xs">Partenaires</CardDescription>
            <CardTitle className="text-xl">{uniquePartners.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="py-2 px-3">
            <CardDescription className="text-xs">Durées disponibles</CardDescription>
            <CardTitle className="text-lg">
              {uniqueDurees.map((d) => `${d}m`).join(", ")}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Import zone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Import Excel
          </CardTitle>
          <CardDescription>
            Format attendu: onglet "Base Taux" avec colonnes Partenaire, Montant min, Montant max,
            Durée, Taux
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              {isProcessing ? "Import en cours..." : "Importer un fichier Excel"}
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Réinitialiser aux valeurs par défaut
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleInputChange}
              className="hidden"
            />
          </div>

          {importResult && (
            <div
              className={`p-4 rounded-lg border ${
                importResult.success
                  ? "bg-success/10 border-success/30"
                  : "bg-destructive/10 border-destructive/30"
              }`}
            >
              <div className="flex items-start gap-3">
                {importResult.success ? (
                  <Check className="h-5 w-5 text-success mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                )}
                <div className="space-y-1">
                  <p className="font-medium">
                    {importResult.success
                      ? `Import réussi: ${importResult.count} entrées`
                      : "Échec de l'import"}
                  </p>
                  {importResult.success && (
                    <p className="text-sm text-muted-foreground">
                      Partenaires: {importResult.partners.join(", ")}
                    </p>
                  )}
                  {importResult.errors.length > 0 && (
                    <ul className="text-sm text-destructive list-disc list-inside">
                      {importResult.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher partenaire..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterPartner} onValueChange={setFilterPartner}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Partenaire" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les partenaires</SelectItem>
              {uniquePartners.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterDuree} onValueChange={setFilterDuree}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Durée" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {uniqueDurees.map((d) => (
                <SelectItem key={d} value={String(d)}>
                  {d} mois
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Badge variant="secondary">{filteredData.length} résultats</Badge>
      </div>

      {/* Data table */}
      <Card>
        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead>Partenaire</TableHead>
                  <TableHead className="text-right">Montant min</TableHead>
                  <TableHead className="text-right">Montant max</TableHead>
                  <TableHead className="text-right">Durée</TableHead>
                  <TableHead className="text-right">Taux</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Aucune donnée trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map(({ row, globalIndex }) => (
                    <TableRow
                      key={`${row.partenaire}-${globalIndex}`}
                      className={cn(recentlyEdited.has(globalIndex) && "bg-primary/5")}
                    >
                      <TableCell className="font-medium">{row.partenaire}</TableCell>
                      <TableCell className="text-right p-2">
                        {renderEditableCell(
                          globalIndex,
                          "montantMin",
                          `${row.montantMin.toLocaleString("fr-FR")} €`
                        )}
                      </TableCell>
                      <TableCell className="text-right p-2">
                        {renderEditableCell(
                          globalIndex,
                          "montantMax",
                          `${row.montantMax.toLocaleString("fr-FR")} €`
                        )}
                      </TableCell>
                      <TableCell className="text-right p-2">
                        {renderEditableCell(
                          globalIndex,
                          "dureeMois",
                          `${row.dureeMois} mois`
                        )}
                      </TableCell>
                      <TableCell className="text-right p-2">
                        {renderEditableCell(globalIndex, "taux", String(row.taux))}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
