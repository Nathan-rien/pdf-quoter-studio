import { useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Calendar as CalendarIcon, Clock, Bell, Trash2, Eye, Download, Upload, FileText, X, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
import { format, parseISO, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useUpdateContract, useDeleteContract, isContractRenewingSoon, getMonthsUntilRenewal, useContractProposalRent, Contract, PaymentFrequency } from '@/hooks/useContracts';
import { calculateLoyerTrimestriel } from '@/lib/rental-calculations';
import { useCommerciaux } from '@/hooks/useCommerciaux';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const FINANCIAL_PARTNERS = ['Lixxbail 1', 'Lixxbail 2', 'Grenke 1', 'Franfinance 1', 'Olinn 1', 'Olinn 2', 'BNP VR 2', 'BNP Credit Bail 1', 'Realease 2'];
const DURATIONS = [12, 24, 36, 48, 60];
const MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024;

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
}

export function ContractRow({ contract, onVisualize, defaultExpanded = false, hideFinancialPartner = false }: { contract: Contract; onVisualize?: (contract: Contract) => void; defaultExpanded?: boolean; hideFinancialPartner?: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const updateContract = useUpdateContract();
  const deleteContract = useDeleteContract();
  const { commerciaux } = useCommerciaux();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isQuick = !!contract.is_quick_contract;

  const renewing = isContractRenewingSoon(contract);
  const monthsLeft = getMonthsUntilRenewal(contract);

  const [clientName, setClientName] = useState(contract.client_name ?? '');
  const [implementationDate, setImplementationDate] = useState<Date | undefined>(
    contract.implementation_month ? parseISO(contract.implementation_month) : undefined
  );
  const [financialPartner, setFinancialPartner] = useState(contract.financial_partner ?? '');
  const [durationMonths, setDurationMonths] = useState(
    contract.duration_months ? String(contract.duration_months) : ''
  );
  const [paymentFrequency, setPaymentFrequency] = useState<PaymentFrequency>(
    contract.payment_frequency ?? 'mensuel'
  );
  const [commercialId, setCommercialId] = useState(contract.commercial_id ?? '');
  const [contractNumber, setContractNumber] = useState(contract.contract_number ?? '');
  const [cessionPercent, setCessionPercent] = useState<number | null>(contract.cession_percent ?? null);
  const { data: proposalRent } = useContractProposalRent(isQuick ? null : contract.proposal_id);

  // Fallback saisi manuellement (uniquement quand la proposition ne fournit pas de loyer)
  const [manualMonthlyRent, setManualMonthlyRent] = useState<string>(
    contract.monthly_rent_ht != null ? String(contract.monthly_rent_ht) : ''
  );
  const [manualQuarterlyRent, setManualQuarterlyRent] = useState<string>(
    contract.quarterly_rent_ht != null ? String(contract.quarterly_rent_ht) : ''
  );

  const [uploading, setUploading] = useState(false);
  const [downloadingProposal, setDownloadingProposal] = useState(false);

  const endDate = implementationDate && durationMonths
    ? addMonths(implementationDate, parseInt(durationMonths))
    : null;

  // Source unique du loyer : proposition validée → sinon valeur manuelle → sinon null
  const manualRentNumber = manualMonthlyRent.trim() === '' ? null : Number(manualMonthlyRent);
  const manualQuarterlyNumber = manualQuarterlyRent.trim() === '' ? null : Number(manualQuarterlyRent);
  const proposalMonthlyRent = !isQuick && proposalRent?.monthly != null ? proposalRent.monthly : null;
  const proposalQuarterlyRent = !isQuick && proposalRent?.quarterly != null ? proposalRent.quarterly : null;
  const validManualMonthlyRent = manualRentNumber != null && !Number.isNaN(manualRentNumber) ? manualRentNumber : null;
  const validManualQuarterlyRent = manualQuarterlyNumber != null && !Number.isNaN(manualQuarterlyNumber) ? manualQuarterlyNumber : null;
  const quickMonthlyBase = validManualMonthlyRent ?? contract.monthly_rent_ht ?? null;
  const quickQuarterlyBase = validManualQuarterlyRent ?? contract.quarterly_rent_ht ?? null;
  const monthlyRent: number | null = isQuick
    ? (quickMonthlyBase ?? (quickQuarterlyBase != null ? Math.round((quickQuarterlyBase / 3) * 100) / 100 : null))
    : (proposalMonthlyRent ?? validManualMonthlyRent ?? contract.monthly_rent_ht ?? null);
  const quarterlyRent: number | null = isQuick
    ? (quickQuarterlyBase ?? (quickMonthlyBase != null ? calculateLoyerTrimestriel(quickMonthlyBase) ?? Math.round(quickMonthlyBase * 3 * 100) / 100 : null))
    : (proposalQuarterlyRent ?? (monthlyRent != null ? calculateLoyerTrimestriel(monthlyRent) ?? monthlyRent * 3 : null));
  const displayedAmount = paymentFrequency === 'trimestriel' ? quarterlyRent : monthlyRent;
  const hasProposalRent = !isQuick && (proposalRent?.monthly != null || proposalRent?.quarterly != null);

  const sortedCommerciaux = [...commerciaux].sort((a, b) => a.nom.localeCompare(b.nom));

  function handleSave() {
    const selected = commerciaux.find((c) => c.id === commercialId);
    const manualNumber = manualMonthlyRent.trim() === '' ? null : Number(manualMonthlyRent);
    const manualMonthlyValue = manualNumber != null && !Number.isNaN(manualNumber)
      ? Math.round(manualNumber * 100) / 100
      : null;
    const manualQNumber = manualQuarterlyRent.trim() === '' ? null : Number(manualQuarterlyRent);
    const manualQuarterlyValue = manualQNumber != null && !Number.isNaN(manualQNumber)
      ? Math.round(manualQNumber * 100) / 100
      : null;
    updateContract.mutate({
      id: contract.id,
      updates: {
        client_name: clientName.trim() || 'Nouveau contrat',
        implementation_month: implementationDate ? format(implementationDate, 'yyyy-MM-dd') : null,
        financial_partner: hideFinancialPartner ? contract.financial_partner ?? null : (financialPartner || null),
        duration_months: durationMonths ? parseInt(durationMonths) : null,
        payment_frequency: paymentFrequency,
        commercial_id: isQuick ? (commercialId || 'quick') : (commercialId || contract.commercial_id),
        commercial_name: selected?.nom ?? (isQuick ? null : contract.commercial_name),
        contract_number: contractNumber.trim() || null,
        monthly_rent_ht: hasProposalRent ? contract.monthly_rent_ht ?? null : manualMonthlyValue,
        quarterly_rent_ht: hasProposalRent ? contract.quarterly_rent_ht ?? null : manualQuarterlyValue,
        cession_percent: hideFinancialPartner ? contract.cession_percent ?? null : cessionPercent,
      },
    });
  }

  async function handleDownloadProposal() {
    if (!contract.proposal_id) return;
    setDownloadingProposal(true);
    try {
      const { data, error } = await supabase
        .from('proposal_exports')
        .select('pdf_html_content')
        .eq('id', contract.proposal_id)
        .single();
      if (error || !data?.pdf_html_content) {
        toast({ title: 'Proposition indisponible', description: "Le contenu de la proposition n'est plus disponible.", variant: 'destructive' });
        return;
      }
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({ title: 'Fenêtre bloquée', description: 'Autorisez les pop-ups pour télécharger la proposition.', variant: 'destructive' });
        return;
      }
      printWindow.document.open();
      printWindow.document.write(data.pdf_html_content);
      printWindow.document.close();
      printWindow.addEventListener('load', () => {
        setTimeout(() => printWindow.print(), 300);
      });
    } catch {
      toast({ title: 'Erreur', description: "Impossible de récupérer la proposition.", variant: 'destructive' });
    } finally {
      setDownloadingProposal(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast({ title: 'Format invalide', description: 'Seuls les fichiers PDF sont acceptés.', variant: 'destructive' });
      return;
    }
    if (file.size > MAX_ATTACHMENT_SIZE) {
      toast({ title: 'Fichier trop volumineux', description: 'Taille maximale : 20 Mo.', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      // Remove previous attachment if any
      if (contract.attachment_url) {
        await supabase.storage.from('contract-attachments').remove([contract.attachment_url]);
      }
      const path = `contracts/${contract.id}/${Date.now()}-${sanitizeFileName(file.name)}`;
      const { error: upErr } = await supabase.storage
        .from('contract-attachments')
        .upload(path, file, { contentType: 'application/pdf', upsert: false });
      if (upErr) throw upErr;
      updateContract.mutate({
        id: contract.id,
        updates: { attachment_url: path, attachment_name: file.name },
      });
    } catch (err) {
      toast({ title: 'Erreur upload', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  }

  async function handleDownloadAttachment() {
    if (!contract.attachment_url) return;
    const { data, error } = await supabase.storage
      .from('contract-attachments')
      .createSignedUrl(contract.attachment_url, 60);
    if (error || !data?.signedUrl) {
      toast({ title: 'Erreur', description: "Impossible de générer le lien de téléchargement.", variant: 'destructive' });
      return;
    }
    window.open(data.signedUrl, '_blank');
  }

  async function handleRemoveAttachment() {
    if (!contract.attachment_url) return;
    await supabase.storage.from('contract-attachments').remove([contract.attachment_url]);
    updateContract.mutate({
      id: contract.id,
      updates: { attachment_url: null, attachment_name: null },
    });
  }

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      <div
        onClick={() => setExpanded(!expanded)}
        className="w-full grid grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left items-center cursor-pointer"
        role="button"
        tabIndex={0}
      >
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{contract.client_name}</span>
            {contract.contract_number && (
              <Badge variant="secondary" className="font-mono text-[10px]">N° {contract.contract_number}</Badge>
            )}
            {isQuick && (
              <Badge variant="outline" className="text-[10px] uppercase tracking-wide">Contrat rapide</Badge>
            )}
            {renewing && (
              <Badge variant="warning" className="gap-1">
                <Bell className="h-3 w-3" />
                Renouvellement dans {monthsLeft}m
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              {format(parseISO(contract.validated_at), 'dd/MM/yyyy', { locale: fr })}
            </span>
            {monthlyRent != null && (
              <span className="flex items-center gap-1">
                <span className={cn(paymentFrequency === 'mensuel' && 'text-primary font-semibold')}>
                  Mensuel {monthlyRent.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                </span>
                <span>·</span>
                <span className={cn(paymentFrequency === 'trimestriel' && 'text-primary font-semibold')}>
                  Trimestriel {(quarterlyRent ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                </span>
              </span>
            )}
            {!hideFinancialPartner && contract.financial_partner && <span>{contract.financial_partner}</span>}
            {contract.duration_months && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{contract.duration_months} mois</span>}
            {endDate && <span>→ {format(endDate, 'MM/yyyy', { locale: fr })}</span>}
            {!hideFinancialPartner && contract.cession_percent != null && (
              <span className="flex items-center gap-1">Cession {contract.cession_percent} %</span>
            )}
            {contract.attachment_url && <span className="flex items-center gap-1"><FileText className="h-3 w-3" />PDF joint</span>}
          </div>
          {(contract.template_name || isQuick) && (
            <div className="text-[11px] text-muted-foreground">{contract.template_name ?? 'Contrat rapide'}</div>
          )}
        </div>
        {isQuick ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50 flex-shrink-0 disabled:opacity-40"
              title={contract.attachment_url ? 'Visualiser le PDF joint' : 'Aucune proposition ni PDF joint'}
              disabled={!contract.attachment_url}
              onClick={(e) => { e.stopPropagation(); handleDownloadAttachment(); }}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 flex-shrink-0 disabled:opacity-40"
              title={contract.attachment_url ? 'Télécharger le PDF joint' : 'Aucune proposition ni PDF joint'}
              disabled={!contract.attachment_url}
              onClick={(e) => { e.stopPropagation(); handleDownloadAttachment(); }}
            >
              <Download className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50 flex-shrink-0"
              title="Visualiser la proposition"
              onClick={(e) => { e.stopPropagation(); onVisualize?.(contract); }}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 flex-shrink-0"
              title="Télécharger la proposition"
              disabled={downloadingProposal}
              onClick={(e) => { e.stopPropagation(); handleDownloadProposal(); }}
            >
              {downloadingProposal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            </Button>
          </>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
              title="Supprimer le contrat"
              onClick={(e) => e.stopPropagation()}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer le contrat ?</AlertDialogTitle>
              <AlertDialogDescription>
                Le contrat de <strong>{contract.client_name}</strong> sera définitivement supprimé. Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteContract.mutate(contract.id)}
                disabled={deleteContract.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteContract.isPending ? 'Suppression…' : 'Supprimer'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <div className="text-muted-foreground col-start-4 md:col-start-auto">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border bg-muted/20 p-4 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Client</Label>
            <Input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Nom du client"
              className="h-9 text-sm"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Commercial en charge</Label>
              <Select value={commercialId} onValueChange={setCommercialId}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {sortedCommerciaux.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Numéro de contrat</Label>
              <Input
                value={contractNumber}
                onChange={(e) => setContractNumber(e.target.value)}
                placeholder="Ex : 2026-00123"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{hasProposalRent ? 'Loyers HT (issus de la proposition)' : 'Loyers HT'}</Label>
              {hasProposalRent ? (
                <div className="min-h-9 px-3 py-2 text-sm border border-border rounded-md bg-muted/40 flex items-center gap-3 flex-wrap">
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded flex items-center gap-1',
                      paymentFrequency === 'mensuel'
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-muted-foreground'
                    )}
                  >
                    Mensuel <strong>{(monthlyRent ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</strong>
                    {paymentFrequency === 'mensuel' && <Badge variant="secondary" className="ml-1 text-[9px]">Sélectionnée</Badge>}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded flex items-center gap-1',
                      paymentFrequency === 'trimestriel'
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-muted-foreground'
                    )}
                  >
                    Trimestriel <strong>{(quarterlyRent ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</strong>
                    {paymentFrequency === 'trimestriel' && <Badge variant="secondary" className="ml-1 text-[9px]">Sélectionnée</Badge>}
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    value={manualMonthlyRent}
                    onChange={(e) => setManualMonthlyRent(e.target.value)}
                    placeholder="Loyer mensuel HT"
                    className="h-9 text-sm"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    value={manualQuarterlyRent}
                    onChange={(e) => setManualQuarterlyRent(e.target.value)}
                    placeholder="Loyer trimestriel HT"
                    className="h-9 text-sm"
                  />
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Date de mise en place</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      'h-9 w-full justify-start text-left font-normal text-sm',
                      !implementationDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {implementationDate
                      ? format(implementationDate, 'dd/MM/yyyy', { locale: fr })
                      : 'Choisir une date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={implementationDate}
                    onSelect={setImplementationDate}
                    initialFocus
                    locale={fr}
                    className={cn('p-3 pointer-events-auto')}
                  />
                </PopoverContent>
              </Popover>
            </div>
            {!hideFinancialPartner && (
            <div className="space-y-1.5">
              <Label className="text-xs">Partenaire financier</Label>
              <Select value={financialPartner} onValueChange={setFinancialPartner}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {FINANCIAL_PARTNERS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Durée (mois)</Label>
              <div className="flex items-center gap-2">
                <Select
                  value={DURATIONS.includes(Number(durationMonths)) ? durationMonths : ''}
                  onValueChange={setDurationMonths}
                >
                  <SelectTrigger className="h-9 text-sm flex-1">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATIONS.map((d) => <SelectItem key={d} value={String(d)}>{d} mois</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={1}
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(e.target.value)}
                  placeholder="Autre"
                  className="w-24 h-9 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Périodicité</Label>
              <div className="flex gap-2">
                {(['mensuel', 'trimestriel'] as PaymentFrequency[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setPaymentFrequency(f)}
                    className={cn(
                      'h-9 px-4 rounded-full text-sm font-medium border transition-colors capitalize',
                      paymentFrequency === f
                        ? 'bg-black text-white border-black'
                        : 'bg-background text-foreground border-border hover:bg-muted'
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            {!hideFinancialPartner && (
              <div className="space-y-1.5">
                <Label className="text-xs">Cession</Label>
                <div className="flex gap-2 flex-wrap">
                  {([1, 2, 3, 4] as const).map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setCessionPercent(cessionPercent === pct ? null : pct)}
                      className={cn(
                        'h-9 px-4 rounded-full text-sm font-medium border transition-colors',
                        cessionPercent === pct
                          ? 'bg-black text-white border-black'
                          : 'bg-background text-foreground border-border hover:bg-muted'
                      )}
                    >
                      {pct} %
                    </button>
                  ))}
                  {cessionPercent !== null && (
                    <button
                      type="button"
                      onClick={() => setCessionPercent(null)}
                      className="h-9 px-3 rounded-full text-xs font-medium border border-border text-muted-foreground hover:bg-muted"
                    >
                      Aucune
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>


          {/* Attachment section */}
          <div className="space-y-1.5">
            <Label className="text-xs">Pièce jointe (PDF)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            {contract.attachment_url ? (
              <div className="flex items-center gap-2 flex-wrap p-2 border border-border rounded-md bg-background">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm truncate flex-1 min-w-0">{contract.attachment_name ?? 'Fichier PDF'}</span>
                <Button variant="outline" size="sm" onClick={handleDownloadAttachment} className="gap-1">
                  <Download className="h-3.5 w-3.5" /> Télécharger
                </Button>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-1">
                  <Upload className="h-3.5 w-3.5" /> Remplacer
                </Button>
                <Button variant="outline" size="sm" onClick={handleRemoveAttachment} className="gap-1 text-red-600 hover:text-red-700">
                  <X className="h-3.5 w-3.5" /> Supprimer
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-1">
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                Importer un PDF
              </Button>
            )}
          </div>

          {endDate && (
            <div className="text-xs text-muted-foreground">
              Date de fin estimée : <strong>{format(endDate, 'MMMM yyyy', { locale: fr })}</strong>
            </div>
          )}
          <div className="flex justify-end">
            <Button size="sm" onClick={handleSave} disabled={updateContract.isPending}>
              {updateContract.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
