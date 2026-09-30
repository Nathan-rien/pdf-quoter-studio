import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useBaseTaux,
  useContractPartnerValues,
  useDeletePartner,
  useFinancialPartners,
  useSavePartner,
  useSetPartnerActive,
} from '@/hooks/useFinancialPartners';
import {
  CONDITIONS_FIN_CONTRAT,
  countReferences,
  findNameConflict,
  type FinancialPartner,
} from '@/lib/partners';
import { cn } from '@/lib/utils';

const NONE = '__none__';

interface FormState {
  id?: string;
  name: string;
  frais: string;
  condition: string;
  aliases: string;
  isActive: boolean;
}

const emptyForm: FormState = { name: '', frais: '', condition: NONE, aliases: '', isActive: true };

const toForm = (p: FinancialPartner): FormState => ({
  id: p.id,
  name: p.name,
  frais: p.fraisDossier === null ? '' : String(p.fraisDossier),
  condition: p.conditionFinContrat ?? NONE,
  aliases: p.aliases.join(', '),
  isActive: p.isActive,
});

export function PartnersTab() {
  const { data: partners = [], isLoading } = useFinancialPartners({ includeInactive: true });
  const { data: rates = [] } = useBaseTaux();
  const { data: contractValues = [], isLoading: contractsLoading } = useContractPartnerValues();
  const savePartner = useSavePartner();
  const setActive = useSetPartnerActive();
  const deletePartner = useDeletePartner();

  const [form, setForm] = useState<FormState | null>(null);
  const [toDelete, setToDelete] = useState<FinancialPartner | null>(null);

  const stats = useMemo(
    () =>
      new Map(
        partners.map((p) => [
          p.id,
          {
            rateCount: rates.filter((r) => r.partnerId === p.id).length,
            contractCount: countReferences(p, contractValues),
          },
        ]),
      ),
    [partners, rates, contractValues],
  );

  const submit = async () => {
    if (!form) return;
    const name = form.name.trim();
    if (!name) return toast.error('Le nom est obligatoire');
    const aliases = form.aliases
      .split(/[,;\n]/)
      .map((a) => a.trim())
      .filter(Boolean);
    const conflict = findNameConflict(partners, [name, ...aliases], form.id);
    if (conflict) return toast.error(conflict);
    let frais: number | null = null;
    if (form.frais.trim() !== '') {
      frais = parseFloat(form.frais.replace(',', '.'));
      if (!Number.isFinite(frais) || frais < 0) return toast.error('Frais de dossier invalides');
    }
    try {
      await savePartner.mutateAsync({
        id: form.id,
        name,
        fraisDossier: frais,
        conditionFinContrat: form.condition === NONE ? null : form.condition,
        aliases,
        isActive: form.isActive,
      });
      toast.success(form.id ? 'Partenaire mis à jour' : 'Partenaire créé');
      setForm(null);
    } catch (e) {
      toast.error(`Enregistrement impossible : ${e instanceof Error ? e.message : 'erreur inconnue'}`);
    }
  };

  const toggleActive = async (p: FinancialPartner, isActive: boolean) => {
    try {
      await setActive.mutateAsync({ id: p.id, isActive });
      toast.success(isActive ? `${p.name} réactivé` : `${p.name} désactivé pour les nouvelles propositions`);
    } catch (e) {
      toast.error(`Modification impossible : ${e instanceof Error ? e.message : 'erreur inconnue'}`);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deletePartner.mutateAsync(toDelete.id);
      toast.success(`${toDelete.name} supprimé`);
    } catch (e) {
      toast.error(`Suppression impossible : ${e instanceof Error ? e.message : 'erreur inconnue'}`);
    } finally {
      setToDelete(null);
    }
  };

  const deleteBlockedReason = (p: FinancialPartner): string | null => {
    const s = stats.get(p.id);
    if (contractsLoading) return 'Chargement des contrats…';
    if (s && s.contractCount > 0) return `${s.contractCount} contrat(s) rattaché(s) (nom ou alias)`;
    if (s && s.rateCount > 0) return `${s.rateCount} ligne(s) de taux rattachée(s)`;
    return null;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-lg">Partenaires financiers</CardTitle>
          <CardDescription>
            Un partenaire désactivé n'est plus proposé pour les nouvelles propositions, mais les contrats et
            propositions existants conservent son nom, ses taux et ses frais.
          </CardDescription>
        </div>
        <Button size="sm" onClick={() => setForm(emptyForm)}>
          <Plus className="h-4 w-4 mr-1" /> Nouveau partenaire
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Alias</TableHead>
                <TableHead className="text-right">Frais de dossier</TableHead>
                <TableHead>Fin de contrat</TableHead>
                <TableHead className="text-right">Taux</TableHead>
                <TableHead className="text-right">Contrats</TableHead>
                <TableHead>Actif</TableHead>
                <TableHead className="w-[90px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Chargement…
                  </TableCell>
                </TableRow>
              )}
              {partners.map((p) => {
                const s = stats.get(p.id);
                return (
                  <TableRow key={p.id} className={cn(!p.isActive && 'opacity-60')}>
                    <TableCell className="font-medium">
                      {p.name}
                      {!p.isActive && (
                        <Badge variant="secondary" className="ml-2 text-[10px]">
                          Désactivé
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.aliases.join(', ') || '—'}</TableCell>
                    <TableCell className="text-right">{p.fraisDossier === null ? '—' : `${p.fraisDossier} €`}</TableCell>
                    <TableCell className="text-xs">{p.conditionFinContrat ?? '—'}</TableCell>
                    <TableCell className="text-right">{s?.rateCount ?? 0}</TableCell>
                    <TableCell className="text-right">{contractsLoading ? '…' : (s?.contractCount ?? 0)}</TableCell>
                    <TableCell>
                      <Switch
                        checked={p.isActive}
                        onCheckedChange={(v) => toggleActive(p, v)}
                        aria-label={`Activer ${p.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="iconSm" title="Modifier" onClick={() => setForm(toForm(p))}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="iconSm" title="Supprimer" onClick={() => setToDelete(p)}>
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
            <DialogTitle>{form?.id ? 'Modifier le partenaire' : 'Nouveau partenaire'}</DialogTitle>
            <DialogDescription>
              Les alias permettent de retrouver les anciennes saisies libres (ex. « Lixxbail » pour « Lixxbail 1 »).
              La recherche ignore la casse et les espaces en début/fin.
            </DialogDescription>
          </DialogHeader>
          {form && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="p-name">Nom</Label>
                <Input id="p-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="p-frais">Frais de dossier (€)</Label>
                  <Input
                    id="p-frais"
                    inputMode="decimal"
                    value={form.frais}
                    onChange={(e) => setForm({ ...form, frais: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Condition de fin de contrat</Label>
                  <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Non définie</SelectItem>
                      {CONDITIONS_FIN_CONTRAT.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="p-aliases">Alias (séparés par des virgules)</Label>
                <Input
                  id="p-aliases"
                  value={form.aliases}
                  onChange={(e) => setForm({ ...form, aliases: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} id="p-active" />
                <Label htmlFor="p-active">Actif (proposé pour les nouvelles propositions)</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)}>
              Annuler
            </Button>
            <Button onClick={submit} disabled={savePartner.isPending}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toDelete && deleteBlockedReason(toDelete) ? 'Suppression impossible' : 'Supprimer ce partenaire ?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete && deleteBlockedReason(toDelete)
                ? `« ${toDelete.name} » ne peut pas être supprimé : ${deleteBlockedReason(toDelete)}. Désactivez-le plutôt : il ne sera plus proposé pour les nouvelles propositions, sans rien casser dans l'historique.`
                : `« ${toDelete?.name} » n'est référencé par aucun contrat ni aucune ligne de taux. Cette action est définitive.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            {toDelete && deleteBlockedReason(toDelete) ? (
              toDelete.isActive && (
                <AlertDialogAction
                  onClick={() => {
                    toggleActive(toDelete, false);
                    setToDelete(null);
                  }}
                >
                  Désactiver
                </AlertDialogAction>
              )
            ) : (
              <AlertDialogAction onClick={confirmDelete}>Supprimer</AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
