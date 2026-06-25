import { useState, useEffect } from 'react';
import { Plus, FileText, ChevronDown, ChevronUp, User, Trash2, Save, X, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ServiceProposalClientStep, ClientData } from './ServiceProposalClientStep';
import { ServiceProposalDataStep, ServiceDataFormValues } from './ServiceProposalDataStep';
import { ServiceProposalInvestStep, InvestFormValues } from './ServiceProposalInvestStep';
import {
  useServiceProposals,
  useCreateServiceProposal,
  useUpdateServiceProposal,
  useDeleteServiceProposal,
  ServiceProposal,
} from '@/hooks/useServiceProposals';
import { TemplateSelector } from '@/components/rental-proposal/TemplateSelector';
import { ServiceProposalPreview } from './ServiceProposalPreview';
import { ServiceProposalExport } from './ServiceProposalExport';
import { useServiceProposalStore } from '@/stores/serviceProposalStore';
import { useRentalProposalStore } from '@/stores/rentalProposalStore';
import { AutoResizeTextarea } from '@/components/ui/auto-resize-textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DEFAULT_CLIENT: ClientData = {
  client_name: '',
  client_company: '',
  client_email: '',
  client_phone: '',
  client_address: '',
  client_siret: '',
  entity: '',
  commercial_id: '',
  commercial_name: '',
};

const DEFAULT_DATA: ServiceDataFormValues = {
  selected_services: [],
  payment_frequency: '',
  payment_mode: '',
  start_date: '',
  contract_duration: '',
};

const DEFAULT_INVEST: InvestFormValues = {
  invest_lines: [],
  show_invest_price: true,
  show_offer_amount: true,
};

const STATUS_COLORS: Record<ServiceProposal['status'], string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  validated: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

const STATUS_LABELS: Record<ServiceProposal['status'], string> = {
  draft: 'Brouillon',
  sent: 'Envoyée',
  validated: 'Validée',
  cancelled: 'Annulée',
};

function syncToServiceStore(clientData: ClientData, investForm: InvestFormValues) {
  const store = useServiceProposalStore.getState();
  store.updateClientData({
    nom: clientData.client_name,
    raisonSociale: clientData.client_company,
    email: clientData.client_email,
    telephone: clientData.client_phone,
    adresse: clientData.client_address,
    siret: clientData.client_siret,
  });
  store.updateCommercialData({
    entity: clientData.entity || null,
    commercialId: clientData.commercial_id || null,
  });
  store.setLignesData(
    investForm.invest_lines.map((l) => ({
      id: l.id,
      designation: l.designation,
      quantite: l.qty,
      prixUnitaire: l.vun,
      totalHT: l.vtn,
    })),
  );
  store.updateProposalName(
    clientData.client_company || clientData.client_name || 'Proposition Services',
  );
}

function ProposalRow({
  proposal,
  onDelete,
  onEdit,
}: {
  proposal: ServiceProposal;
  onDelete: (id: string) => void;
  onEdit: (proposal: ServiceProposal) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border rounded-lg bg-card">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setExpanded(!expanded)}
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors"
      >
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <FileText className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-medium text-sm truncate">
              {proposal.client_company || proposal.client_name}
            </span>
            <Badge className={`text-[10px] ${STATUS_COLORS[proposal.status]}`}>
              {STATUS_LABELS[proposal.status]}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span>{format(parseISO(proposal.created_at), 'dd/MM/yyyy', { locale: fr })}</span>
            {proposal.selected_services.length > 0 && (
              <span>{proposal.selected_services.length} service(s)</span>
            )}
            {proposal.contract_duration && <span>{proposal.contract_duration} mois</span>}
            {proposal.payment_frequency && (
              <span className="capitalize">{proposal.payment_frequency}</span>
            )}
            {proposal.total_services_ht > 0 && (
              <span className="font-medium text-foreground">
                {proposal.total_services_ht.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € HT
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(proposal);
            }}
            title="Modifier"
          >
            <Pencil className="h-4 w-4" />
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={(e) => e.stopPropagation()}
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer la proposition ?</AlertDialogTitle>
                <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(proposal.id);
                  }}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 border-t pt-3 space-y-3">
          <div>
            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Services</h5>
            {proposal.selected_services.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun</p>
            ) : (
              <div className="space-y-1">
                {proposal.selected_services.map((s) => (
                  <div key={s.service_id} className="flex items-center justify-between text-sm">
                    <span>{s.label}</span>
                    <span className="text-muted-foreground">
                      {s.amount_ht.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € {s.scope === 'parc' ? '/parc' : 'total'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Invest</h5>
            {proposal.invest_lines.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune ligne</p>
            ) : (
              <div className="space-y-1">
                {proposal.invest_lines.map((l) => (
                  <div key={l.id} className="flex items-center justify-between text-sm">
                    <span>{l.designation}</span>
                    <span className="text-muted-foreground">
                      {l.vtn.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ProposalFormShell({
  title,
  clientData,
  setClientData,
  dataForm,
  setDataForm,
  investForm,
  setInvestForm,
  onClose,
  onSave,
  saving,
  initialTab = 'client',
}: {
  title: string;
  clientData: ClientData;
  setClientData: (d: ClientData) => void;
  dataForm: ServiceDataFormValues;
  setDataForm: (d: ServiceDataFormValues) => void;
  investForm: InvestFormValues;
  setInvestForm: (d: InvestFormValues) => void;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  initialTab?: string;
}) {
  const [activeTab, setActiveTab] = useState(initialTab ?? 'client');
  const servicesInclus = useServiceProposalStore((s) => s.servicesInclus);
  const updateServicesInclus = useServiceProposalStore((s) => s.updateServicesInclus);


  function handleTabChange(tab: string) {
    if (tab === 'preview-export' || tab === 'template') {
      syncToServiceStore(clientData, investForm);
    }
    setActiveTab(tab);
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full">
          <TabsTrigger value="client" className="flex-1">Client</TabsTrigger>
          <TabsTrigger value="data" className="flex-1">Données</TabsTrigger>
          <TabsTrigger value="services" className="flex-1">Services inclus</TabsTrigger>
          <TabsTrigger value="invest" className="flex-1">Invest</TabsTrigger>
          <TabsTrigger value="template" className="flex-1">Template</TabsTrigger>
          <TabsTrigger value="preview-export" className="flex-1">Aperçu & Export</TabsTrigger>
        </TabsList>
        <TabsContent value="client">
          <ServiceProposalClientStep data={clientData} onChange={setClientData} />
        </TabsContent>
        <TabsContent value="data">
          <ServiceProposalDataStep data={dataForm} onChange={setDataForm} />
        </TabsContent>
        <TabsContent value="services">
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Services inclus</CardTitle>
                <Badge variant="secondary" className="text-[10px]">Toujours affiché</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Ce bloc apparaît systématiquement en haut de la page services.
              </p>
            </CardHeader>
            <CardContent>
              <AutoResizeTextarea
                value={servicesInclus.description}
                onChange={(e) => updateServicesInclus(e.target.value)}
                className="min-h-[120px] bg-background"
                placeholder="Décrivez les services inclus…"
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="invest">
          <ServiceProposalInvestStep data={investForm} onChange={setInvestForm} />
        </TabsContent>
        <TabsContent value="template">
          <TemplateSelector />
        </TabsContent>
        <TabsContent value="preview-export" className="space-y-8">
          <ServiceProposalPreview />
          <Separator />
          <ServiceProposalExport />
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-end gap-2 pt-3 border-t">
        <Button variant="outline" onClick={onClose}>Annuler</Button>
        <Button onClick={onSave} disabled={saving} className="gap-1">
          <Save className="h-4 w-4" />
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </div>
    </div>
  );
}


function buildPayload(
  clientData: ClientData,
  dataForm: ServiceDataFormValues,
  investForm: InvestFormValues,
) {
  const totalServices = dataForm.selected_services.reduce((s, l) => s + l.amount_ht, 0);
  const totalInvest = investForm.invest_lines.reduce((s, l) => s + l.vtn, 0);
  return {
    client_name: clientData.client_name || 'Sans nom',
    client_company: clientData.client_company || null,
    client_email: clientData.client_email || null,
    client_phone: clientData.client_phone || null,
    client_address: clientData.client_address || null,
    client_siret: clientData.client_siret || null,
    commercial_id: clientData.commercial_id || '',
    commercial_name: clientData.commercial_name || null,
    selected_services: dataForm.selected_services,
    payment_frequency: (dataForm.payment_frequency || null) as 'mensuel' | 'trimestriel' | null,
    payment_mode: (dataForm.payment_mode || null) as 'prelevement' | 'virement' | null,
    start_date: dataForm.start_date || null,
    contract_duration: dataForm.contract_duration ? Number(dataForm.contract_duration) : null,
    invest_lines: investForm.invest_lines,
    show_invest_price: investForm.show_invest_price,
    show_offer_amount: investForm.show_offer_amount,
    total_services_ht: totalServices,
    total_invest_ht: totalInvest,
    status: 'draft' as const,
  };
}

function CreateForm({ onClose }: { onClose: () => void }) {
  const [clientData, setClientData] = useState<ClientData>(DEFAULT_CLIENT);
  const [dataForm, setDataForm] = useState<ServiceDataFormValues>(DEFAULT_DATA);
  const [investForm, setInvestForm] = useState<InvestFormValues>(DEFAULT_INVEST);
  const createProposal = useCreateServiceProposal();

  async function handleSave() {
    syncToServiceStore(clientData, investForm);
    await createProposal.mutateAsync(buildPayload(clientData, dataForm, investForm));
    onClose();
  }

  return (
    <ProposalFormShell
      title="Nouvelle proposition services"
      clientData={clientData}
      setClientData={setClientData}
      dataForm={dataForm}
      setDataForm={setDataForm}
      investForm={investForm}
      setInvestForm={setInvestForm}
      onClose={onClose}
      onSave={handleSave}
      saving={createProposal.isPending}
    />
  );
}

function EditForm({ proposal, onClose }: { proposal: ServiceProposal; onClose: () => void }) {
  // Préchargement du store autonome avec les données de la proposition existante
  useEffect(() => {
    useServiceProposalStore.getState().loadFromServiceProposal(proposal);
    const rentalTemplateId = useRentalProposalStore.getState().selectedTemplateId;
    if (rentalTemplateId) {
      useServiceProposalStore.getState().selectTemplate(rentalTemplateId);
    }
  }, [proposal]);

  const [clientData, setClientData] = useState<ClientData>({
    client_name: proposal.client_name ?? '',
    client_company: proposal.client_company ?? '',
    client_email: proposal.client_email ?? '',
    client_phone: proposal.client_phone ?? '',
    client_address: proposal.client_address ?? '',
    client_siret: proposal.client_siret ?? '',
    entity: '',
    commercial_id: proposal.commercial_id ?? '',
    commercial_name: proposal.commercial_name ?? '',
  });
  const [dataForm, setDataForm] = useState<ServiceDataFormValues>({
    selected_services: proposal.selected_services ?? [],
    payment_frequency: proposal.payment_frequency ?? '',
    payment_mode: proposal.payment_mode ?? '',
    start_date: proposal.start_date ?? '',
    contract_duration: (proposal.contract_duration ?? '') as ServiceDataFormValues['contract_duration'],
  });
  const [investForm, setInvestForm] = useState<InvestFormValues>({
    invest_lines: proposal.invest_lines ?? [],
    show_invest_price: proposal.show_invest_price ?? true,
    show_offer_amount: proposal.show_offer_amount ?? true,
  });
  const updateProposal = useUpdateServiceProposal();

  async function handleSave() {
    syncToServiceStore(clientData, investForm);
    await updateProposal.mutateAsync({
      id: proposal.id,
      updates: buildPayload(clientData, dataForm, investForm),
    });
    onClose();
  }

  return (
    <ProposalFormShell
      title="Modifier la proposition"
      clientData={clientData}
      setClientData={setClientData}
      dataForm={dataForm}
      setDataForm={setDataForm}
      investForm={investForm}
      setInvestForm={setInvestForm}
      onClose={onClose}
      onSave={handleSave}
      saving={updateProposal.isPending}
    />
  );
}

export function ServiceProposalView() {
  const [showForm, setShowForm] = useState(false);
  const [editingProposal, setEditingProposal] = useState<ServiceProposal | null>(null);
  const { data: proposals = [], isLoading } = useServiceProposals();
  const deleteProposal = useDeleteServiceProposal();

  const grouped = new Map<string, { name: string; proposals: ServiceProposal[] }>();
  for (const p of proposals) {
    if (!grouped.has(p.commercial_id)) {
      grouped.set(p.commercial_id, { name: p.commercial_name ?? p.commercial_id, proposals: [] });
    }
    grouped.get(p.commercial_id)!.proposals.push(p);
  }

  const formOpen = showForm || editingProposal !== null;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Propositions Services</h2>
            {proposals.length > 0 && (
              <Badge variant="secondary" className="text-xs">{proposals.length}</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Créez des propositions de services indépendantes des propositions de location.
          </p>
        </div>
        {!formOpen && (
          <Button onClick={() => setShowForm(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />Nouvelle proposition
          </Button>
        )}
      </div>

      {showForm && <CreateForm onClose={() => setShowForm(false)} />}
      {editingProposal && (
        <EditForm proposal={editingProposal} onClose={() => setEditingProposal(null)} />
      )}

      {isLoading ? (
        <div className="text-sm text-muted-foreground text-center py-12">Chargement…</div>
      ) : proposals.length === 0 && !formOpen ? (
        <div className="text-center py-12 space-y-2">
          <FileText className="h-8 w-8 text-muted-foreground mx-auto" />
          <h3 className="font-medium">Aucune proposition services.</h3>
          <p className="text-sm text-muted-foreground">
            Cliquez sur « Nouvelle proposition » pour commencer.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from(grouped.entries()).map(([id, { name, proposals: pList }]) => (
            <div key={id} className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground px-1">
                <User className="h-3.5 w-3.5" />
                {name}
                <Badge variant="outline" className="text-[10px]">{pList.length}</Badge>
              </div>
              <div className="space-y-2">
                {pList.map((p) => (
                  <ProposalRow
                    key={p.id}
                    proposal={p}
                    onDelete={(id) => deleteProposal.mutate(id)}
                    onEdit={(prop) => setEditingProposal(prop)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
