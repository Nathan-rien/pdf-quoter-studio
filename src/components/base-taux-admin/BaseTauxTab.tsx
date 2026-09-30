import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useBaseTaux,
  useDeleteBaseTauxRow,
  useFinancialPartners,
  useSaveBaseTauxRow,
} from '@/hooks/useFinancialPartners';
import { findOverlaps, validateBaseTauxDraft, type BaseTauxRow } from '@/lib/partners';
import { cn } from '@/lib/utils';
import { BaseTauxImportDialog } from './BaseTauxImportDialog';

interface FormState {
  id?: string;
  partnerId: string;
  montantMin: string;
  montantMax: string;
  dureeMois: string;
  taux: string;
  isActive: boolean;
}

const num = (s: string) => parseFloat(s.trim().replace(',', '.'));

export function BaseTauxTab() {
  const { data: partners = [] } = useFinancialPartners({ includeInactive: true });
  const { data: rows = [], isLoading } = useBaseTaux();
  const saveRow = useSaveBaseTauxRow();
  const deleteRow = useDeleteBaseTauxRow();

  const [filterPartner, setFilterPartner] = useState('all');
  const [filterDuree, setFilterDuree] = useState('all');
  const [showInactive, setShowInactive] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const partnerById = useMemo(() => new Map(partners.map((p) => [p.id, p])), [partners]);
  const durees = useMemo(() => [...new Set(rows.map((r) => r.dureeMois))].sort((a, b) => a - b), [rows]);

  const visible = useMemo(
    () =>
      rows
        .filter((r) => filterPartner === 'all' || r.partnerId === filterPartner)
        .filter((r) => filterDuree === 'all' || r.dureeMois === Number(filterDuree))
        .filter((r) => showInactive || (r.isActive && partnerById.get(r.partnerId)?.isActive !== false))
        .sort(
          (a, b) =>
            (partnerById.get(a.partnerId)?.name ?? '').localeCompare(partnerById.get(b.partnerId)?.name ?? '') ||
            a.dureeMois - b.dureeMois ||
            a.montantMin - b.montantMin,
        ),
    [rows, filterPartner, filterDuree, showInactive, partnerById],
  );

  const openNew = () =>
    setForm({
      partnerId: filterPartner !== 'all' ? filterPartner : '',
      montantMin: '',
      montantMax: '',
      dureeMois: filterDuree !== 'all' ? filterDuree : '',
      taux: '',
      isActive: true,
    });

  const openEdit = (r: BaseTauxRow) =>
    setForm({
      id: r.id,
      partnerId: r.partnerId,
      montantMin: String(r.montantMin),
      montantMax: String(r.montantMax),
      dureeMois: String(r.dureeMois),
      taux: String(r.taux),
      isActive: r.isActive,
    });

  const submit = async () => {
    if (!form) return;
    const draft = {
      id: form.id,
      partnerId: form.partnerId,
      montantMin: num(form.montantMin),
      montantMax: num(form.montantMax),
      dureeMois: num(form.dureeMois),
      taux: num(form.taux),
    };
    const errors = validateBaseTauxDraft(draft);
    if (errors.length) return toast.error(errors.join(' · '));
    if (form.isActive) {
      const overlaps = findOverlaps(rows, draft);
      if (overlaps.length) {
        return toast.error(
          `Chevauchement avec ${overlaps.map((o) => `${o.montantMin}–${o.montantMax} €`).join(', ')} (même partenaire, même durée)`,
        );
      }
    }
    try {
      await saveRow.mutateAsync({ ...draft, isActive: form.isActive });
      toast.success(form.id ? 'Ligne modifiée' : 'Ligne ajoutée');
      setForm(null);
    } catch (e) {
      toast.error(`Enregistrement impossible : ${e instanceof Error ? e.message : 'erreur inconnue'}`);
    }
  };

  const remove = async (r: BaseTauxRow) => {
    if (!window.confirm(`Supprimer la ligne ${r.montantMin}–${r.montantMax} € / ${r.dureeMois} mois ?`)) return;
    try {
      await deleteRow.mutateAsync(r.id);
      toast.success('Ligne supprimée');
    } catch (e) {
      toast.error(`Suppression impossible : ${e instanceof Error ? e.message : 'erreur inconnue'}`);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-lg">Base taux</CardTitle>
          <CardDescription>
            Les coefficients des partenaires désactivés restent utilisés pour les propositions existantes.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4 mr-1" /> Importer Excel
          </Button>
          <Button size="sm" onClick={openNew}>
            <Plus className="h-4 w-4 mr-1" /> Nouvelle ligne
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase text-muted-foreground">Partenaire</Label>
            <Select value={filterPartner} onValueChange={setFilterPartner}>
              <SelectTrigger className="h-8 w-[220px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {partners.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                    {p.isActive ? '' : ' (désactivé)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase text-muted-foreground">Durée</Label>
            <Select value={filterDuree} onValueChange={setFilterDuree}>
              <SelectTrigger className="h-8 w-[130px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {durees.map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {d} mois
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 pb-1">
            <Switch id="show-inactive" checked={showInactive} onCheckedChange={setShowInactive} />
            <Label htmlFor="show-inactive" className="text-xs">
              Afficher les inactifs
            </Label>
          </div>
          <span className="ml-auto pb-1 text-xs text-muted-foreground">
            {visible.length} / {rows.length} lignes
          </span>
        </div>

        <div className="rounded-md border max-h-[60vh] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partenaire</TableHead>
                <TableHead className="text-right">Montant min</TableHead>
                <TableHead className="text-right">Montant max</TableHead>
                <TableHead className="text-right">Durée</TableHead>
                <TableHead className="text-right">Taux</TableHead>
                <TableHead className="w-[90px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Chargement…
                  </TableCell>
                </TableRow>
              )}
              {visible.map((r) => {
                const partner = partnerById.get(r.partnerId);
                const inactive = !r.isActive || partner?.isActive === false;
                return (
                  <TableRow key={r.id} className={cn(inactive && 'opacity-50')}>
                    <TableCell>
                      {partner?.name ?? '—'}
                      {!r.isActive && (
                        <Badge variant="secondary" className="ml-2 text-[10px]">
                          Ligne inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{r.montantMin.toLocaleString('fr-FR')} €</TableCell>
                    <TableCell className="text-right">{r.montantMax.toLocaleString('fr-FR')} €</TableCell>
                    <TableCell className="text-right">{r.dureeMois} mois</TableCell>
                    <TableCell className="text-right font-mono">{r.taux}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="iconSm" title="Modifier" onClick={() => openEdit(r)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="iconSm" title="Supprimer" onClick={() => remove(r)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={!!form} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form?.id ? 'Modifier la ligne' : 'Nouvelle ligne de taux'}</DialogTitle>
            <DialogDescription>
              Montant min &lt; montant max, taux &gt; 0, durée entière en mois. Les tranches actives d'un même
              partenaire et d'une même durée ne peuvent pas se chevaucher (bornes incluses).
            </DialogDescription>
          </DialogHeader>
          {form && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Partenaire</Label>
                <Select value={form.partnerId} onValueChange={(v) => setForm({ ...form, partnerId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {partners.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                        {p.isActive ? '' : ' (désactivé)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    ['montantMin', 'Montant min (€)'],
                    ['montantMax', 'Montant max (€)'],
                    ['dureeMois', 'Durée (mois)'],
                    ['taux', 'Taux'],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="space-y-1">
                    <Label htmlFor={`bt-${key}`}>{label}</Label>
                    <Input
                      id={`bt-${key}`}
                      inputMode="decimal"
                      value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Switch id="bt-active" checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
                <Label htmlFor="bt-active">Ligne active</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)}>
              Annuler
            </Button>
            <Button onClick={submit} disabled={saveRow.isPending}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BaseTauxImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </Card>
  );
}
