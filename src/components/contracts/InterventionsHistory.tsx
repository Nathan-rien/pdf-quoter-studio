import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Download, FileDown, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { htmlToPdfBlob } from '@/lib/html-to-pdf';
import { ContractIntervention, downloadRecap, filterInterventions, interventionDate, interventionHours, interventionsCsv, interventionsRecapHtml, INTERVENTION_STATUS_LABELS } from '@/lib/interventions-recap';

export function InterventionsHistory({ contractId, clientName, contractNumber }: { contractId: string; clientName: string; contractNumber: string | null }) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [exporting, setExporting] = useState(false);
  const query = useQuery({
    queryKey: ['contract-interventions', contractId], refetchInterval: 15000,
    queryFn: async (): Promise<ContractIntervention[]> => {
      const { data, error } = await supabase.rpc('get_contract_interventions', { _contract_id: contractId });
      if (error) throw error;
      return Array.isArray(data) ? data as unknown as ContractIntervention[] : [];
    },
  });
  const rows = query.data ?? [];
  const selected = filterInterventions(rows, from, to);
  const totals = interventionHours(selected);
  const invalidPeriod = !!from && !!to && from > to;
  const filename = `interventions-${clientName.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  async function exportPdf() {
    setExporting(true);
    try { downloadRecap(await htmlToPdfBlob(interventionsRecapHtml(selected, clientName, contractNumber, from, to)), `${filename}.pdf`); }
    catch { toast.error('Export indisponible', { description: 'INTERVENTIONS_PDF — Le récap PDF n’a pas pu être créé. Réessayez.' }); }
    finally { setExporting(false); }
  }
  return <section className="space-y-3 border-t border-border pt-4">
    <div className="flex items-center justify-between gap-2 flex-wrap"><h3 className="text-sm font-semibold flex items-center gap-2"><CalendarDays className="h-4 w-4" />Interventions <Badge variant="secondary">{rows.length}</Badge></h3><Button variant="outline" size="sm" onClick={() => setOpen(true)} disabled={query.isLoading || !!query.error}><FileDown className="h-4 w-4 mr-1" />Récap interventions</Button></div>
    {query.isLoading ? <p className="text-xs text-muted-foreground">Chargement des interventions…</p> : query.error ? <div className="text-sm text-destructive">INTERVENTIONS_READ — Historique indisponible. <Button variant="ghost" size="sm" onClick={() => query.refetch()}>Réessayer</Button></div> : rows.length === 0 ? <p className="text-xs text-muted-foreground">Aucune intervention.</p> : <div className="overflow-x-auto"><table className="w-full text-xs"><thead className="text-muted-foreground"><tr>{['Date', 'Technicien', 'Prestation', 'Durée', 'Statut', 'Commentaire'].map(label => <th key={label} className="text-left p-2 font-medium">{label}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.id} className="border-t border-border"><td className="p-2 whitespace-nowrap">{interventionDate(row.date_intervention)}</td><td className="p-2">{row.technician_name}</td><td className="p-2">{row.resolved_service_label || row.service_label || 'Prestation non précisée'}</td><td className="p-2 whitespace-nowrap">{row.duree_estimee_minutes == null ? '—' : `${(Math.round(row.duree_estimee_minutes / 60 * 100) / 100).toFixed(2)} h`}</td><td className="p-2"><Badge variant="outline">{INTERVENTION_STATUS_LABELS[row.statut]}</Badge></td><td className="p-2 whitespace-pre-wrap max-w-xs break-words">{row.commentaire || '—'}</td></tr>)}</tbody></table></div>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Récap interventions — {clientName}</DialogTitle></DialogHeader><div className="grid grid-cols-2 gap-3"><div><Label htmlFor={`from-${contractId}`}>Du</Label><Input id={`from-${contractId}`} type="date" value={from} onChange={e => setFrom(e.target.value)} /></div><div><Label htmlFor={`to-${contractId}`}>Au</Label><Input id={`to-${contractId}`} type="date" value={to} onChange={e => setTo(e.target.value)} /></div></div>{invalidPeriod ? <p className="text-sm text-destructive">La date de fin doit suivre la date de début.</p> : <div className="text-sm space-y-1"><p>{selected.length} intervention(s)</p>{Object.entries(totals).map(([status, hours]) => <p key={status}>{INTERVENTION_STATUS_LABELS[status as keyof typeof totals]} : {hours.toFixed(2)} h</p>)}</div>}<div className="flex justify-end gap-2"><Button variant="outline" disabled={invalidPeriod} onClick={() => downloadRecap(new Blob([interventionsCsv(selected)], { type: 'text/csv;charset=utf-8' }), `${filename}.csv`)}><Download className="h-4 w-4 mr-1" />CSV</Button><Button disabled={exporting || invalidPeriod} onClick={exportPdf}>{exporting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileDown className="h-4 w-4 mr-1" />}PDF</Button></div></DialogContent></Dialog>
  </section>;
}