import { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Trash2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Tabs, TabsList, TabsTrigger,
} from '@/components/ui/tabs';

interface Intervention {
  id: string;
  reference_id: string;
  technician_user_id: string | null;
  technician_name: string;
  date_intervention: string; // iso
  duree_estimee_minutes: number | null;
  statut: 'prevue' | 'realisee' | 'annulee';
  commentaire: string | null;
  created_by: string | null;
}

interface Ref {
  id: string;
  contract_id: string;
  service_label: string;
  erp_reference: string | null;
  requires_intervention?: boolean | null;
}

interface ContractRow {
  id: string;
  client_name: string;
  contract_number: string | null;
  proposal_id: string | null;
  erp_reference: string | null;
}


export interface PlanningPrefill {
  reference_id: string;
  contract_id: string;
}

interface Props {
  prefill?: PlanningPrefill | null;
  onPrefillHandled?: () => void;
}

const STATUT_LABEL: Record<Intervention['statut'], string> = {
  prevue: 'Prévue',
  realisee: 'Réalisée',
  annulee: 'Annulée',
};

const STATUT_COLOR: Record<Intervention['statut'], string> = {
  prevue: 'bg-blue-500 border-blue-600 text-white',
  realisee: 'bg-emerald-500 border-emerald-600 text-white',
  annulee: 'bg-muted border-border text-muted-foreground line-through',
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function startOfWeek(d: Date) {
  const x = startOfDay(d);
  const dow = (x.getDay() + 6) % 7; // Monday=0
  return addDays(x, -dow);
}
function fmtDay(d: Date) {
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' });
}
function startOfMonth(d: Date) {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}
function endOfMonth(d: Date) {
  const x = startOfMonth(d);
  x.setMonth(x.getMonth() + 1);
  return addDays(x, -1);
}
function fmtRange(view: 'day' | 'week' | 'month', d: Date) {
  if (view === 'day') return d.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  if (view === 'month') return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const start = startOfWeek(d);
  const end = addDays(start, 6);
  return `${start.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} — ${end.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}`;
}

const HOUR_START = 7;
const HOUR_END = 20;
const HOUR_PX = 48; // px per hour

export function PlanningView({ prefill, onPrefillHandled }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user, isAdmin } = useAuth();

  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  const [anchor, setAnchor] = useState<Date>(startOfDay(new Date()));
  const [technicianFilter, setTechnicianFilter] = useState<string>('all');

  const days = useMemo(() => {
    if (view === 'day') return [anchor];
    if (view === 'week') {
      const s = startOfWeek(anchor);
      return Array.from({ length: 7 }, (_, i) => addDays(s, i));
    }
    // month: 6 weeks starting on Monday of the week containing the 1st
    const s = startOfWeek(startOfMonth(anchor));
    return Array.from({ length: 42 }, (_, i) => addDays(s, i));
  }, [view, anchor]);

  const rangeStart = days[0];
  const rangeEnd = addDays(days[days.length - 1], 1);

  const contractsQ = useQuery({
    queryKey: ['pl-contracts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select('id, client_name, contract_number, proposal_id, erp_reference')
        .eq('proposal_type', 'service')
        .order('client_name');
      if (error) throw error;
      return (data ?? []) as ContractRow[];
    },
  });

  const refsQ = useQuery({
    queryKey: ['pl-refs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_service_references')
        .select('id, contract_id, service_label, erp_reference, requires_intervention');
      if (error) throw error;
      return (data ?? []) as Ref[];
    },
  });

  const interventionsQ = useQuery({
    queryKey: ['pl-interventions', rangeStart.toISOString(), rangeEnd.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('intervention_planning')
        .select('*')
        .gte('date_intervention', rangeStart.toISOString())
        .lt('date_intervention', rangeEnd.toISOString())
        .order('date_intervention');
      if (error) throw error;
      return (data ?? []) as Intervention[];
    },
  });

  const technicians = useMemo(() => {
    const s = new Set<string>();
    (interventionsQ.data ?? []).forEach((i) => s.add(i.technician_name));
    return Array.from(s).sort();
  }, [interventionsQ.data]);

  const visibleInterventions = useMemo(() => {
    const list = interventionsQ.data ?? [];
    if (technicianFilter === 'all') return list;
    if (technicianFilter === '__me__') {
      const myName = user?.user_metadata?.full_name || user?.email || '';
      return list.filter((i) => i.technician_user_id === user?.id || i.technician_name === myName);
    }
    return list.filter((i) => i.technician_name === technicianFilter);
  }, [interventionsQ.data, technicianFilter, user]);

  const [dialog, setDialog] = useState<null | { mode: 'create'; date: Date; prefill?: PlanningPrefill } | { mode: 'edit'; intervention: Intervention }>(null);

  // Open dialog when a prefill arrives (from Suivi Techniciens)
  useEffect(() => {
    if (prefill) {
      setDialog({ mode: 'create', date: new Date(), prefill });
      onPrefillHandled?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  const saveMut = useMutation({
    mutationFn: async (payload: Partial<Intervention> & { id?: string }) => {
      if (payload.id) {
        const { id, ...rest } = payload;
        const { error } = await supabase.from('intervention_planning').update(rest).eq('id', id);
        if (error) throw error;
      } else {
        const insertPayload = { ...payload, created_by: user?.id };
        const { error } = await supabase.from('intervention_planning').insert(insertPayload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pl-interventions'] });
      toast({ title: 'Intervention enregistrée' });
      setDialog(null);
    },
    onError: (e: Error) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('intervention_planning').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pl-interventions'] });
      toast({ title: 'Intervention supprimée' });
      setDialog(null);
    },
    onError: (e: Error) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });

  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);

  const contractById = useMemo(() => {
    const m = new Map<string, ContractRow>();
    (contractsQ.data ?? []).forEach((c) => m.set(c.id, c));
    return m;
  }, [contractsQ.data]);
  const refById = useMemo(() => {
    const m = new Map<string, Ref>();
    (refsQ.data ?? []).forEach((r) => m.set(r.id, r));
    return m;
  }, [refsQ.data]);

  function labelForIntervention(i: Intervention) {
    const ref = refById.get(i.reference_id);
    const contract = ref ? contractById.get(ref.contract_id) : undefined;
    return {
      client: contract?.client_name ?? 'Client ?',
      service: ref?.service_label ?? 'Service ?',
    };
  }

  function goToday() { setAnchor(startOfDay(new Date())); }
  function goPrev() {
    if (view === 'day') setAnchor(addDays(anchor, -1));
    else if (view === 'week') setAnchor(addDays(anchor, -7));
    else { const x = new Date(anchor); x.setMonth(x.getMonth() - 1); setAnchor(startOfDay(x)); }
  }
  function goNext() {
    if (view === 'day') setAnchor(addDays(anchor, 1));
    else if (view === 'week') setAnchor(addDays(anchor, 7));
    else { const x = new Date(anchor); x.setMonth(x.getMonth() + 1); setAnchor(startOfDay(x)); }
  }

  function handleSlotClick(day: Date, hour: number, minute: number) {
    const d = new Date(day);
    d.setHours(hour, minute, 0, 0);
    setDialog({ mode: 'create', date: d });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" /> Planning Services
          </h1>
          <p className="text-sm text-muted-foreground">
            Interventions techniciens — {fmtRange(view, anchor)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Tabs value={view} onValueChange={(v) => setView(v as 'day' | 'week' | 'month')}>
            <TabsList>
              <TabsTrigger value="day">Jour</TabsTrigger>
              <TabsTrigger value="week">Semaine</TabsTrigger>
              <TabsTrigger value="month">Mois</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={goPrev}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" onClick={goToday}>Aujourd'hui</Button>
            <Button variant="outline" size="icon" onClick={goNext}><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <Select value={technicianFilter} onValueChange={setTechnicianFilter}>
            <SelectTrigger className="w-52"><SelectValue placeholder="Technicien" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toute l'équipe</SelectItem>
              <SelectItem value="__me__">Mes interventions</SelectItem>
              {technicians.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setDialog({ mode: 'create', date: new Date() })}>
            <Plus className="h-4 w-4 mr-1" /> Nouvelle intervention
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        {view === 'month' ? (
          <MonthGrid
            days={days}
            anchor={anchor}
            interventions={visibleInterventions}
            labelForIntervention={labelForIntervention}
            onDayClick={(d) => setDialog({ mode: 'create', date: (() => { const x = new Date(d); x.setHours(9, 0, 0, 0); return x; })() })}
            onInterventionClick={(i) => setDialog({ mode: 'edit', intervention: i })}
          />
        ) : (
        <div className="grid" style={{ gridTemplateColumns: `56px repeat(${days.length}, minmax(0,1fr))` }}>
          {/* Header */}
          <div className="border-b border-r bg-muted/40" />
          {days.map((d) => (
            <div key={d.toISOString()} className="border-b bg-muted/40 px-2 py-2 text-xs font-semibold text-center">
              {fmtDay(d)}
            </div>
          ))}

          {/* Time column + day columns */}
          <div className="border-r">
            {hours.map((h) => (
              <div key={h} style={{ height: HOUR_PX }} className="text-[10px] text-muted-foreground px-1 pt-0.5 border-b">
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {days.map((day) => {
            const dayInterventions = visibleInterventions.filter((i) => {
              const d = new Date(i.date_intervention);
              return d.getFullYear() === day.getFullYear() && d.getMonth() === day.getMonth() && d.getDate() === day.getDate();
            });
            return (
              <div key={day.toISOString()} className="relative border-r" style={{ height: (HOUR_END - HOUR_START) * HOUR_PX }}>
                {hours.map((h) => (
                  <div
                    key={h}
                    style={{ height: HOUR_PX }}
                    className="border-b hover:bg-primary/5 cursor-pointer"
                    onClick={() => handleSlotClick(day, h, 0)}
                  />
                ))}
                {dayInterventions.map((i) => {
                  const d = new Date(i.date_intervention);
                  const minutesFromStart = (d.getHours() - HOUR_START) * 60 + d.getMinutes();
                  const top = Math.max(0, (minutesFromStart / 60) * HOUR_PX);
                  const height = Math.max(24, ((i.duree_estimee_minutes ?? 60) / 60) * HOUR_PX - 2);
                  const { client, service } = labelForIntervention(i);
                  return (
                    <button
                      key={i.id}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setDialog({ mode: 'edit', intervention: i }); }}
                      className={`absolute left-1 right-1 rounded-md border px-1.5 py-1 text-[11px] leading-tight text-left shadow-sm ${STATUT_COLOR[i.statut]}`}
                      style={{ top, height }}
                      title={`${client} — ${service}\n${i.technician_name}`}
                    >
                      <div className="font-semibold truncate">
                        {d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · {client}
                      </div>
                      <div className="truncate opacity-90">{service}</div>
                      <div className="truncate opacity-80">👤 {i.technician_name}</div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
        )}
      </Card>


      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Badge className="bg-blue-500 hover:bg-blue-500 border-transparent">Prévue</Badge>
        <Badge className="bg-emerald-500 hover:bg-emerald-500 border-transparent">Réalisée</Badge>
        <Badge variant="outline">Annulée</Badge>
      </div>

      {dialog && (
        <InterventionDialog
          open={!!dialog}
          onOpenChange={(o) => !o && setDialog(null)}
          initial={dialog}
          contracts={contractsQ.data ?? []}
          refs={refsQ.data ?? []}
          currentUser={user}
          isAdmin={isAdmin}
          onSave={(payload) => saveMut.mutate(payload)}
          onDelete={(id) => deleteMut.mutate(id)}
          saving={saveMut.isPending}
        />
      )}
    </div>
  );
}

function toLocalInput(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function InterventionDialog({
  open, onOpenChange, initial, contracts, refs, currentUser, isAdmin, onSave, onDelete, saving,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: { mode: 'create'; date: Date; prefill?: PlanningPrefill } | { mode: 'edit'; intervention: Intervention };
  contracts: ContractRow[];
  refs: Ref[];
  currentUser: { id: string; email?: string; user_metadata?: { full_name?: string } } | null;
  isAdmin: boolean;
  onSave: (p: Partial<Intervention> & { id?: string }) => void;
  onDelete: (id: string) => void;
  saving: boolean;
}) {
  const isEdit = initial.mode === 'edit';
  const iv = isEdit ? initial.intervention : null;

  const [contractId, setContractId] = useState<string>(
    iv ? (refs.find((r) => r.id === iv.reference_id)?.contract_id ?? '') : (initial.mode === 'create' ? initial.prefill?.contract_id ?? '' : '')
  );
  const [referenceId, setReferenceId] = useState<string>(
    iv?.reference_id ?? (initial.mode === 'create' ? initial.prefill?.reference_id ?? '' : '')
  );
  const [dateLocal, setDateLocal] = useState<string>(
    iv ? toLocalInput(new Date(iv.date_intervention)) : toLocalInput(initial.mode === 'create' ? initial.date : new Date())
  );
  const [durationHours, setDurationHours] = useState<string>(
    iv?.duree_estimee_minutes != null ? String(Math.floor(iv.duree_estimee_minutes / 60)) : '1'
  );
  const [durationMinutes, setDurationMinutes] = useState<string>(
    iv?.duree_estimee_minutes != null ? String(iv.duree_estimee_minutes % 60) : '0'
  );
  const [technicianName, setTechnicianName] = useState<string>(
    iv?.technician_name ?? (currentUser?.user_metadata?.full_name || currentUser?.email || '')
  );
  const [commentaire, setCommentaire] = useState<string>(iv?.commentaire ?? '');
  const [statut, setStatut] = useState<Intervention['statut']>(iv?.statut ?? 'prevue');
  const [erpRef, setErpRef] = useState<string>('');
  const [erpTouched, setErpTouched] = useState(false);


  const refsForContract = useMemo(
    () => refs.filter((r) => r.contract_id === contractId && r.requires_intervention !== false),
    [refs, contractId]
  );

  const selectedContract = useMemo(
    () => contracts.find((c) => c.id === contractId) ?? null,
    [contracts, contractId]
  );

  // Réf. Jaja : reprise auto depuis le service puis le contrat, tant que non modifiée manuellement
  useEffect(() => {
    if (erpTouched) return;
    const fromRef = refs.find((r) => r.id === referenceId)?.erp_reference;
    setErpRef(fromRef || selectedContract?.erp_reference || '');
  }, [referenceId, selectedContract, refs, erpTouched]);



  const clientInfoQ = useQuery({
    queryKey: ['pl-client-info', selectedContract?.proposal_id],
    enabled: !!selectedContract?.proposal_id,
    staleTime: 60_000,
    queryFn: async () => {
      const { data: exp } = await supabase
        .from('proposal_exports')
        .select('service_proposal_id')
        .eq('id', selectedContract!.proposal_id!)
        .maybeSingle();
      const spId = (exp as any)?.service_proposal_id;
      if (!spId) return null;
      const { data: sp } = await supabase
        .from('service_proposals')
        .select('client_company, client_address, client_phone, client_email, client_siret, operational_contact, site_addresses')
        .eq('id', spId)
        .maybeSingle();
      return (sp as any) ?? null;
    },
  });


  const qc = useQueryClient();
  const isOwner = iv?.created_by === currentUser?.id;
  const canEditAll = !isEdit || isAdmin || isOwner;


  async function persistErp() {
    if (!canEditAll || !referenceId) return;
    const current = refs.find((r) => r.id === referenceId)?.erp_reference ?? '';
    const next = erpRef.trim();
    if (next === (current ?? '')) return;
    await supabase
      .from('client_service_references')
      .update({ erp_reference: next || null })
      .eq('id', referenceId);
    qc.invalidateQueries({ queryKey: ['pl-refs'] });
  }

  function submit() {
    if (!referenceId) return;
    void persistErp();
    const totalMinutes =
      (Number(durationHours) || 0) * 60 + (Number(durationMinutes) || 0);

    const dureeVal = totalMinutes > 0 ? totalMinutes : null;
    const payload: Partial<Intervention> & { id?: string } = isEdit
      ? {
          id: iv!.id,
          statut,
          ...(canEditAll ? {
            reference_id: referenceId,
            date_intervention: new Date(dateLocal).toISOString(),
            duree_estimee_minutes: dureeVal,
            technician_name: technicianName.trim() || 'Technicien',
            technician_user_id: iv!.technician_user_id ?? (iv!.technician_name === technicianName ? iv!.technician_user_id : null),
            commentaire: commentaire.trim() || null,
          } : {}),
        }
      : {
          reference_id: referenceId,
          date_intervention: new Date(dateLocal).toISOString(),
          duree_estimee_minutes: dureeVal,
          technician_name: technicianName.trim() || 'Technicien',
          technician_user_id: currentUser?.id ?? null,
          commentaire: commentaire.trim() || null,
          statut: 'prevue',
        };
    onSave(payload);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>{isEdit ? 'Modifier l\'intervention' : 'Nouvelle intervention'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 overflow-y-auto pr-1">
          <div>
            <label className="text-xs font-medium mb-1 block">Client</label>
            <Select value={contractId} onValueChange={(v) => { setContractId(v); setReferenceId(''); }} disabled={!canEditAll}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
              <SelectContent>
                {contracts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.client_name}{c.erp_reference ? ` — Réf. Jaja ${c.erp_reference}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {contractId && (
            <ClientInfoBlock
              loading={clientInfoQ.isLoading}
              info={clientInfoQ.data}
              hasProposal={!!selectedContract?.proposal_id}
            />
          )}



          <div>
            <label className="text-xs font-medium mb-1 block">Service / référence</label>
            <Select value={referenceId} onValueChange={setReferenceId} disabled={!contractId || !canEditAll}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un service" /></SelectTrigger>
              <SelectContent>
                {refsForContract.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.service_label}{r.erp_reference ? ` — JAJA ${r.erp_reference}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">Réf. Jaja</label>
            <Input
              value={erpRef}
              onChange={(e) => { setErpTouched(true); setErpRef(e.target.value); }}
              placeholder="Ex : JAJA-12345"
              disabled={!canEditAll}
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Reprise automatiquement du service ou du contrat si renseignée.
            </p>
          </div>


          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block">Date & heure</label>
              <Input type="datetime-local" value={dateLocal} onChange={(e) => setDateLocal(e.target.value)} disabled={!canEditAll} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Durée (heures)</label>
              <Input type="number" min={0} step={1} value={durationHours} onChange={(e) => setDurationHours(e.target.value)} disabled={!canEditAll} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Durée (minutes)</label>
              <Input type="number" min={0} max={59} step={5} value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} disabled={!canEditAll} />
            </div>
          </div>


          <div>
            <label className="text-xs font-medium mb-1 block">Technicien</label>
            <Input value={technicianName} onChange={(e) => setTechnicianName(e.target.value)} placeholder="Nom du technicien" disabled={!canEditAll} />
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">Commentaire</label>
            <Textarea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} rows={2} disabled={!canEditAll} />
          </div>

          {isEdit && (
            <div>
              <label className="text-xs font-medium mb-1 block">Statut</label>
              <Select value={statut} onValueChange={(v) => setStatut(v as Intervention['statut'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="prevue">Prévue</SelectItem>
                  <SelectItem value="realisee">Réalisée</SelectItem>
                  <SelectItem value="annulee">Annulée</SelectItem>
                </SelectContent>
              </Select>
              {!canEditAll && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Vous n'êtes pas le créateur : seul le statut peut être modifié.
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 flex items-center justify-between sm:justify-between">
          <div>
            {isEdit && (isAdmin || isOwner) && (
              <Button variant="ghost" size="sm" onClick={() => onDelete(iv!.id)} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-1" /> Supprimer
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button onClick={submit} disabled={saving || !referenceId}>Enregistrer</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MonthGrid({
  days, anchor, interventions, labelForIntervention, onDayClick, onInterventionClick,
}: {
  days: Date[];
  anchor: Date;
  interventions: Intervention[];
  labelForIntervention: (i: Intervention) => { client: string; service: string };
  onDayClick: (d: Date) => void;
  onInterventionClick: (i: Intervention) => void;
}) {
  const weekdayLabels = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];
  const currentMonth = anchor.getMonth();
  const today = startOfDay(new Date()).getTime();

  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(7, minmax(0,1fr))' }}>
      {weekdayLabels.map((l) => (
        <div key={l} className="border-b bg-muted/40 px-2 py-2 text-xs font-semibold text-center">{l}</div>
      ))}
      {days.map((day) => {
        const dayInterventions = interventions
          .filter((i) => {
            const d = new Date(i.date_intervention);
            return d.getFullYear() === day.getFullYear() && d.getMonth() === day.getMonth() && d.getDate() === day.getDate();
          })
          .sort((a, b) => new Date(a.date_intervention).getTime() - new Date(b.date_intervention).getTime());
        const isOtherMonth = day.getMonth() !== currentMonth;
        const isToday = startOfDay(day).getTime() === today;
        return (
          <div
            key={day.toISOString()}
            className={`min-h-[110px] border-b border-r p-1 cursor-pointer hover:bg-primary/5 ${isOtherMonth ? 'bg-muted/20' : ''}`}
            onClick={() => onDayClick(day)}
          >
            <div className={`text-[11px] font-semibold mb-1 flex justify-end ${isOtherMonth ? 'text-muted-foreground' : ''}`}>
              <span className={isToday ? 'bg-primary text-primary-foreground rounded-full px-1.5' : ''}>
                {day.getDate()}
              </span>
            </div>
            <div className="space-y-0.5">
              {dayInterventions.slice(0, 3).map((i) => {
                const d = new Date(i.date_intervention);
                const { client } = labelForIntervention(i);
                return (
                  <button
                    key={i.id}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onInterventionClick(i); }}
                    className={`w-full truncate text-left rounded px-1 py-0.5 text-[10px] border ${STATUT_COLOR[i.statut]}`}
                    title={`${client} — ${i.technician_name}`}
                  >
                    {d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} {client}
                  </button>
                );
              })}
              {dayInterventions.length > 3 && (
                <div className="text-[10px] text-muted-foreground px-1">+{dayInterventions.length - 3} autres</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface ClientInfo {
  client_company?: string | null;
  client_address?: string | null;
  client_phone?: string | null;
  client_email?: string | null;
  client_siret?: string | null;
  operational_contact?: any;
  site_addresses?: any;
}

function ClientInfoBlock({
  loading, info, hasProposal,
}: { loading: boolean; info: ClientInfo | null | undefined; hasProposal: boolean }) {
  if (!hasProposal) {
    return (
      <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        Aucune coordonnée liée à ce contrat.
      </div>
    );
  }
  if (loading) {
    return (
      <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        Chargement des coordonnées…
      </div>
    );
  }
  if (!info) {
    return (
      <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        Aucune coordonnée renseignée.
      </div>
    );
  }

  const op = info.operational_contact && typeof info.operational_contact === 'object' ? info.operational_contact : null;
  const opHas = op && (op.full_name || op.role || op.phone || op.email);
  const sites: any[] = Array.isArray(info.site_addresses) ? info.site_addresses : [];

  const hasAnything =
    info.client_company || info.client_address || info.client_phone ||
    info.client_email || info.client_siret || opHas || sites.length > 0;

  if (!hasAnything) {
    return (
      <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        Aucune coordonnée renseignée.
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-muted/40 px-3 py-2 space-y-2 text-xs">
      <div className="font-semibold text-[11px] uppercase tracking-wide text-muted-foreground">
        Coordonnées client
      </div>
      {(info.client_company || info.client_siret) && (
        <div>
          {info.client_company && <span className="font-medium">{info.client_company}</span>}
          {info.client_siret && (
            <span className="text-muted-foreground"> · SIRET {info.client_siret}</span>
          )}
        </div>
      )}
      {info.client_address && (
        <div className="whitespace-pre-line">{info.client_address}</div>
      )}
      {(info.client_phone || info.client_email) && (
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {info.client_phone && (
            <a href={`tel:${info.client_phone}`} className="text-blue-700 hover:underline">
              📞 {info.client_phone}
            </a>
          )}
          {info.client_email && (
            <a href={`mailto:${info.client_email}`} className="text-blue-700 hover:underline">
              ✉ {info.client_email}
            </a>
          )}
        </div>
      )}
      {opHas && (
        <div className="pt-1 border-t border-border/60">
          <div className="font-medium text-[11px] text-muted-foreground mb-0.5">
            Contact opérationnel
          </div>
          <div>
            {op.full_name && <span className="font-medium">{op.full_name}</span>}
            {op.role && <span className="text-muted-foreground"> — {op.role}</span>}
          </div>
          {(op.phone || op.email) && (
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {op.phone && (
                <a href={`tel:${op.phone}`} className="text-blue-700 hover:underline">📞 {op.phone}</a>
              )}
              {op.email && (
                <a href={`mailto:${op.email}`} className="text-blue-700 hover:underline">✉ {op.email}</a>
              )}
            </div>
          )}
        </div>
      )}
      {sites.length > 0 && (
        <div className="pt-1 border-t border-border/60">
          <div className="font-medium text-[11px] text-muted-foreground mb-0.5">
            Sites d'intervention
          </div>
          <ul className="space-y-0.5">
            {sites.map((s: any, idx: number) => (
              <li key={idx}>
                {s?.label && <span className="font-medium">{s.label}</span>}
                {s?.label && s?.address && <span> — </span>}
                {s?.address && <span className="whitespace-pre-line">{s.address}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

