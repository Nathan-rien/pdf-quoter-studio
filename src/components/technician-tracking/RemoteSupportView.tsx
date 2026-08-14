import { useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Upload, Pencil, Trash2, Ticket, History } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { parseRemoteSupportCsv } from '@/lib/remote-support-csv';

export interface RemoteSupportRow {
  id: string;
  bu: string | null;
  commercial_name: string | null;
  entity: string;
  client_number: string | null;
  order_number: string | null;
  invoice_number: string | null;
  forfait: string | null;
  tickets_label: string | null;
  tickets_initial: number | null;
  tickets_remaining: number | null;
  attribution: string | null;
  machines_count: number | null;
  products_sn: string | null;
  start_date: string | null;
  end_date: string | null;
  is_paid: boolean;
}

type FormState = Omit<RemoteSupportRow, 'id'> & { id?: string };

const emptyForm = (): FormState => ({
  bu: 'CYBERTEK',
  commercial_name: '',
  entity: '',
  client_number: '',
  order_number: '',
  invoice_number: '',
  forfait: '',
  tickets_label: '',
  tickets_initial: null,
  tickets_remaining: null,
  attribution: 'Unité(s)',
  machines_count: null,
  products_sn: '',
  start_date: null,
  end_date: null,
  is_paid: false,
});

const fmtDate = (d: string | null) =>
  d ? new Date(`${d}T00:00:00`).toLocaleDateString('fr-FR') : '—';

const buClass = (bu: string | null) => {
  const v = (bu ?? '').toUpperCase();
  if (v === 'CYBERTEK') return 'bg-muted text-foreground border-border';
  if (v === 'GROSBILL') return 'bg-primary/15 text-primary border-primary/30';
  return 'bg-muted text-muted-foreground border-border';
};

const forfaitClass = (f: string | null) =>
  (f ?? '').toLowerCase().includes('hors contrat')
    ? 'bg-destructive/15 text-destructive border-destructive/30'
    : 'bg-primary/15 text-primary border-primary/30';

export function useRemoteSupportRows() {
  return useQuery({
    queryKey: ['remote-support'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('remote_support_clients')
        .select('*')
        .order('end_date', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as RemoteSupportRow[];
    },
  });
}

interface Props {
  canEdit: boolean;
}

export function RemoteSupportView({ canEdit }: Props) {
  const qc = useQueryClient();
  const rowsQ = useRemoteSupportRows();
  const [search, setSearch] = useState('');
  const [buFilter, setBuFilter] = useState('all');
  const [paidFilter, setPaidFilter] = useState('all');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [form, setForm] = useState<FormState | null>(null);
  const [historyRow, setHistoryRow] = useState<RemoteSupportRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<RemoteSupportRow | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const rows = rowsQ.data ?? [];

  const buOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.bu).filter((v): v is string => !!v))),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = rows.filter((r) => {
      if (buFilter !== 'all' && (r.bu ?? '') !== buFilter) return false;
      if (paidFilter === 'paid' && !r.is_paid) return false;
      if (paidFilter === 'unpaid' && r.is_paid) return false;
      if (!q) return true;
      return [r.entity, r.commercial_name, r.forfait, r.client_number, r.invoice_number, r.order_number, r.products_sn]
        .some((v) => (v ?? '').toLowerCase().includes(q));
    });
    return [...list].sort((a, b) => {
      const av = a.end_date ?? '';
      const bv = b.end_date ?? '';
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [rows, search, buFilter, paidFilter, sortDir]);

  const refresh = () => qc.invalidateQueries({ queryKey: ['remote-support'] });

  const save = async (f: FormState) => {
    if (!f.entity.trim()) {
      toast.error('L’entité est obligatoire.');
      return;
    }
    const payload = {
      bu: f.bu || null,
      commercial_name: f.commercial_name || null,
      entity: f.entity.trim(),
      client_number: f.client_number || null,
      order_number: f.order_number || null,
      invoice_number: f.invoice_number || null,
      forfait: f.forfait || null,
      tickets_label: f.tickets_label || null,
      tickets_initial: f.tickets_initial,
      tickets_remaining: f.tickets_remaining,
      attribution: f.attribution || null,
      machines_count: f.machines_count,
      products_sn: f.products_sn || null,
      start_date: f.start_date || null,
      end_date: f.end_date || null,
      is_paid: f.is_paid,
    };
    const { error } = f.id
      ? await supabase.from('remote_support_clients').update(payload).eq('id', f.id)
      : await supabase.from('remote_support_clients').insert(payload);
    if (error) {
      toast.error(`Enregistrement impossible : ${error.message}`);
      return;
    }
    toast.success(f.id ? 'Ligne mise à jour.' : 'Ligne ajoutée.');
    setForm(null);
    refresh();
  };

  const remove = async (row: RemoteSupportRow) => {
    const { error } = await supabase.from('remote_support_clients').delete().eq('id', row.id);
    if (error) {
      toast.error(`Suppression impossible : ${error.message}`);
      return;
    }
    toast.success('Ligne supprimée.');
    setDeleteRow(null);
    refresh();
  };

  const consume = async (row: RemoteSupportRow) => {
    const { error } = await supabase.rpc('consume_remote_support_ticket', {
      _client_id: row.id,
      _note: null,
    });
    if (error) {
      const msg = error.message.includes('quota_exhausted')
        ? 'Quota de tickets épuisé.'
        : error.message.includes('not_a_ticket_service')
          ? 'Aucun quota de tickets défini sur cette ligne.'
          : error.message;
      toast.error(msg);
      return;
    }
    toast.success('Ticket consommé.');
    refresh();
  };

  const importCsv = async (file: File) => {
    try {
      const parsed = parseRemoteSupportCsv(await file.text());
      if (!parsed.length) {
        toast.error('Aucune ligne exploitable dans ce fichier.');
        return;
      }
      const existing = new Set(
        rows.map((r) => `${r.invoice_number ?? ''}|${r.entity.toLowerCase()}`),
      );
      const toInsert = parsed.filter(
        (p) => !existing.has(`${p.invoice_number ?? ''}|${p.entity.toLowerCase()}`),
      );
      if (!toInsert.length) {
        toast.info('Toutes les lignes du fichier sont déjà présentes.');
        return;
      }
      const { error } = await supabase.from('remote_support_clients').insert(toInsert);
      if (error) throw error;
      toast.success(
        `${toInsert.length} ligne(s) importée(s)${
          parsed.length - toInsert.length > 0
            ? ` — ${parsed.length - toInsert.length} doublon(s) ignoré(s)`
            : ''
        }.`,
      );
      refresh();
    } catch (err) {
      toast.error(`Import impossible : ${(err as Error).message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Clients \ Service à distance</h1>
          <p className="text-sm text-muted-foreground">
            Forfaits de support à distance, machines couvertes et quotas de tickets.
          </p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importCsv(f);
                e.target.value = '';
              }}
            />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Importer un CSV
            </Button>
            <Button size="sm" onClick={() => setForm(emptyForm())}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle ligne
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher (entité, commercial, forfait, n°)…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={buFilter} onValueChange={setBuFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="BU" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les BU</SelectItem>
            {buOptions.map((b) => (
              <SelectItem key={b} value={b}>{b}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={paidFilter} onValueChange={setPaidFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Payé" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Payé : tous</SelectItem>
            <SelectItem value="paid">Payé</SelectItem>
            <SelectItem value="unpaid">Non payé</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortDir} onValueChange={(v) => setSortDir(v as 'asc' | 'desc')}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Fin : la plus proche</SelectItem>
            <SelectItem value="desc">Fin : la plus lointaine</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} ligne{filtered.length > 1 ? 's' : ''}
        </span>
      </div>

      {rowsQ.isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : filtered.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Aucune ligne à afficher.
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">BU</TableHead>
                <TableHead className="whitespace-nowrap">Commercial(e)</TableHead>
                <TableHead>Entité</TableHead>
                <TableHead className="whitespace-nowrap">N°Clt</TableHead>
                <TableHead className="whitespace-nowrap">N° Cmd</TableHead>
                <TableHead className="whitespace-nowrap">N° Fact.</TableHead>
                <TableHead>Forfait</TableHead>
                <TableHead className="whitespace-nowrap">Nbre. Tickets</TableHead>
                <TableHead className="whitespace-nowrap">Attribution</TableHead>
                <TableHead className="text-right whitespace-nowrap">Machine(s)</TableHead>
                <TableHead className="min-w-[240px]">Liste Produit(s)\SN</TableHead>
                <TableHead className="whitespace-nowrap">Début</TableHead>
                <TableHead className="whitespace-nowrap">Fin</TableHead>
                <TableHead className="whitespace-nowrap">Payé ?</TableHead>
                <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id} className="align-top">
                  <TableCell>
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${buClass(r.bu)}`}>
                      {r.bu ?? '—'}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs">
                    <span className="inline-flex rounded-full border border-border bg-muted/50 px-2 py-0.5">
                      {r.commercial_name ?? '—'}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-sm max-w-[200px]">{r.entity}</TableCell>
                  <TableCell className="text-xs tabular-nums">{r.client_number ?? '—'}</TableCell>
                  <TableCell className="text-xs tabular-nums">{r.order_number ?? '—'}</TableCell>
                  <TableCell className="text-xs tabular-nums">{r.invoice_number ?? '—'}</TableCell>
                  <TableCell className="max-w-[180px]">
                    {r.forfait ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className={`inline-block max-w-[170px] truncate rounded-full border px-2 py-0.5 text-[11px] ${forfaitClass(r.forfait)}`}>
                              {r.forfait}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>{r.forfait}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="text-xs max-w-[160px]">
                    {r.tickets_label && (
                      <div className="whitespace-pre-line text-muted-foreground">{r.tickets_label}</div>
                    )}
                    {r.tickets_remaining !== null && (
                      <Badge variant="outline" className="mt-1">
                        {r.tickets_remaining}/{r.tickets_initial ?? r.tickets_remaining} ticket(s)
                      </Badge>
                    )}
                    {!r.tickets_label && r.tickets_remaining === null && '—'}
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap">
                    <span className="inline-flex rounded-full border border-border bg-muted/50 px-2 py-0.5">
                      {r.attribution ?? '—'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums">
                    {r.machines_count ?? '—'}
                  </TableCell>
                  <TableCell>
                    <details className="text-[11px] leading-snug">
                      <summary className="cursor-pointer text-muted-foreground line-clamp-2 whitespace-pre-line">
                        {(r.products_sn ?? '—').split('\n').slice(0, 2).join('\n')}
                      </summary>
                      <pre className="mt-1 whitespace-pre-wrap font-sans text-muted-foreground">
                        {r.products_sn ?? '—'}
                      </pre>
                    </details>
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap">{fmtDate(r.start_date)}</TableCell>
                  <TableCell className="text-xs whitespace-nowrap">{fmtDate(r.end_date)}</TableCell>
                  <TableCell>
                    <Badge variant={r.is_paid ? 'default' : 'destructive'}>
                      {r.is_paid ? 'Oui' : 'Non'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      {canEdit && r.tickets_remaining !== null && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Consommer un ticket" onClick={() => consume(r)}>
                          <Ticket className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Historique des tickets" onClick={() => setHistoryRow(r)}>
                        <History className="h-4 w-4" />
                      </Button>
                      {canEdit && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Modifier" onClick={() => setForm({ ...r })}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canEdit && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" title="Supprimer" onClick={() => setDeleteRow(r)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {form && (
        <RowDialog form={form} setForm={setForm} onSave={save} onClose={() => setForm(null)} />
      )}

      {historyRow && (
        <TicketHistoryDialog row={historyRow} onClose={() => setHistoryRow(null)} />
      )}

      <Dialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer cette ligne ?</DialogTitle>
            <DialogDescription>
              « {deleteRow?.entity} » sera définitivement supprimée de la liste.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteRow(null)}>Annuler</Button>
            <Button variant="destructive" onClick={() => deleteRow && remove(deleteRow)}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RowDialog({
  form,
  setForm,
  onSave,
  onClose,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  onSave: (f: FormState) => void;
  onClose: () => void;
}) {
  const set = (patch: Partial<FormState>) => setForm({ ...form, ...patch });
  const num = (v: string) => (v.trim() === '' ? null : Number(v));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{form.id ? 'Modifier la ligne' : 'Nouvelle ligne'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">BU</Label>
            <Input value={form.bu ?? ''} onChange={(e) => set({ bu: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Commercial(e)</Label>
            <Input value={form.commercial_name ?? ''} onChange={(e) => set({ commercial_name: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Attribution</Label>
            <Select value={form.attribution ?? ''} onValueChange={(v) => set({ attribution: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Parc">Parc</SelectItem>
                <SelectItem value="Unité(s)">Unité(s)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-3">
            <Label className="text-xs">Entité *</Label>
            <Input value={form.entity} onChange={(e) => set({ entity: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">N°Clt</Label>
            <Input value={form.client_number ?? ''} onChange={(e) => set({ client_number: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">N° Cmd</Label>
            <Input value={form.order_number ?? ''} onChange={(e) => set({ order_number: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">N° Fact.</Label>
            <Input value={form.invoice_number ?? ''} onChange={(e) => set({ invoice_number: e.target.value })} />
          </div>
          <div className="sm:col-span-3">
            <Label className="text-xs">Forfait</Label>
            <Input value={form.forfait ?? ''} onChange={(e) => set({ forfait: e.target.value })} />
          </div>
          <div className="sm:col-span-3">
            <Label className="text-xs">Nbre. Tickets (libellé)</Label>
            <Textarea
              rows={2}
              value={form.tickets_label ?? ''}
              onChange={(e) => set({ tickets_label: e.target.value })}
              placeholder="ex. 39 x ARTSIDE GAME BASE"
            />
          </div>
          <div>
            <Label className="text-xs">Tickets initiaux</Label>
            <Input
              type="number"
              value={form.tickets_initial ?? ''}
              onChange={(e) => {
                const v = num(e.target.value);
                set({
                  tickets_initial: v,
                  tickets_remaining: form.id ? form.tickets_remaining : v,
                });
              }}
            />
          </div>
          <div>
            <Label className="text-xs">Tickets restants</Label>
            <Input
              type="number"
              value={form.tickets_remaining ?? ''}
              onChange={(e) => set({ tickets_remaining: num(e.target.value) })}
            />
          </div>
          <div>
            <Label className="text-xs">Nbre Machine(s)</Label>
            <Input
              type="number"
              value={form.machines_count ?? ''}
              onChange={(e) => set({ machines_count: num(e.target.value) })}
            />
          </div>
          <div className="sm:col-span-3">
            <Label className="text-xs">Liste Produit(s)\SN</Label>
            <Textarea
              rows={6}
              value={form.products_sn ?? ''}
              onChange={(e) => set({ products_sn: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs">Début</Label>
            <Input type="date" value={form.start_date ?? ''} onChange={(e) => set({ start_date: e.target.value || null })} />
          </div>
          <div>
            <Label className="text-xs">Fin</Label>
            <Input type="date" value={form.end_date ?? ''} onChange={(e) => set({ end_date: e.target.value || null })} />
          </div>
          <div className="flex items-end gap-2 pb-1">
            <Switch checked={form.is_paid} onCheckedChange={(c) => set({ is_paid: c })} />
            <Label className="text-xs text-muted-foreground">{form.is_paid ? 'Payé' : 'Non payé'}</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={() => onSave(form)}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TicketHistoryDialog({ row, onClose }: { row: RemoteSupportRow; onClose: () => void }) {
  const logQ = useQuery({
    queryKey: ['remote-support-log', row.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('remote_support_ticket_log')
        .select('id, used_at, used_by_name, note')
        .eq('client_id', row.id)
        .order('used_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Historique des tickets — {row.entity}</DialogTitle>
          <DialogDescription>
            {row.tickets_remaining !== null
              ? `${row.tickets_remaining} ticket(s) restant(s) sur ${row.tickets_initial ?? row.tickets_remaining}.`
              : 'Aucun quota de tickets défini sur cette ligne.'}
          </DialogDescription>
        </DialogHeader>
        {logQ.isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : (logQ.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune consommation enregistrée.</p>
        ) : (
          <ul className="space-y-2 max-h-72 overflow-y-auto">
            {(logQ.data ?? []).map((l) => (
              <li key={l.id} className="text-sm border-b border-border pb-1">
                <span className="font-medium">
                  {new Date(l.used_at).toLocaleString('fr-FR')}
                </span>{' '}
                — {l.used_by_name ?? 'Utilisateur'}
                {l.note ? ` · ${l.note}` : ''}
              </li>
            ))}
          </ul>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
