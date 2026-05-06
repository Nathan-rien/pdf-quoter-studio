import React, { useState, useEffect, useRef } from 'react';
import { User, FileText, Package, Calculator, Settings, Trash2, Plus, Eye, EyeOff, Download, Briefcase, Copy, Loader2, GripVertical, SeparatorHorizontal, ImagePlus, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AutoResizeTextarea } from '@/components/ui/auto-resize-textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { useRentalProposalStore, PARTENAIRES } from '@/stores/rentalProposalStore';
import { useOptionsAdminStore } from '@/stores/optionsAdminStore';
import { useBaseTauxStore } from '@/stores/baseTauxStore';
import { getConditionFinContrat } from '@/data/frais-dossier';
import { ENTITIES, CommercialEntity } from '@/data/commerciaux';
import { useCommerciaux } from '@/hooks/useCommerciaux';
import { ProposalCard } from './ProposalCard';
import { useAuth } from '@/hooks/useAuth';
import { useCommercialIdentity } from '@/hooks/useCommercialIdentity';
import { ReadOnlyBadge } from '@/components/ui/read-only-badge';

export function RentalDataEditor() {
  const baseTauxEntries = useBaseTauxStore((s) => s.entries);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectedAdminOptions, setSelectedAdminOptions] = useState<string[]>([]);
  const [isNosOptionsPopoverOpen, setIsNosOptionsPopoverOpen] = useState(false);
  const [selectedNosAdminOptions, setSelectedNosAdminOptions] = useState<string[]>([]);

  const { isAdmin, isCommercial } = useAuth();
  const { commercial, commercialId } = useCommercialIdentity();
  const { getCommerciauxByEntity, getCommercialById } = useCommerciaux();
  const lockCommercialFields = !isAdmin && !!commercialId;

  const {
    clientData,
    matriceData,
    proposals,
    lignesData,
    servicesInclus,
    optionsServices,
    nosOptions,
    pdfImportStatus,
    commercialData,
    updateClientField,
    updateMatriceField,
    addProposal,
    duplicateProposal,
    updateProposal,
    deleteProposal,
    updateLigne,
    addLigne,
    addSeparatorLigne,
    reorderLigne,
    deleteLigne,
    updateServicesInclus,
    addOptionService,
    updateOptionService,
    deleteOptionService,
    toggleOptionService,
    addNosOption,
    updateNosOption,
    deleteNosOption,
    toggleNosOption,
    getCalculatedValues,
    getSelectedOptionsPrices,
    updateCommercialEntity,
    selectCommercial,
    getSelectedCommercial,
  } = useRentalProposalStore();

  const { options: adminOptions, ensureLoaded } = useOptionsAdminStore();
  const activeAdminOptions = adminOptions.filter(opt => opt.isActive);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  useEffect(() => {
    setIsLoadingOptions(true);
    ensureLoaded().finally(() => setIsLoadingOptions(false));
  }, [ensureLoaded]);

  // Auto-fill commercial identity for commercial users
  useEffect(() => {
    if (lockCommercialFields && commercial && commercialId) {
      if (commercialData.entity !== commercial.entity) {
        updateCommercialEntity(commercial.entity);
      }
      if (commercialData.commercialId !== commercialId) {
        selectCommercial(commercialId);
      }
    }
  }, [lockCommercialFields, commercial, commercialId]);

  const calculatedValues = getCalculatedValues();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const toggleAdminOption = (optionId: string) => {
    setSelectedAdminOptions(prev => 
      prev.includes(optionId) 
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };

  const handleImportSelected = () => {
    selectedAdminOptions.forEach(optionId => {
      const option = activeAdminOptions.find(opt => opt.id === optionId);
      if (option) {
        // Concaténer les services pour la description
        const descriptionParts = option.services.map(s => {
          const text = typeof s === 'string' ? s : s.text;
          const subItems = typeof s === 'string' ? [] : (s.subItems || []);
          if (subItems.length > 0) {
            return `${text}\n  - ${subItems.join('\n  - ')}`;
          }
          return text;
        });
        const description = descriptionParts.join('\n');
        addOptionService(option.title, description, option.price?.amount ?? null);
      }
    });
    setSelectedAdminOptions([]);
    setIsPopoverOpen(false);
  };

  const toggleNosAdminOption = (optionId: string) => {
    setSelectedNosAdminOptions(prev => 
      prev.includes(optionId) 
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };

  const handleImportNosOptionsSelected = () => {
    selectedNosAdminOptions.forEach(optionId => {
      const option = activeAdminOptions.find(opt => opt.id === optionId);
      if (option) {
        // Concaténer les services pour la description
        const descriptionParts = option.services.map(s => {
          const text = typeof s === 'string' ? s : s.text;
          const subItems = typeof s === 'string' ? [] : (s.subItems || []);
          if (subItems.length > 0) {
            return `${text}\n  - ${subItems.join('\n  - ')}`;
          }
          return text;
        });
        const description = descriptionParts.join('\n');
        addNosOption(option.title, description, option.price?.amount ?? null);
      }
    });
    setSelectedNosAdminOptions([]);
    setIsNosOptionsPopoverOpen(false);
  };

  const formatNumber = (value: number | null) => {
    if (value === null) return '-';
    return value.toFixed(2);
  };

  const formatPercent = (value: number | null) => {
    if (value === null) return '-';
    return `${value.toFixed(2)} %`;
  };

  return (
    <div className="space-y-4">
      {/* Header with source info */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Structure PDF - Matrice_Location</p>
                <p className="text-xs text-muted-foreground">
                  Source : {pdfImportStatus.fileName || 'Aucun fichier'}
                </p>
              </div>
            </div>
            {pdfImportStatus.source && (
              <Badge variant="secondary" className="text-xs">
                {pdfImportStatus.source === 'cybertek' ? 'Cybertek Pro' : 'GrosBill Pro'}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="client" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="client" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Client
          </TabsTrigger>
          <TabsTrigger value="matrice" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Matrice
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Services inclus
          </TabsTrigger>
          <TabsTrigger value="nosoptions" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Nos Options
            {nosOptions.filter(o => o.selected).length > 0 && (
              <Badge variant="secondary" className="ml-1">{nosOptions.filter(o => o.selected).length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="invest" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Invest
            {lignesData.length > 0 && (
              <Badge variant="secondary" className="ml-1">{lignesData.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="basetaux" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Base Taux
          </TabsTrigger>
        </TabsList>

        {/* Client Tab */}
        <TabsContent value="client" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client-nom">Prénom Nom</Label>
                  <Input
                    id="client-nom"
                    value={clientData.nom}
                    onChange={(e) => updateClientField('nom', e.target.value)}
                    placeholder="ex: Jonathan Guédon"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-raison-sociale">Raison sociale</Label>
                  <Input
                    id="client-raison-sociale"
                    value={clientData.raisonSociale}
                    onChange={(e) => updateClientField('raisonSociale', e.target.value)}
                    placeholder="ex: CABINET DENTAIRE DU FALAISE"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-email">Email</Label>
                  <Input
                    id="client-email"
                    type="email"
                    value={clientData.email}
                    onChange={(e) => updateClientField('email', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-adresse">Adresse</Label>
                <Input
                  id="client-adresse"
                  value={clientData.adresse}
                  onChange={(e) => updateClientField('adresse', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client-cp">Code postal</Label>
                  <Input
                    id="client-cp"
                    value={clientData.codePostal}
                    onChange={(e) => updateClientField('codePostal', e.target.value)}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="client-ville">Ville</Label>
                  <Input
                    id="client-ville"
                    value={clientData.ville}
                    onChange={(e) => updateClientField('ville', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-tel">Téléphone</Label>
                <Input
                  id="client-tel"
                  value={clientData.telephone}
                  onChange={(e) => updateClientField('telephone', e.target.value)}
                />
              </div>

              {/* Logo client upload */}
              <div className="space-y-2">
                <Label>Logo client</Label>
                {clientData.logoUrl ? (
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-16 border rounded-md overflow-hidden bg-muted/30 flex items-center justify-center">
                      <img
                        src={clientData.logoUrl}
                        alt="Logo client"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="iconSm"
                      onClick={() => updateClientField('logoUrl', '')}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/svg+xml"
                      className="hidden"
                      id="client-logo-upload"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            updateClientField('logoUrl', ev.target?.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                        e.target.value = '';
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('client-logo-upload')?.click()}
                    >
                      <ImagePlus className="h-4 w-4 mr-2" />
                      Ajouter un logo
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Commercial Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Commercial associé
                {lockCommercialFields && <ReadOnlyBadge size="sm" />}
              </CardTitle>
              <CardDescription>Sélectionnez l'entité et le commercial en charge de cette proposition</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Sélecteur d'entité */}
                <div className="space-y-2">
                  <Label>Entité</Label>
                  <Select
                    value={commercialData.entity ?? ''}
                    onValueChange={(value) => updateCommercialEntity(value as CommercialEntity)}
                    disabled={lockCommercialFields}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une entité..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTITIES.map(e => (
                        <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Sélecteur de commercial (filtré par entité) */}
                <div className="space-y-2">
                  <Label>Commercial</Label>
                  <Select
                    value={commercialData.commercialId ?? ''}
                    onValueChange={(value) => selectCommercial(value)}
                    disabled={lockCommercialFields || !commercialData.entity}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un commercial..." />
                    </SelectTrigger>
                    <SelectContent>
                      {commercialData.entity && getCommerciauxByEntity(commercialData.entity).map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Aperçu du commercial sélectionné */}
              {commercialData.commercialId && getCommercialById(commercialData.commercialId) && (() => {
                const sel = getCommercialById(commercialData.commercialId)!;
                return (
                  <div className="p-3 bg-muted/50 rounded-lg text-sm">
                    <p className="font-medium">{sel.nom}</p>
                    {sel.telephone && (
                      <p className="text-muted-foreground">{sel.telephone}</p>
                    )}
                    <p className="text-muted-foreground">{sel.email}</p>
                    <p className="text-muted-foreground text-xs mt-1">{sel.adresse}</p>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Matrice Tab */}
        <TabsContent value="matrice" className="mt-4 space-y-4">
          {/* Global settings */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Label>Afficher coût locatif annuel</Label>
              <Switch
                checked={matriceData.showCoutLocatifAnnuel}
                onCheckedChange={(checked) => updateMatriceField('showCoutLocatifAnnuel', checked)}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addProposal()}
              disabled={proposals.length >= 4}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une proposition
            </Button>
          </div>

          {/* Proposals list with original Saisie/Données structure */}
          {proposals.map((proposal, index) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              index={index}
              totalProposals={proposals.length}
              optionsPrices={getSelectedOptionsPrices()}
              canDelete={proposals.length > 1}
              showCoutLocatifAnnuel={matriceData.showCoutLocatifAnnuel}
              onToggleCoutLocatif={(checked) => updateMatriceField('showCoutLocatifAnnuel', checked)}
              onUpdate={(updates) => updateProposal(proposal.id, updates)}
              onDuplicate={() => duplicateProposal(proposal.id)}
              onDelete={() => deleteProposal(proposal.id)}
            />
          ))}

          {/* Warning if 4 proposals */}
          {proposals.length >= 4 && (
            <Card className="border-warning/50 bg-warning/5">
              <CardContent className="p-3 flex items-center gap-2 text-sm text-warning-foreground">
                <span>⚠️</span>
                <span>Nombre maximum de propositions atteint (4).</span>
              </CardContent>
            </Card>
          )}

          {/* Encart Condition fin de contrat - using first proposal's refinanceur */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Condition fin de contrat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Frais de dossier</Label>
                  <div className="flex items-center h-10 px-3 bg-muted rounded-md">
                    <span className="font-medium">{calculatedValues.fraisDossier ?? '-'} €</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {proposals[0]?.refinanceur ? (
                    <Badge 
                      variant={getConditionFinContrat(proposals[0].refinanceur) === 'Reprise obligatoire loueur' ? 'destructive' : 'default'}
                      className="text-sm"
                    >
                      {getConditionFinContrat(proposals[0].refinanceur) ?? 'Non définie'}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-sm">Sélectionnez un refinanceur</Badge>
                  )}
                </div>
              </div>

              {/* Commentaire libre */}
              <div className="mt-4 space-y-2">
                <Label>Commentaire</Label>
                <AutoResizeTextarea
                  placeholder="Commentaire libre affiché sous Avantages / Conditions de l'offre..."
                  value={matriceData.commentaire || ''}
                  onChange={(e) => updateMatriceField('commentaire', e.target.value)}
                  className="min-h-[60px]"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services inclus Tab (Page 5) */}
        <TabsContent value="services" className="mt-4 space-y-4">
          {/* Bloc permanent "Services inclus" - toujours affiché */}
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">Services inclus</CardTitle>
                  <Badge variant="secondary" className="text-xs">Toujours affiché</Badge>
                </div>
              </div>
              <CardDescription>Ce bloc apparaît systématiquement en haut de la page 5</CardDescription>
            </CardHeader>
            <CardContent>
              <AutoResizeTextarea
                placeholder="Description des services inclus..."
                value={servicesInclus.description}
                onChange={(e) => updateServicesInclus(e.target.value)}
                className="min-h-[80px]"
              />
            </CardContent>
          </Card>

          {/* Options additionnelles - Page 5 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Options additionnelles</CardTitle>
                <CardDescription>Services supplémentaires affichés sur la page 5</CardDescription>
              </div>
              <div className="flex gap-2">
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" disabled={isLoadingOptions || activeAdminOptions.length === 0}>
                      {isLoadingOptions
                        ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        : <Download className="h-4 w-4 mr-2" />}
                      Importer depuis Admin
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="space-y-3">
                      <div className="font-medium text-sm">Options disponibles</div>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {activeAdminOptions.map((option) => (
                          <label
                            key={option.id}
                            className="flex items-start gap-2 p-2 rounded-md hover:bg-muted cursor-pointer"
                          >
                            <Checkbox
                              checked={selectedAdminOptions.includes(option.id)}
                              onCheckedChange={() => toggleAdminOption(option.id)}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{option.title}</div>
                              {option.price && (
                                <div className="text-xs text-muted-foreground">
                                  {option.price.amount} {option.price.unit}
                                </div>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full"
                        disabled={selectedAdminOptions.length === 0}
                        onClick={handleImportSelected}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter {selectedAdminOptions.length > 0 && `(${selectedAdminOptions.length})`}
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                <Button variant="outline" size="sm" onClick={() => addOptionService('', '', null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Avertissement coefficient manquant */}
              {!calculatedValues.coefficient && (
                <div className="mb-3 flex items-start gap-2 p-3 bg-warning/10 border border-warning/30 rounded-lg text-xs text-warning-foreground">
                  <span>⚠️</span>
                  <span>Le coefficient n'est pas disponible (partenaire / durée / montant non renseigné). Le calcul croisé entre "Au total" et "Au mois" est désactivé.</span>
                </div>
              )}
              <div className="space-y-3">
                {optionsServices.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucune option additionnelle</p>
                ) : (
                  optionsServices.map((opt) => {
                    const coefficient = calculatedValues.coefficient;

                    const handlePriceMois = (moisValue: number | null) => {
                      if (moisValue === null) {
                        updateOptionService(opt.id, { price: null });
                        return;
                      }
                      const total = coefficient ? Math.round(moisValue * 100 / coefficient * 100) / 100 : null;
                      updateOptionService(opt.id, { price: moisValue, ...(total !== null ? { priceTotal: total } : {}) });
                    };

                    const handlePriceTotal = (totalValue: number | null) => {
                      if (totalValue === null) {
                        updateOptionService(opt.id, { priceTotal: null });
                        return;
                      }
                      const mois = coefficient ? Math.round(totalValue * coefficient / 100 * 100) / 100 : null;
                      updateOptionService(opt.id, { priceTotal: totalValue, ...(mois !== null ? { price: mois } : {}) });
                    };

                    const showPriceMode = opt.showPriceMode ?? 'mensuel';

                    return (
                      <div key={opt.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <Switch checked={opt.selected} onCheckedChange={() => toggleOptionService(opt.id)} className="mt-2" />
                        <Input
                          placeholder="Nom"
                          value={opt.name}
                          onChange={(e) => updateOptionService(opt.id, { name: e.target.value })}
                          className="w-36"
                        />
                        <AutoResizeTextarea
                          placeholder="Description"
                          value={opt.description}
                          onChange={(e) => updateOptionService(opt.id, { description: e.target.value })}
                          className="flex-1 text-sm"
                        />
                        {/* Champs de prix + toggle */}
                        <div className="flex flex-col gap-1.5 min-w-[170px]">
                          <div className="flex items-center gap-1.5">
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Au total"
                              value={opt.priceTotal ?? ''}
                              onChange={(e) => handlePriceTotal(e.target.value ? parseFloat(e.target.value) : null)}
                              className="w-24 text-sm h-8"
                            />
                            <span className="text-xs text-muted-foreground">€</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Au mois"
                              value={opt.price ?? ''}
                              onChange={(e) => handlePriceMois(e.target.value ? parseFloat(e.target.value) : null)}
                              className="w-24 text-sm h-8"
                            />
                            <span className="text-xs text-muted-foreground">€/mois</span>
                          </div>
                          {/* Toggle affichage */}
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <span className="text-[10px] text-muted-foreground">Afficher :</span>
                            <button
                              type="button"
                              onClick={() => updateOptionService(opt.id, { showPriceMode: 'mensuel' })}
                              className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${showPriceMode === 'mensuel' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}
                            >
                              /mois
                            </button>
                            <button
                              type="button"
                              onClick={() => updateOptionService(opt.id, { showPriceMode: 'total' })}
                              className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${showPriceMode === 'total' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}
                            >
                              total
                            </button>
                          </div>
                          {/* Toggle scope */}
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <span className="text-[10px] text-muted-foreground">Scope :</span>
                            <button
                              type="button"
                              onClick={() => updateOptionService(opt.id, { pricingScope: 'par_machine' })}
                              className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${(opt.pricingScope ?? 'par_machine') === 'par_machine' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}
                            >
                              /machine
                            </button>
                            <button
                              type="button"
                              onClick={() => updateOptionService(opt.id, { pricingScope: 'pour_le_parc' })}
                              className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${opt.pricingScope === 'pour_le_parc' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}
                            >
                              /parc
                            </button>
                          </div>
                          {/* Toggle visibilité du prix sur le template/PDF */}
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <span className="text-[10px] text-muted-foreground">Prix visible :</span>
                            <Switch
                              checked={opt.showPrice ?? true}
                              onCheckedChange={(checked) => updateOptionService(opt.id, { showPrice: checked })}
                              className="scale-75 origin-left"
                              aria-label="Afficher le prix sur le template et le PDF"
                            />
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => deleteOptionService(opt.id)} className="mt-1">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Nos Options Tab (fusionnées sur Page 5) */}
        <TabsContent value="nosoptions" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Nos Options</CardTitle>
                <Badge variant="secondary" className="text-xs">Page 5</Badge>
              </div>
              <CardDescription>Options sélectionnables affichées sous les Services inclus (page 5)</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Options disponibles</CardTitle>
                <CardDescription>Services supplémentaires sélectionnables</CardDescription>
              </div>
              <div className="flex gap-2">
                <Popover open={isNosOptionsPopoverOpen} onOpenChange={setIsNosOptionsPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" disabled={isLoadingOptions || activeAdminOptions.length === 0}>
                      {isLoadingOptions
                        ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        : <Download className="h-4 w-4 mr-2" />}
                      Importer depuis Admin
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="space-y-3">
                      <div className="font-medium text-sm">Options disponibles</div>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {activeAdminOptions.map((option) => (
                          <label
                            key={option.id}
                            className="flex items-start gap-2 p-2 rounded-md hover:bg-muted cursor-pointer"
                          >
                            <Checkbox
                              checked={selectedNosAdminOptions.includes(option.id)}
                              onCheckedChange={() => toggleNosAdminOption(option.id)}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{option.title}</div>
                              {option.price && (
                                <div className="text-xs text-muted-foreground">
                                  {option.price.amount} {option.price.unit}
                                </div>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full"
                        disabled={selectedNosAdminOptions.length === 0}
                        onClick={handleImportNosOptionsSelected}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter {selectedNosAdminOptions.length > 0 && `(${selectedNosAdminOptions.length})`}
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                <Button variant="outline" size="sm" onClick={() => addNosOption('', '', null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Avertissement coefficient manquant */}
              {!calculatedValues.coefficient && (
                <div className="mb-3 flex items-start gap-2 p-3 bg-warning/10 border border-warning/30 rounded-lg text-xs text-warning-foreground">
                  <span>⚠️</span>
                  <span>Le coefficient n'est pas disponible (partenaire / durée / montant non renseigné). Le calcul croisé entre "Au total" et "Au mois" est désactivé.</span>
                </div>
              )}
              <div className="space-y-3">
                {nosOptions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucune option</p>
                ) : (
                  nosOptions.map((opt) => {
                    const coefficient = calculatedValues.coefficient;

                    const handlePriceMois = (moisValue: number | null) => {
                      if (moisValue === null) {
                        updateNosOption(opt.id, { price: null });
                        return;
                      }
                      const total = coefficient ? Math.round(moisValue * 100 / coefficient * 100) / 100 : null;
                      updateNosOption(opt.id, { price: moisValue, ...(total !== null ? { priceTotal: total } : {}) });
                    };

                    const handlePriceTotal = (totalValue: number | null) => {
                      if (totalValue === null) {
                        updateNosOption(opt.id, { priceTotal: null });
                        return;
                      }
                      const mois = coefficient ? Math.round(totalValue * coefficient / 100 * 100) / 100 : null;
                      updateNosOption(opt.id, { priceTotal: totalValue, ...(mois !== null ? { price: mois } : {}) });
                    };

                    const showPriceMode = opt.showPriceMode ?? 'mensuel';

                    return (
                      <div key={opt.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <Switch checked={opt.selected} onCheckedChange={() => toggleNosOption(opt.id)} className="mt-2" />
                        <Input
                          placeholder="Nom"
                          value={opt.name}
                          onChange={(e) => updateNosOption(opt.id, { name: e.target.value })}
                          className="w-36"
                        />
                        <AutoResizeTextarea
                          placeholder="Description"
                          value={opt.description}
                          onChange={(e) => updateNosOption(opt.id, { description: e.target.value })}
                          className="flex-1 text-sm"
                        />
                        {/* Champs de prix + toggle */}
                        <div className="flex flex-col gap-1.5 min-w-[170px]">
                          <div className="flex items-center gap-1.5">
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Au total"
                              value={opt.priceTotal ?? ''}
                              onChange={(e) => handlePriceTotal(e.target.value ? parseFloat(e.target.value) : null)}
                              className="w-24 text-sm h-8"
                            />
                            <span className="text-xs text-muted-foreground">€</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Au mois"
                              value={opt.price ?? ''}
                              onChange={(e) => handlePriceMois(e.target.value ? parseFloat(e.target.value) : null)}
                              className="w-24 text-sm h-8"
                            />
                            <span className="text-xs text-muted-foreground">€/mois</span>
                          </div>
                          {/* Toggle affichage */}
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <span className="text-[10px] text-muted-foreground">Afficher :</span>
                            <button
                              type="button"
                              onClick={() => updateNosOption(opt.id, { showPriceMode: 'mensuel' })}
                              className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${showPriceMode === 'mensuel' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}
                            >
                              /mois
                            </button>
                            <button
                              type="button"
                              onClick={() => updateNosOption(opt.id, { showPriceMode: 'total' })}
                              className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${showPriceMode === 'total' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}
                            >
                              total
                            </button>
                          </div>
                          {/* Toggle scope */}
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <span className="text-[10px] text-muted-foreground">Scope :</span>
                            <button
                              type="button"
                              onClick={() => updateNosOption(opt.id, { pricingScope: 'par_machine' })}
                              className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${(opt.pricingScope ?? 'par_machine') === 'par_machine' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}
                            >
                              /machine
                            </button>
                            <button
                              type="button"
                              onClick={() => updateNosOption(opt.id, { pricingScope: 'pour_le_parc' })}
                              className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${opt.pricingScope === 'pour_le_parc' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}
                            >
                              /parc
                            </button>
                          </div>
                          {/* Toggle visibilité du prix sur le template/PDF */}
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <span className="text-[10px] text-muted-foreground">Prix visible :</span>
                            <Switch
                              checked={opt.showPrice ?? true}
                              onCheckedChange={(checked) => updateNosOption(opt.id, { showPrice: checked })}
                              className="scale-75 origin-left"
                              aria-label="Afficher le prix sur le template et le PDF"
                            />
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => deleteNosOption(opt.id)} className="mt-1">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invest Tab */}
        <TabsContent value="invest" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Lignes produits (Invest)</CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="invest-show-prices" className="text-sm text-muted-foreground">Afficher prix Investissement</Label>
                  <Switch
                    id="invest-show-prices"
                    checked={matriceData.investShowPrices}
                    onCheckedChange={(checked) => updateMatriceField('investShowPrices', checked)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="invest-show-offer" className="text-sm text-muted-foreground">Afficher montant Offre</Label>
                  <Switch
                    id="invest-show-offer"
                    checked={matriceData.investShowOffer !== false}
                    onCheckedChange={(checked) => updateMatriceField('investShowOffer', checked)}
                  />
                </div>
                <Button variant="outline" size="sm" onClick={addLigne}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead className="min-w-[420px]">Désignation</TableHead>
                      <TableHead className="w-28 text-right">Nb</TableHead>
                      {matriceData.investShowPrices && (
                        <>
                          <TableHead className="w-36 text-right">VUN</TableHead>
                          <TableHead className="w-36 text-right">VTN</TableHead>
                        </>
                      )}
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lignesData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={matriceData.investShowPrices ? 6 : 4} className="text-center text-muted-foreground py-8">
                          Aucune ligne de produit
                        </TableCell>
                      </TableRow>
                    ) : (
                      lignesData.map((ligne, index) => {
                        const colCount = matriceData.investShowPrices ? 6 : 4;
                        const insertButton = (atIndex: number) => (
                          <TableRow key={`sep-btn-${atIndex}`} className="group/separator border-0 hover:bg-transparent">
                            <TableCell colSpan={colCount} className="p-0 h-5 relative">
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/separator:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => addSeparatorLigne(atIndex)}
                                  className="flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors"
                                  title="Insérer une séparation"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                        
                        if (ligne.isSeparator) {
                          return (
                            <React.Fragment key={`frag-${index}`}>
                              {index === 0 && insertButton(0)}
                              <TableRow
                                draggable
                                onDragStart={() => setDragIndex(index)}
                                onDragOver={(e) => { e.preventDefault(); setDragOverIndex(index); }}
                                onDrop={() => { if (dragIndex !== null && dragIndex !== index) reorderLigne(dragIndex, index); setDragIndex(null); setDragOverIndex(null); }}
                                onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
                                className={`bg-blue-50 border-blue-100 ${dragIndex === index ? 'opacity-40' : ''} ${dragOverIndex === index && dragIndex !== index ? 'border-t-2 border-t-primary' : ''}`}
                              >
                                <TableCell className="w-10 cursor-grab active:cursor-grabbing px-1">
                                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                                </TableCell>
                                <TableCell colSpan={colCount - 2}>
                                  <AutoResizeTextarea
                                    value={ligne.designation}
                                    onChange={(e) => updateLigne(index, { designation: e.target.value })}
                                    placeholder="Description de la section..."
                                    className="min-h-[36px] bg-transparent border-blue-200 focus-visible:ring-blue-300"
                                    rows={1}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteLigne(index)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                              {insertButton(index + 1)}
                            </React.Fragment>
                          );
                        }

                        return (
                          <React.Fragment key={`frag-${index}`}>
                            {index === 0 && insertButton(0)}
                            <TableRow
                              draggable
                              onDragStart={() => setDragIndex(index)}
                              onDragOver={(e) => { e.preventDefault(); setDragOverIndex(index); }}
                              onDrop={() => { if (dragIndex !== null && dragIndex !== index) reorderLigne(dragIndex, index); setDragIndex(null); setDragOverIndex(null); }}
                              onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
                              className={`${dragIndex === index ? 'opacity-40' : ''} ${dragOverIndex === index && dragIndex !== index ? 'border-t-2 border-t-primary' : ''}`}
                            >
                              <TableCell className="w-10 cursor-grab active:cursor-grabbing px-1">
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                              </TableCell>
                              <TableCell className="min-w-[420px] align-top">
                                <AutoResizeTextarea
                                  value={ligne.designation}
                                  onChange={(e) => updateLigne(index, { designation: e.target.value })}
                                  className="min-h-[72px]"
                                  rows={3}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="1"
                                  value={ligne.quantite}
                                  onChange={(e) => updateLigne(index, { quantite: parseInt(e.target.value) || 1 })}
                                  className="h-8 text-right w-full"
                                />
                              </TableCell>
                              {matriceData.investShowPrices && (
                                <>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={ligne.prixUnitaire ?? ''}
                                      onChange={(e) => updateLigne(index, { prixUnitaire: e.target.value ? parseFloat(e.target.value) : null })}
                                      className="h-8 text-right w-full"
                                    />
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {formatNumber(ligne.totalHT)} €
                                  </TableCell>
                                </>
                              )}
                              <TableCell>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteLigne(index)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                            {insertButton(index + 1)}
                          </React.Fragment>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
              {matriceData.investShowPrices && lignesData.length > 0 && (
                <div className="flex justify-end mt-3">
                  <div className="text-sm font-semibold">
                    Total : {formatNumber(lignesData.filter(l => !l.isSeparator).reduce((sum, l) => sum + (l.totalHT || 0), 0))} € HT
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Base Taux Tab */}
        <TabsContent value="basetaux" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Base Taux</CardTitle>
              <CardDescription>Données fixes (lecture seule)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Partenaire</TableHead>
                      <TableHead className="text-right">Montant Min</TableHead>
                      <TableHead className="text-right">Montant Max</TableHead>
                      <TableHead className="text-right">Durée</TableHead>
                      <TableHead className="text-right">Taux</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {baseTauxEntries.slice(0, 50).map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.partenaire}</TableCell>
                        <TableCell className="text-right">{row.montantMin.toLocaleString()} €</TableCell>
                        <TableCell className="text-right">{row.montantMax.toLocaleString()} €</TableCell>
                        <TableCell className="text-right">{row.dureeMois} mois</TableCell>
                        <TableCell className="text-right">{row.taux}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Affichage limité à 50 lignes. Total : {baseTauxEntries.length} entrées.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
