import { useMemo, useState } from 'react';
import { Copy, FolderOpen, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useDeleteTransacQuote, useTransacQuotes } from '@/hooks/useTransacQuotes';

const eur = (n: number) => `${Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const ALL = '__all__';

export function TransacHistoryView({ onOpen }: { onOpen: (id: string, duplicate: boolean) => void }) {
  const { toast } = useToast();
  const { data = [], isLoading, error } = useTransacQuotes();
  const del = useDeleteTransacQuote();
  const [brand, setBrand] = useState(ALL);
  const [commercial, setCommercial] = useState(ALL);
  const [client, setClient] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const commercials = useMemo(() => [...new Set(data.map((q) => q.commercial_name).filter(Boolean) as string[])].sort(), [data]);
  const filtered = data.filter((q) =>
    (brand === ALL || q.brand === brand) &&
    (commercial === ALL || q.commercial_name === commercial) &&
    (!client.trim() || `${q.client_name ?? ''} ${q.client_number ?? ''} ${q.quote_number}`.toLowerCase().includes(client.trim().toLowerCase())) &&
    (!from || q.quote_date >= from) && (!to || q.quote_date <= to));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Historique transactionnel</h1>
      <Card>
        <CardContent className="pt-4 grid gap-2 md:grid-cols-5">
          <div className="relative md:col-span-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Client, n° client ou n° devis" value={client} onChange={(e) => setClient(e.target.value)} />
          </div>
          <Select value={brand} onValueChange={setBrand}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value={ALL}>Toutes marques</SelectItem><SelectItem value="cybertek-pro">Cybertek Pro</SelectItem><SelectItem value="grosbill-pro">Grosbill Pro</SelectItem></SelectContent>
          </Select>
          <Select value={commercial} onValueChange={setCommercial}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value={ALL}>Tous commerciaux</SelectItem>{commercials.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          <div className="flex gap-1"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        </CardContent>
      </Card>
      {error && <p className="text-sm text-destructive">Chargement impossible : {(error as Error).message}</p>}
      {isLoading ? <p className="text-sm text-muted-foreground">Chargement…</p> : (
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr><th className="p-2">Date</th><th className="p-2">N° devis</th><th className="p-2">Marque</th><th className="p-2">Client</th><th className="p-2">Commercial</th><th className="p-2 text-right">Total HT</th><th className="p-2">Statut</th><th className="p-2" /></tr>
            </thead>
            <tbody>
              {filtered.map((q) => (
                <tr key={q.id} className="border-t">
                  <td className="p-2">{new Date(`${q.quote_date}T00:00:00`).toLocaleDateString('fr-FR')}</td>
                  <td className="p-2 font-mono">{q.quote_number}</td>
                  <td className="p-2">{q.brand === 'grosbill-pro' ? 'Grosbill Pro' : 'Cybertek Pro'}</td>
                  <td className="p-2">{q.client_name || '—'}{q.client_number && <span className="text-xs text-muted-foreground"> · {q.client_number}</span>}</td>
                  <td className="p-2">{q.commercial_name || '—'}</td>
                  <td className="p-2 text-right font-mono">{eur(q.total_ht)}</td>
                  <td className="p-2 space-x-1">
                    <Badge variant={q.status === 'exported' ? 'default' : 'secondary'}>{q.status === 'exported' ? 'Exporté' : 'Brouillon'}</Badge>
                    {q.rental_enabled && <Badge variant="outline">Location</Badge>}
                  </td>
                  <td className="p-2 whitespace-nowrap text-right">
                    <Button size="sm" variant="ghost" onClick={() => onOpen(q.id, false)} title="Ouvrir / exporter"><FolderOpen className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => onOpen(q.id, true)} title="Dupliquer"><Copy className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" title="Supprimer" onClick={() => {
                      if (!confirm(`Supprimer le devis ${q.quote_number} ?`)) return;
                      del.mutate(q.id, { onError: (e) => toast({ title: 'Suppression impossible', description: (e as Error).message, variant: 'destructive' }) });
                    }}><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">Aucun devis.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
