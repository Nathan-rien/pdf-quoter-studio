import { useEffect, useMemo, useRef, useState } from 'react';
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd';
import { AlertTriangle, Copy, Eye, FileDown, GripVertical, Plus, Save, Trash2, Truck, FilePlus2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useCommerciaux } from '@/hooks/useCommerciaux';
import { useBaseTaux, useFinancialPartners } from '@/hooks/useFinancialPartners';
import {
  loadTransacQuote, transacQuoteNumberExists, useSaveTransacQuote, useTransacBrandSettings,
  type FrozenRental, type TransacEditorState,
} from '@/hooks/useTransacQuotes';
import {
  availableDurations, computeTransacRental, computeTransacTotals, lineMargin, lineTotalHt, realMarkupRate,
  suggestedUnitPrice, transacPdfFileName, type TransacLine, type TransacRentalResult,
} from '@/lib/transac-calculations';
import { generateTransacQuoteHtml, toPrintModel, type TransacAddress } from '@/lib/transac-html-generator';
import { TRANSAC_BRAND_DEFAULTS, type TransacBrand } from '@/lib/transac-brands';
import { htmlToPdfBlob } from '@/lib/html-to-pdf';
import { cn } from '@/lib/utils';
import cbproLogo from '@/assets/cbpro-logo.svg.asset.json';
import grosbillLogo from '@/assets/logos/grosbill-color.svg';

const DRAFT_KEY = 'transac-quote-draft';
const BEST = '__best__';
const iso = (d: Date) => d.toISOString().slice(0, 10);
const plusDays = (s: string, n: number) => { const d = new Date(`${s}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
const eur = (n: number) => `${n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const uid = () => crypto.randomUUID();
export const LOGOS: Record<TransacBrand, string> = { 'cybertek-pro': cbproLogo.url, 'grosbill-pro': grosbillLogo };

const newLine = (lineType: TransacLine['lineType'] = 'product'): TransacLine => ({
  id: uid(), lineType, reference: '', designation: lineType === 'delivery' ? 'Frais de livraison' : '',
  ecoParticipation: null, unitPriceHt: 0, quantity: 1, purchasePrice: null, supplier: '', supplierRef: '', markupRate: null,
});

export function emptyTransacState(): TransacEditorState {
  const today = iso(new Date());
  return {
    id: null, brand: 'cybertek-pro', quoteNumber: '', clientNumber: '', clientName: '', quoteDate: today,
    validUntil: plusDays(today, 7), commercialId: '', commercialName: '', deliveryAddress: {}, billingAddress: {},
    billingSameAsDelivery: true, comment: '', lines: [newLine()], rentalEnabled: false, rentalDuration: null,
    rentalPartner: null, rentalPeriodicity: 'mensuel', frozenRental: null,
  };
}

const rentalKey = (s: TransacEditorState, amount: number) =>
  JSON.stringify([amount, s.rentalDuration, s.rentalPartner, s.rentalPeriodicity]);

export interface TransacOpenRequest { id: string; duplicate: boolean; nonce: number }

function NumInput({ value, onChange, className, placeholder }: { value: number | null; onChange: (v: number | null) => void; className?: string; placeholder?: string }) {
  const [text, setText] = useState(value === null ? '' : String(value));
  useEffect(() => {
    const parsed = text.trim() === '' ? null : Number(text.replace(',', '.'));
    if (parsed !== value) setText(value === null ? '' : String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <Input
      className={cn('h-8 text-right font-mono text-xs', className)} inputMode="decimal" value={text} placeholder={placeholder}
      onChange={(e) => {
        setText(e.target.value);
        const t = e.target.value.trim().replace(',', '.');
        if (t === '') onChange(null);
        else if (Number.isFinite(Number(t))) onChange(Number(t));
      }}
    />
  );
}

function AddressFields({ value, onChange, disabled }: { value: TransacAddress; onChange: (a: TransacAddress) => void; disabled?: boolean }) {
  const set = (k: keyof TransacAddress) => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...value, [k]: e.target.value });
  return (
    <div className="grid gap-2">
      <Input placeholder="Nom / Raison sociale" value={value.name ?? ''} onChange={set('name')} disabled={disabled} />
      <Input placeholder="Adresse" value={value.street ?? ''} onChange={set('street')} disabled={disabled} />
      <div className="grid grid-cols-3 gap-2">
        <Input placeholder="CP" value={value.zip ?? ''} onChange={set('zip')} disabled={disabled} />
        <Input className="col-span-2" placeholder="Ville" value={value.city ?? ''} onChange={set('city')} disabled={disabled} />
      </div>
    </div>
  );
}

export function TransacQuoteEditor({ openRequest, onOpenHandled }: { openRequest: TransacOpenRequest | null; onOpenHandled: () => void }) {
  const { toast } = useToast();
  const { isAdmin, user } = useAuth();
  const { commerciaux } = useCommerciaux();
  const { data: partners = [] } = useFinancialPartners({ includeInactive: true });
  const { data: rows = [] } = useBaseTaux();
  const { data: brandSettings } = useTransacBrandSettings();
  const save = useSaveTransacQuote();

  const [s, setS] = useState<TransacEditorState>(() => {
    try { const raw = localStorage.getItem(DRAFT_KEY); if (raw) return { ...emptyTransacState(), ...JSON.parse(raw) }; } catch { /* noop */ }
    return emptyTransacState();
  });
  const [authorId, setAuthorId] = useState<string | null>(null);
  const [dupWarning, setDupWarning] = useState(false);
  const [confirmNegative, setConfirmNegative] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const loadedNonce = useRef<number | null>(null);

  useEffect(() => { localStorage.setItem(DRAFT_KEY, JSON.stringify(s)); }, [s]);

  useEffect(() => {
    if (!openRequest || loadedNonce.current === openRequest.nonce) return;
    loadedNonce.current = openRequest.nonce;
    loadTransacQuote(openRequest.id)
      .then((loaded) => {
        if (openRequest.duplicate) {
          setS({ ...loaded, id: null, quoteNumber: '', frozenRental: null, quoteDate: iso(new Date()), validUntil: plusDays(iso(new Date()), 7),
            lines: loaded.lines.map((l) => ({ ...l, id: uid() })) });
          setAuthorId(null);
          toast({ title: 'Devis dupliqué', description: 'Saisissez le nouveau n° de devis. La location est recalculée au tarif actuel.' });
        } else {
          setS(loaded);
        }
      })
      .catch((e) => toast({ title: 'Ouverture impossible', description: String(e?.message ?? e), variant: 'destructive' }))
      .finally(onOpenHandled);
  }, [openRequest, onOpenHandled, toast]);

  // Auteur du devis ouvert : seul l'auteur ou un admin peut changer le commercial désigné.
  useEffect(() => {
    if (!s.id) { setAuthorId(null); return; }
    import('@/integrations/supabase/client').then(({ supabase }) =>
      supabase.from('transac_quotes').select('created_by').eq('id', s.id!).single().then(({ data }) => setAuthorId(data?.created_by ?? null)));
  }, [s.id]);
  const canChangeCommercial = isAdmin || !s.id || authorId === user?.id;

  useEffect(() => {
    const t = setTimeout(() => { transacQuoteNumberExists(s.quoteNumber, s.id).then(setDupWarning); }, 400);
    return () => clearTimeout(t);
  }, [s.quoteNumber, s.id]);

  const update = (patch: Partial<TransacEditorState>) => setS((p) => ({ ...p, ...patch }));
  const updateLine = (id: string, patch: Partial<TransacLine>) =>
    setS((p) => ({ ...p, lines: p.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));

  const onPurchaseOrRate = (l: TransacLine, purchasePrice: number | null, markupRate: number | null) => {
    const pu = suggestedUnitPrice(purchasePrice, markupRate);
    updateLine(l.id, { purchasePrice, markupRate, ...(pu !== null ? { unitPriceHt: pu } : {}) });
  };
  const onUnitPrice = (l: TransacLine, v: number | null) =>
    updateLine(l.id, { unitPriceHt: v ?? 0, markupRate: realMarkupRate(v ?? 0, l.purchasePrice) ?? l.markupRate });

  const totals = useMemo(() => computeTransacTotals(s.lines), [s.lines]);
  const durations = useMemo(() => availableDurations(partners, rows), [partners, rows]);
  const activePartners = partners.filter((p) => p.isActive);

  const rental: TransacRentalResult | null = useMemo(() => {
    if (!s.rentalEnabled) return null;
    const key = rentalKey(s, totals.totalHt);
    if (s.frozenRental && s.frozenRental.key === key) return s.frozenRental.result;
    return computeTransacRental(partners, rows, {
      amount: totals.totalHt, durationMonths: s.rentalDuration, partnerName: s.rentalPartner, periodicity: s.rentalPeriodicity,
    });
  }, [s, totals.totalHt, partners, rows]);
  const frozenForSave = (): FrozenRental | null =>
    rental && rental.status === 'ok' ? { key: rentalKey(s, totals.totalHt), result: rental } : null;

  const brandCommerciaux = commerciaux.filter((c) => c.entity === s.brand);
  const selectedCommercial = commerciaux.find((c) => c.id === s.commercialId) ?? null;
  const brand = brandSettings?.[s.brand] ?? TRANSAC_BRAND_DEFAULTS[s.brand];

  const buildHtml = () => generateTransacQuoteHtml(toPrintModel({
    brand: s.brand, quoteNumber: s.quoteNumber, clientNumber: s.clientNumber, clientName: s.clientName,
    quoteDate: s.quoteDate, validUntil: s.validUntil,
    commercialName: selectedCommercial?.nom ?? s.commercialName, commercialPhone: selectedCommercial?.telephone ?? null,
    commercialEmail: selectedCommercial?.email ?? null, deliveryAddress: s.deliveryAddress, billingAddress: s.billingAddress,
    billingSameAsDelivery: s.billingSameAsDelivery, comment: s.comment, lines: s.lines, rental,
  }, brand, new URL(LOGOS[s.brand], window.location.origin).href));

  const validate = () => {
    if (!s.quoteNumber.trim()) { toast({ title: 'N° de devis obligatoire', description: "Saisissez le n° de cotation de l'ERP.", variant: 'destructive' }); return false; }
    return true;
  };

  const doSave = async (exported = false) => {
    if (!validate()) return null;
    try {
      const id = await save.mutateAsync({ state: s, rental: frozenForSave(), exported });
      setS((p) => ({ ...p, id, frozenRental: frozenForSave() }));
      if (!exported) toast({ title: 'Devis enregistré' });
      return id;
    } catch (e) {
      toast({ title: 'Enregistrement impossible', description: (e as Error).message, variant: 'destructive' });
      return null;
    }
  };

  const doExport = async () => {
    setConfirmNegative(false);
    setExporting(true);
    try {
      const id = await doSave(true);
      if (!id) return;
      const blob = await htmlToPdfBlob(buildHtml());
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = transacPdfFileName(brand.label, s.quoteNumber, s.clientName || s.deliveryAddress.name || '');
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      toast({ title: 'PDF exporté', description: a.download });
    } catch (e) {
      toast({ title: 'Export PDF impossible', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  const requestExport = () => {
    if (!validate()) return;
    if (totals.hasNegativeMargin) setConfirmNegative(true);
    else void doExport();
  };

  const onDragEnd = (r: DropResult) => {
    if (!r.destination) return;
    setS((p) => { const lines = [...p.lines]; const [m] = lines.splice(r.source.index, 1); lines.splice(r.destination!.index, 0, m); return { ...p, lines }; });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Proposition transactionnelle</h1>
          <p className="text-xs text-muted-foreground">{s.id ? 'Devis enregistré — modifications en cours' : 'Nouveau devis'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => { setS(emptyTransacState()); }}><FilePlus2 className="h-4 w-4 mr-1" />Nouveau</Button>
          <Button variant="outline" size="sm" onClick={() => setPreview(buildHtml())}><Eye className="h-4 w-4 mr-1" />Aperçu</Button>
          <Button variant="outline" size="sm" onClick={() => doSave()} disabled={save.isPending}><Save className="h-4 w-4 mr-1" />Enregistrer</Button>
          <Button size="sm" onClick={requestExport} disabled={exporting}><FileDown className="h-4 w-4 mr-1" />{exporting ? 'Export…' : 'Exporter PDF'}</Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">En-tête</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1">
            <Label>Marque</Label>
            <Select value={s.brand} onValueChange={(v) => update({ brand: v as TransacBrand, commercialId: '', commercialName: '' })} disabled={!canChangeCommercial}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="cybertek-pro">Cybertek Pro</SelectItem><SelectItem value="grosbill-pro">Grosbill Pro</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>N° de devis (ERP) *</Label>
            <Input value={s.quoteNumber} onChange={(e) => update({ quoteNumber: e.target.value })} placeholder="N° de cotation" />
            {dupWarning && <p className="text-xs text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Ce n° existe déjà dans un autre devis transac.</p>}
          </div>
          <div className="space-y-1"><Label>N° client</Label><Input value={s.clientNumber} onChange={(e) => update({ clientNumber: e.target.value })} /></div>
          <div className="space-y-1"><Label>Client</Label><Input value={s.clientName} onChange={(e) => update({ clientName: e.target.value })} placeholder="Raison sociale" /></div>
          <div className="space-y-1"><Label>Date du devis</Label><Input type="date" value={s.quoteDate} onChange={(e) => update({ quoteDate: e.target.value })} /></div>
          <div className="space-y-1"><Label>Validité</Label><Input type="date" value={s.validUntil} onChange={(e) => update({ validUntil: e.target.value })} /></div>
          <div className="space-y-1 md:col-span-2">
            <Label>Commercial</Label>
            <Select
              value={s.commercialId || undefined}
              onValueChange={(v) => { const c = commerciaux.find((x) => x.id === v); update({ commercialId: v, commercialName: c?.nom ?? '' }); }}
              disabled={!canChangeCommercial}
            >
              <SelectTrigger><SelectValue placeholder="Choisir un commercial" /></SelectTrigger>
              <SelectContent>{brandCommerciaux.map((c) => <SelectItem key={c.id} value={c.id}>{c.nom}{c.telephone ? ` · ${c.telephone}` : ''}</SelectItem>)}</SelectContent>
            </Select>
            {!canChangeCommercial && <p className="text-xs text-muted-foreground">Seuls l'auteur du devis et les admins peuvent changer le commercial.</p>}
          </div>
          <div className="space-y-1 md:col-span-2"><Label>Adresse de livraison</Label><AddressFields value={s.deliveryAddress} onChange={(a) => update({ deliveryAddress: a })} /></div>
          <div className="space-y-1 md:col-span-2">
            <div className="flex items-center justify-between">
              <Label>Adresse de facturation</Label>
              <label className="flex items-center gap-2 text-xs"><Checkbox checked={s.billingSameAsDelivery} onCheckedChange={(v) => update({ billingSameAsDelivery: !!v })} />Identique à la livraison</label>
            </div>
            <AddressFields value={s.billingSameAsDelivery ? s.deliveryAddress : s.billingAddress} onChange={(a) => update({ billingAddress: a })} disabled={s.billingSameAsDelivery} />
          </div>
          <div className="space-y-1 md:col-span-4"><Label>Commentaire</Label><Textarea rows={2} value={s.comment} onChange={(e) => update({ comment: e.target.value })} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Lignes</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => update({ lines: [...s.lines, newLine()] })}><Plus className="h-4 w-4 mr-1" />Ligne</Button>
            <Button size="sm" variant="outline" onClick={() => update({ lines: [...s.lines, newLine('delivery')] })}><Truck className="h-4 w-4 mr-1" />Frais de livraison</Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-xs min-w-[1200px]">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="w-6" /><th className="p-1 w-28">Réf.</th><th className="p-1">Désignation</th><th className="p-1 w-20">Éco-part.</th>
                <th className="p-1 w-24">PU HT</th><th className="p-1 w-16">Qté</th><th className="p-1 w-24 text-right">Total HT</th>
                <th className="p-1 w-24 bg-muted/60">Px achat</th><th className="p-1 w-20 bg-muted/60">Tx marque %</th>
                <th className="p-1 w-24 bg-muted/60">Grossiste</th><th className="p-1 w-24 bg-muted/60">Réf. fourn.</th>
                <th className="p-1 w-24 bg-muted/60 text-right">Marge</th><th className="w-8" />
              </tr>
            </thead>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="transac-lines">
                {(prov) => (
                  <tbody ref={prov.innerRef} {...prov.droppableProps}>
                    {s.lines.map((l, i) => {
                      const m = lineMargin(l);
                      const neg = (m ?? 0) < 0;
                      return (
                        <Draggable key={l.id} draggableId={l.id} index={i}>
                          {(dp) => (
                            <tr ref={dp.innerRef} {...dp.draggableProps} className={cn('border-t align-top', neg && 'bg-destructive/10')}>
                              <td className="pt-2" {...dp.dragHandleProps}><GripVertical className="h-4 w-4 text-muted-foreground" /></td>
                              <td className="p-1"><Input className="h-8 text-xs" value={l.reference} onChange={(e) => updateLine(l.id, { reference: e.target.value })} /></td>
                              <td className="p-1"><Textarea rows={1} className="min-h-8 text-xs" value={l.designation} onChange={(e) => updateLine(l.id, { designation: e.target.value })} /></td>
                              <td className="p-1"><NumInput value={l.ecoParticipation} onChange={(v) => updateLine(l.id, { ecoParticipation: v })} /></td>
                              <td className="p-1"><NumInput value={l.unitPriceHt} onChange={(v) => onUnitPrice(l, v)} /></td>
                              <td className="p-1"><NumInput value={l.quantity} onChange={(v) => updateLine(l.id, { quantity: v ?? 0 })} /></td>
                              <td className="p-1 pt-2 text-right font-mono">{eur(lineTotalHt(l))}</td>
                              <td className="p-1 bg-muted/40"><NumInput value={l.purchasePrice} onChange={(v) => onPurchaseOrRate(l, v, l.markupRate)} /></td>
                              <td className="p-1 bg-muted/40"><NumInput value={l.markupRate} onChange={(v) => onPurchaseOrRate(l, l.purchasePrice, v)} className={cn(l.markupRate !== null && l.markupRate >= 100 && 'border-destructive')} /></td>
                              <td className="p-1 bg-muted/40"><Input className="h-8 text-xs" value={l.supplier} onChange={(e) => updateLine(l.id, { supplier: e.target.value })} /></td>
                              <td className="p-1 bg-muted/40"><Input className="h-8 text-xs" value={l.supplierRef} onChange={(e) => updateLine(l.id, { supplierRef: e.target.value })} /></td>
                              <td className={cn('p-1 pt-2 bg-muted/40 text-right font-mono', neg && 'text-destructive font-semibold')}>
                                {m === null ? '—' : eur(m)}
                                {neg && <AlertTriangle className="inline h-3 w-3 ml-1" />}
                              </td>
                              <td className="p-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => update({ lines: s.lines.filter((x) => x.id !== l.id) })}><Trash2 className="h-4 w-4" /></Button></td>
                            </tr>
                          )}
                        </Draggable>
                      );
                    })}
                    {prov.placeholder}
                  </tbody>
                )}
              </Droppable>
            </DragDropContext>
          </table>
          <p className="text-[11px] text-muted-foreground mt-2">Les colonnes grisées sont internes : elles n'apparaissent jamais sur le PDF. Le PU suggéré = prix d'achat / (1 − taux de marque) ; modifier le PU recalcule le taux réel.</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Option location</CardTitle>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={s.rentalEnabled} onCheckedChange={(v) => update({ rentalEnabled: !!v })} />Proposer un financement</label>
          </CardHeader>
          {s.rentalEnabled && (
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label>Durée</Label>
                  <Select value={s.rentalDuration ? String(s.rentalDuration) : undefined} onValueChange={(v) => update({ rentalDuration: Number(v) })}>
                    <SelectTrigger><SelectValue placeholder="Mois" /></SelectTrigger>
                    <SelectContent>{durations.map((d) => <SelectItem key={d} value={String(d)}>{d} mois</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Périodicité</Label>
                  <Select value={s.rentalPeriodicity} onValueChange={(v) => update({ rentalPeriodicity: v as TransacEditorState['rentalPeriodicity'] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="mensuel">Mensuelle</SelectItem><SelectItem value="trimestriel">Trimestrielle</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Partenaire</Label>
                  <Select value={s.rentalPartner ?? BEST} onValueChange={(v) => update({ rentalPartner: v === BEST ? null : v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={BEST}>Meilleur coefficient</SelectItem>
                      {activePartners.map((p) => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Montant financé : <span className="font-mono">{eur(totals.totalHt)}</span> HT</p>
              {rental?.status === 'ok' ? (
                <div className="grid grid-cols-2 gap-1 rounded-md border p-3 font-mono text-xs">
                  <span className="text-muted-foreground font-sans">Partenaire (interne)</span><span>{rental.partnerName}</span>
                  <span className="text-muted-foreground font-sans">Coefficient</span><span>{rental.coefficient}</span>
                  <span className="text-muted-foreground font-sans">Loyer {rental.periodicity === 'trimestriel' ? 'trimestriel' : 'mensuel'} HT</span><span>{eur(rental.periodRent)}</span>
                  <span className="text-muted-foreground font-sans">Coût total HT</span><span>{eur(rental.totalCost)}</span>
                  <span className="text-muted-foreground font-sans">Frais de dossier</span><span>{rental.fraisDossier === null ? '—' : eur(rental.fraisDossier)}</span>
                </div>
              ) : rental ? (
                <p className={cn('text-xs', rental.status === 'out_of_range' ? 'text-destructive' : 'text-muted-foreground')}>{rental.message}</p>
              ) : null}
              {s.frozenRental && rental === s.frozenRental.result && <p className="text-[11px] text-muted-foreground">Tarif enregistré avec le devis.</p>}
            </CardContent>
          )}
        </Card>

        <Card className={cn(totals.hasNegativeMargin && 'border-destructive')}>
          <CardHeader className="pb-2"><CardTitle className="text-base">Totaux</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between"><span>Total HT</span><span className="font-mono">{eur(totals.totalHt)}</span></div>
            <div className="flex justify-between"><span>TVA 20 %</span><span className="font-mono">{eur(totals.totalTva)}</span></div>
            <div className="flex justify-between font-semibold border-t pt-1"><span>Total TTC</span><span className="font-mono">{eur(totals.totalTtc)}</span></div>
            <div className={cn('flex justify-between mt-2 rounded bg-muted/50 px-2 py-1', totals.margin < 0 && 'text-destructive')}>
              <span>Marge totale (interne)</span>
              <span className="font-mono">{eur(totals.margin)}{totals.marginPercent !== null && ` · ${totals.marginPercent.toLocaleString('fr-FR')} %`}</span>
            </div>
            {totals.hasNegativeMargin && (
              <p className="flex items-center gap-1 text-xs text-destructive"><AlertTriangle className="h-3 w-3" />Marge négative détectée : une confirmation sera demandée avant l'export.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={confirmNegative} onOpenChange={setConfirmNegative}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marge négative</AlertDialogTitle>
            <AlertDialogDescription>
              {totals.negativeLineIds.length > 0 && `${totals.negativeLineIds.length} ligne(s) ont une marge négative. `}
              Marge totale : {eur(totals.margin)}. Confirmez-vous l'export du devis en l'état ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => void doExport()}>Exporter malgré tout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-[900px] h-[90vh] flex flex-col">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Copy className="h-4 w-4" />Aperçu du devis</DialogTitle></DialogHeader>
          {preview && <iframe title="Aperçu devis" sandbox="" srcDoc={preview} className="flex-1 w-full border rounded bg-background" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
