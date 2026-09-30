import { useMemo, useRef, useState } from 'react';
import { AlertCircle, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApplyBaseTauxImport, useBaseTaux, useFinancialPartners } from '@/hooks/useFinancialPartners';
import { parseBaseTauxSheetRows, planBaseTauxImport, type ParsedImportRow } from '@/lib/base-taux-import';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Import Excel en deux temps : lecture + aperçu des changements par partenaire,
 * puis écriture en base uniquement après confirmation explicite.
 */
export function BaseTauxImportDialog({ open, onOpenChange }: Props) {
  const { data: partners = [] } = useFinancialPartners({ includeInactive: true });
  const { data: existing = [] } = useBaseTaux();
  const apply = useApplyBaseTauxImport();
  const fileRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState('');
  const [parsed, setParsed] = useState<ParsedImportRow[] | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [skipNew, setSkipNew] = useState<Set<string>>(new Set());
  const [deleteMissing, setDeleteMissing] = useState(true);

  const reset = () => {
    setFileName('');
    setParsed(null);
    setParseErrors([]);
    setSkipNew(new Set());
    setDeleteMissing(true);
  };

  const close = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const plan = useMemo(
    () => (parsed ? planBaseTauxImport(partners, existing, parsed, { deleteMissing, skipNewPartners: skipNew }) : null),
    [parsed, partners, existing, deleteMissing, skipNew],
  );
  // Les partenaires inconnus refusés disparaissent du plan : on garde leur liste pour pouvoir les recocher.
  const unknownNames = useMemo(() => {
    if (!parsed) return [];
    const seen = new Map<string, string>();
    for (const r of parsed) {
      const key = r.partnerName.trim().toLowerCase();
      if (!partners.some((p) => p.name.trim().toLowerCase() === key || p.aliases.some((a) => a.trim().toLowerCase() === key))) {
        seen.set(key, r.partnerName.trim());
      }
    }
    return [...seen.entries()];
  }, [parsed, partners]);

  const onFile = async (file: File) => {
    try {
      const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const sheetName = wb.SheetNames.find((n) => n.toLowerCase().includes('base taux') || n.toLowerCase().includes('basetaux'));
      if (!sheetName) throw new Error("Onglet 'Base Taux' non trouvé dans le fichier Excel");
      const sheet = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 }) as unknown[][];
      const result = parseBaseTauxSheetRows(sheet);
      if (result.rows.length === 0) throw new Error('Aucune donnée valide trouvée dans le fichier');
      setFileName(file.name);
      setParsed(result.rows);
      setParseErrors(result.errors);
      setSkipNew(new Set());
    } catch (e) {
      reset();
      toast.error(`Erreur d'import : ${e instanceof Error ? e.message : 'erreur inconnue'}`);
    }
  };

  const totals = useMemo(
    () =>
      (plan?.diffs ?? []).reduce(
        (acc, d) => ({
          inserts: acc.inserts + d.inserts.length,
          updates: acc.updates + d.updates.length,
          deletes: acc.deletes + d.deletes.length,
        }),
        { inserts: 0, updates: 0, deletes: 0 },
      ),
    [plan],
  );
  const hasChanges = totals.inserts + totals.updates + totals.deletes > 0;
  const blocked = !plan || plan.overlaps.length > 0 || !hasChanges;

  const confirm = async () => {
    if (!plan) return;
    try {
      await apply.mutateAsync({
        newPartners: plan.diffs.filter((d) => d.isNew).map((d) => d.partnerName),
        inserts: plan.diffs.flatMap((d) =>
          d.inserts.map((r) => ({
            partnerId: d.partnerId,
            partnerName: d.partnerName,
            montantMin: r.montantMin,
            montantMax: r.montantMax,
            dureeMois: r.dureeMois,
            taux: r.taux,
          })),
        ),
        updates: plan.diffs.flatMap((d) =>
          d.updates.map((u) => ({
            id: u.existing.id,
            partnerId: u.existing.partnerId,
            montantMin: u.row.montantMin,
            montantMax: u.row.montantMax,
            dureeMois: u.row.dureeMois,
            taux: u.row.taux,
          })),
        ),
        deleteIds: plan.diffs.flatMap((d) => d.deletes.map((r) => r.id)),
      });
      toast.success(`Import appliqué : +${totals.inserts} / ~${totals.updates} / −${totals.deletes}`);
      close(false);
    } catch (e) {
      toast.error(`Import interrompu : ${e instanceof Error ? e.message : 'erreur inconnue'} (l'état réel a été rechargé, vérifiez le résultat)`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Importer la base taux depuis Excel</DialogTitle>
          <DialogDescription>
            Onglet « Base Taux », colonnes Partenaire, Montant min, Montant max, Durée, Taux. Rien n'est écrit avant
            votre confirmation ; seuls les partenaires présents dans le fichier sont concernés.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = '';
          }}
        />
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <FileSpreadsheet className="h-4 w-4 mr-1" /> Choisir un fichier
          </Button>
          {fileName && <span className="text-sm text-muted-foreground">{fileName}</span>}
        </div>

        {plan && (
          <div className="space-y-3 max-h-[50vh] overflow-auto">
            {unknownNames.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Partenaires inconnus</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>Cochez ceux à créer (actifs, sans frais de dossier ni condition : à compléter ensuite).</p>
                  {unknownNames.map(([key, name]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Checkbox
                        id={`new-${key}`}
                        checked={!skipNew.has(key)}
                        onCheckedChange={(c) =>
                          setSkipNew((prev) => {
                            const next = new Set(prev);
                            if (c) next.delete(key);
                            else next.add(key);
                            return next;
                          })
                        }
                      />
                      <Label htmlFor={`new-${key}`}>Créer « {name} »</Label>
                    </div>
                  ))}
                </AlertDescription>
              </Alert>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partenaire</TableHead>
                  <TableHead className="text-right">Ajouts</TableHead>
                  <TableHead className="text-right">Modifs</TableHead>
                  <TableHead className="text-right">Suppressions</TableHead>
                  <TableHead className="text-right">Inchangées</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plan.diffs.map((d) => (
                  <TableRow key={d.partnerName}>
                    <TableCell>
                      {d.partnerName}
                      {d.isNew && (
                        <Badge variant="secondary" className="ml-2 text-[10px]">
                          Nouveau
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{d.inserts.length}</TableCell>
                    <TableCell className="text-right">{d.updates.length}</TableCell>
                    <TableCell className="text-right text-destructive">{d.deletes.length}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{d.unchanged}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center gap-2">
              <Checkbox id="del-missing" checked={deleteMissing} onCheckedChange={(c) => setDeleteMissing(!!c)} />
              <Label htmlFor="del-missing" className="text-sm">
                Supprimer les lignes en base absentes du fichier (pour les partenaires ci-dessus)
              </Label>
            </div>

            {plan.overlaps.length > 0 && (
              <Alert variant="destructive">
                <AlertTitle>Chevauchements de tranches : import bloqué</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-4">
                    {plan.overlaps.slice(0, 8).map((o) => (
                      <li key={o}>{o}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            {(parseErrors.length > 0 || plan.errors.length > 0) && (
              <Alert>
                <AlertTitle>Lignes ignorées ({parseErrors.length + plan.errors.length})</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-4">
                    {[...parseErrors, ...plan.errors].slice(0, 8).map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            {!hasChanges && <p className="text-sm text-muted-foreground">Aucune différence avec la base actuelle.</p>}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)}>
            Annuler
          </Button>
          <Button onClick={confirm} disabled={blocked || apply.isPending}>
            {plan && hasChanges ? `Confirmer (+${totals.inserts} / ~${totals.updates} / −${totals.deletes})` : 'Confirmer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
