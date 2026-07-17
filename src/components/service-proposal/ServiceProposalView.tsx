import { useState, useEffect, useRef } from 'react';
import { Plus, FileText, ChevronDown, ChevronUp, User, Trash2, Save, X, Pencil, Briefcase, ChevronRight, Users, Layers } from 'lucide-react';
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
import { ServiceProposalClientStep, ClientData, DEFAULT_OPERATIONAL_CONTACT } from './ServiceProposalClientStep';
import { ServiceProposalDataStep, ServiceDataFormValues } from './ServiceProposalDataStep';
import { ServiceProposalInvestStep, InvestFormValues } from './ServiceProposalInvestStep';
import { ServiceProposalNosOptionsStep } from './ServiceProposalNosOptionsStep';
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
import { computeTotalServicesHt, nosOptionsToServiceLines } from '@/lib/service-proposal-totals';
import { useRentalProposalStore } from '@/stores/rentalProposalStore';
import { useTemplateEditorStore } from '@/stores/templateEditorStore';
import { useTemplateSync } from '@/hooks/useTemplateSync';
import { AutoResizeTextarea } from '@/components/ui/auto-resize-textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { resolveServiceTemplate } from '@/lib/service-template-selection';

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
  site_addresses: [],
  operational_contact: { ...DEFAULT_OPERATIONAL_CONTACT },
  external_providers: [],
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

function syncToServiceStore(clientData: ClientData, investForm: InvestFormValues, dataForm: ServiceDataFormValues) {
  const store = useServiceProposalStore.getState();
  const selectedTemplateId = useRentalProposalStore.getState().selectedTemplateId;
  const templateStore = useTemplateEditorStore.getState();

  const serviceTemplate = resolveServiceTemplate({
    selectedTemplateIds: [store.selectedTemplateId, selectedTemplateId],
    allTemplates: templateStore.allTemplates,
    getTemplatePublishedVersion: templateStore.getTemplatePublishedVersion,
  });

  store.selectTemplate(serviceTemplate?.id ?? null);

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
  store.setStructuredClientData({
    siteAddresses: clientData.site_addresses ?? [],
    operationalContact: clientData.operational_contact ?? { name: '', role: '', email: '', phone: '' },
    externalProviders: clientData.external_providers ?? [],
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
  const derivedSelected = nosOptionsToServiceLines(store.nosOptions);
  store.setContractData({
    selectedServices: derivedSelected,
    paymentFrequency: dataForm.payment_frequency || '',
    paymentMode: dataForm.payment_mode || '',
    contractDuration: dataForm.contract_duration ? Number(dataForm.contract_duration) : null,
    startDate: dataForm.start_date || '',
    totalServicesHt: computeTotalServicesHt(derivedSelected, dataForm.contract_duration ? Number(dataForm.contract_duration) : null),
  });
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
            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Matériel</h5>
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
  const selectedRentalTemplateId = useRentalProposalStore((s) => s.selectedTemplateId);
  const allTemplates = useTemplateEditorStore((s) => s.allTemplates);
  const getTemplatePublishedVersion = useTemplateEditorStore((s) => s.getTemplatePublishedVersion);
  const { saveVersionToDatabase } = useTemplateSync();

  const hasAutoSelectedRef = useRef(false);

  useEffect(() => {
    if (hasAutoSelectedRef.current) return;

    const currentTemplate = resolveServiceTemplate({
      selectedTemplateIds: [selectedRentalTemplateId],
      allTemplates,
      getTemplatePublishedVersion,
    });

    if (currentTemplate?.id === selectedRentalTemplateId) {
      hasAutoSelectedRef.current = true;
      return;
    }

    const contratTemplate = resolveServiceTemplate({
      allTemplates,
      getTemplatePublishedVersion,
    });

    if (contratTemplate) {
      useRentalProposalStore.getState().selectTemplateForProposal(contratTemplate.id);
      hasAutoSelectedRef.current = true;
    }
  }, [allTemplates, getTemplatePublishedVersion, selectedRentalTemplateId]);

  async function handleTabChange(tab: string) {
    if (tab === 'preview-export' || tab === 'template') {
      syncToServiceStore(clientData, investForm, dataForm);
      if (tab === 'preview-export') {
        const editorStore = useTemplateEditorStore.getState();
        if (editorStore.hasUnsavedChanges && editorStore.currentVersion) {
          try { await saveVersionToDatabase(editorStore.currentVersion); } catch (e) {}
        }
      }
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
          <TabsTrigger value="invest" className="flex-1">Matériel</TabsTrigger>
          <TabsTrigger value="options" className="flex-1">
            Nos Options
            <NosOptionsBadge />
          </TabsTrigger>
          <TabsTrigger value="template" className="flex-1">Template</TabsTrigger>
          <TabsTrigger value="preview-export" className="flex-1">Aperçu & Export</TabsTrigger>
        </TabsList>
        <TabsContent value="client">
          <ServiceProposalClientStep data={clientData} onChange={setClientData} />
        </TabsContent>
        <TabsContent value="data">
          <ServiceProposalDataStep data={dataForm} onChange={setDataForm} />
        </TabsContent>
        <TabsContent value="invest">
          <ServiceProposalInvestStep data={investForm} onChange={setInvestForm} />
        </TabsContent>
        <TabsContent value="options">
          <ServiceProposalNosOptionsStep />
        </TabsContent>
        <TabsContent value="template">
          <TemplateSelector viewScope="services" />
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
  const nosOptions = useServiceProposalStore.getState().nosOptions;
  const derivedSelected = nosOptionsToServiceLines(nosOptions);
  const totalServices = computeTotalServicesHt(derivedSelected, dataForm.contract_duration ? Number(dataForm.contract_duration) : null);
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
    selected_services: derivedSelected,
    payment_frequency: (dataForm.payment_frequency || null) as 'mensuel' | 'trimestriel' | null,
    payment_mode: (dataForm.payment_mode || null) as 'prelevement' | 'virement' | 'allin' | null,
    start_date: dataForm.start_date || null,
    contract_duration: dataForm.contract_duration ? Number(dataForm.contract_duration) : null,
    invest_lines: investForm.invest_lines,
    show_invest_price: investForm.show_invest_price,
    show_offer_amount: investForm.show_offer_amount,
    total_services_ht: totalServices,
    total_invest_ht: totalInvest,
    site_addresses: clientData.site_addresses ?? [],
    operational_contact: clientData.operational_contact ?? { ...DEFAULT_OPERATIONAL_CONTACT },
    external_providers: clientData.external_providers ?? [],
    status: 'draft' as const,
  };
}


function CreateForm({ onClose }: { onClose: () => void }) {
  const [clientData, setClientData] = useState<ClientData>(DEFAULT_CLIENT);
  const [dataForm, setDataForm] = useState<ServiceDataFormValues>(DEFAULT_DATA);
  const [investForm, setInvestForm] = useState<InvestFormValues>(DEFAULT_INVEST);
  const createProposal = useCreateServiceProposal();

  async function handleSave() {
    syncToServiceStore(clientData, investForm, dataForm);
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
    site_addresses: proposal.site_addresses ?? [],
    operational_contact: proposal.operational_contact ?? { ...DEFAULT_OPERATIONAL_CONTACT },
    external_providers: proposal.external_providers ?? [],
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
    syncToServiceStore(clientData, investForm, dataForm);
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

export function ServiceProposalView({ autoOpenCreate = false, onAutoOpenHandled }: { autoOpenCreate?: boolean; onAutoOpenHandled?: () => void } = {}) {
  const [showForm, setShowForm] = useState(false);
  const [editingProposal, setEditingProposal] = useState<ServiceProposal | null>(null);
  const { data: proposals = [], isLoading } = useServiceProposals();
  const deleteProposal = useDeleteServiceProposal();

  useEffect(() => {
    if (autoOpenCreate) {
      setShowForm(true);
      onAutoOpenHandled?.();
    }
  }, [autoOpenCreate, onAutoOpenHandled]);



  const grouped = new Map<string, { name: string; proposals: ServiceProposal[] }>();
  for (const p of proposals) {
    if (!grouped.has(p.commercial_id)) {
      grouped.set(p.commercial_id, { name: p.commercial_name ?? p.commercial_id, proposals: [] });
    }
    grouped.get(p.commercial_id)!.proposals.push(p);
  }

  const formOpen = showForm || editingProposal !== null;

  const draftCount = proposals.filter((p) => p.status === 'draft').length;
  const lastProposal = proposals[0];
  const hasDraft = draftCount > 0;

  if (formOpen) {
    return (
      <div className="space-y-4 animate-fade-in">
        {showForm && <CreateForm onClose={() => setShowForm(false)} />}
        {editingProposal && (
          <EditForm proposal={editingProposal} onClose={() => setEditingProposal(null)} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Hero Section — same look as Proposition Location */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-accent via-accent/90 to-accent/80 p-5 text-accent-foreground">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L2c+PC9zdmc+')] opacity-20" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-accent-foreground/10 rounded-lg backdrop-blur-sm">
              <Briefcase className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold">Proposition Services</h1>
          </div>
          <p className="text-accent-foreground/80 max-w-xl mb-4 text-sm">
            Créez des propositions de services indépendantes des propositions de location.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="default"
              onClick={() => setShowForm(true)}
              className="gap-2 font-semibold shadow-lg"
            >
              <Plus className="h-4 w-4" />
              Nouvelle proposition
            </Button>
            {hasDraft && lastProposal && (
              <Button
                variant="ghost"
                size="default"
                onClick={() => setEditingProposal(lastProposal)}
                className="gap-2 text-accent-foreground hover:bg-accent-foreground/10"
              >
                <ChevronRight className="h-4 w-4" />
                Reprendre la proposition en cours
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-1 py-2 px-3">
            <CardTitle className="text-sm">État actuel</CardTitle>
            <p className="text-[10px] text-muted-foreground">Aperçu des propositions</p>
          </CardHeader>
          <CardContent className="space-y-1.5 px-3 pb-3">
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-muted/50">
              <div className="flex items-center gap-1.5">
                <FileText className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] font-medium">Propositions</span>
              </div>
              <Badge variant={proposals.length > 0 ? 'success' : 'pending'} className="text-[10px] h-5">
                {proposals.length}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-muted/50">
              <div className="flex items-center gap-1.5">
                <Layers className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] font-medium">Brouillons</span>
              </div>
              <Badge variant={draftCount > 0 ? 'success' : 'pending'} className="text-[10px] h-5">
                {draftCount}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-muted/50">
              <div className="flex items-center gap-1.5">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] font-medium">Commerciaux</span>
              </div>
              <Badge variant={grouped.size > 0 ? 'success' : 'pending'} className="text-[10px] h-5">
                {grouped.size}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-1 py-2 px-3">
            <CardTitle className="text-sm">Workflow</CardTitle>
            <p className="text-[10px] text-muted-foreground">4 étapes</p>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <div className="flex items-center gap-1.5 text-[10px]">
                <div className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[8px] font-medium">1</div>
                <span>Client</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <div className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[8px] font-medium">2</div>
                <span>Données & Services</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <div className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[8px] font-medium">3</div>
                <span>Aperçu</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <div className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[8px] font-medium">4</div>
                <span>Export final</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


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

function NosOptionsBadge() {
  const count = useServiceProposalStore((s) => s.nosOptions.filter((o) => o.selected).length);
  if (count === 0) return null;
  return (
    <Badge variant="secondary" className="ml-2">
      {count}
    </Badge>
  );
}
