import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, RefreshCw, Search, Building2, Mail, Phone, FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useClients, useClientHistorique, useContractsByClient, Client } from '@/hooks/useClients';
import { useHubspotSyncLog, useTriggerHubspotSync } from '@/hooks/useHubspotSync';

function ClientDetailDialog({ client, onClose }: { client: Client | null; onClose: () => void }) {
  const { data: historique = [], isLoading: loadingHistorique } = useClientHistorique(client?.id);
  const { data: contrats = [], isLoading: loadingContrats } = useContractsByClient(client?.id);

  return (
    <Dialog open={!!client} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{client?.nom || client?.societe || 'Client'}</DialogTitle>
        </DialogHeader>
        {client && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                {client.societe || '—'}
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                {client.email || '—'}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                {client.telephone || '—'}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Contrats liés</Label>
              {loadingContrats ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : contrats.length === 0 ? (
                <p className="text-xs text-muted-foreground">Aucun contrat lié pour l'instant.</p>
              ) : (
                <div className="space-y-1">
                  {contrats.map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-sm border border-border rounded-md px-3 py-1.5">
                      <span className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        {c.contract_number || c.client_name}
                      </span>
                      <Badge variant="outline" className="text-[10px] uppercase">{c.proposal_type}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Historique HubSpot (devis, factures, deals…)</Label>
              {loadingHistorique ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : historique.length === 0 ? (
                <p className="text-xs text-muted-foreground">Aucun historique importé pour l'instant.</p>
              ) : (
                <div className="space-y-1">
                  {historique.map((h) => (
                    <div key={h.id} className="flex items-center justify-between text-sm border border-border rounded-md px-3 py-1.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px] uppercase">{h.type}</Badge>
                          <span className="truncate">{h.resume || '—'}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {format(parseISO(h.date), 'dd/MM/yyyy', { locale: fr })}
                        </div>
                      </div>
                      {h.montant != null && (
                        <span className="text-xs font-semibold whitespace-nowrap">
                          {h.montant.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function ClientsHubspotView() {
  const { data: clients = [], isLoading: loadingClients } = useClients();
  const { data: syncLog = [], isLoading: loadingLog } = useHubspotSyncLog();
  const triggerSync = useTriggerHubspotSync();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const lastSuccess = syncLog.find((l) => l.status === 'success');
  const isSyncRunning = triggerSync.isPending || syncLog.some((l) => l.status === 'running');

  const filteredClients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      `${c.nom ?? ''} ${c.societe ?? ''} ${c.email ?? ''}`.toLowerCase().includes(q),
    );
  }, [clients, searchQuery]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Clients HubSpot</h1>
        <p className="text-sm text-muted-foreground">
          Fiches clients rapatriées de HubSpot (lecture seule) — contacts, sociétés, historique de devis/factures.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Synchronisation HubSpot</CardTitle>
          <CardDescription>
            {lastSuccess ? (
              <>
                Dernière synchro réussie le{' '}
                <strong>{format(parseISO(lastSuccess.started_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}</strong>{' '}
                ({lastSuccess.records_processed} enregistrements)
              </>
            ) : (
              "Aucune synchro réussie pour l'instant."
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Button onClick={() => triggerSync.mutate()} disabled={isSyncRunning}>
              {isSyncRunning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              {isSyncRunning ? 'Synchro en cours…' : 'Forcer la synchro'}
            </Button>
          </div>

          {loadingLog ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Chargement de l'historique…
            </div>
          ) : syncLog.length > 0 ? (
            <div className="space-y-1.5">
              <Label className="text-xs">Historique des synchros</Label>
              {syncLog.slice(0, 5).map((l) => (
                <div key={l.id} className="flex items-center justify-between text-xs border border-border rounded-md px-3 py-1.5">
                  <span className="flex items-center gap-2">
                    <Badge
                      variant={l.status === 'success' ? 'secondary' : l.status === 'error' ? 'destructive' : 'outline'}
                      className="text-[10px] uppercase"
                    >
                      {l.status}
                    </Badge>
                    {format(parseISO(l.started_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                  </span>
                  <span className="text-muted-foreground truncate max-w-[50%]">
                    {l.status === 'error' ? l.error_message : `${l.records_processed} enregistrements`}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Clients</CardTitle>
          <CardDescription>{clients.length} client(s) importé(s)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher (nom, société, email)…"
              className="h-8 pl-8 text-xs"
            />
          </div>

          {loadingClients ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
            </div>
          ) : filteredClients.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Aucun client. Lancez une synchro pour rapatrier les contacts HubSpot.
            </p>
          ) : (
            <div className="space-y-1.5">
              {filteredClients.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedClient(c)}
                  className="w-full flex items-center justify-between text-left text-sm border border-border rounded-md px-3 py-2 hover:bg-muted/50 transition-colors"
                >
                  <span className="min-w-0">
                    <span className="font-medium">{c.nom || c.societe || '—'}</span>
                    {c.societe && c.nom && <span className="text-muted-foreground"> · {c.societe}</span>}
                  </span>
                  <span className="text-xs text-muted-foreground truncate max-w-[40%]">{c.email}</span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ClientDetailDialog client={selectedClient} onClose={() => setSelectedClient(null)} />
    </div>
  );
}
