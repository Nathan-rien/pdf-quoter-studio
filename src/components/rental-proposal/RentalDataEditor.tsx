import React, { useState } from 'react';
import { User, FileText, Package, Calculator, Settings, Trash2, Plus, Eye, EyeOff, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { BASE_TAUX_DATA } from '@/data/base-taux';
import { getConditionFinContrat } from '@/data/frais-dossier';

export function RentalDataEditor() {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectedAdminOptions, setSelectedAdminOptions] = useState<string[]>([]);

  const {
    clientData,
    matriceData,
    lignesData,
    optionsServices,
    pdfImportStatus,
    updateClientField,
    updateMatriceField,
    updateLigne,
    addLigne,
    deleteLigne,
    addOptionService,
    updateOptionService,
    deleteOptionService,
    toggleOptionService,
    getCalculatedValues,
  } = useRentalProposalStore();

  const { options: adminOptions } = useOptionsAdminStore();
  const activeAdminOptions = adminOptions.filter(opt => opt.isActive);

  const calculatedValues = getCalculatedValues();

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
        const description = descriptionParts.join(', ');
        addOptionService(option.title, description, option.price?.amount ?? null);
      }
    });
    setSelectedAdminOptions([]);
    setIsPopoverOpen(false);
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
    <div className="space-y-6">
      {/* Header with source info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Structure PDF - Matrice_Location</p>
                <p className="text-sm text-muted-foreground">
                  Source : {pdfImportStatus.fileName || 'Aucun fichier'}
                </p>
              </div>
            </div>
            {pdfImportStatus.source && (
              <Badge variant="secondary">
                {pdfImportStatus.source === 'cybertek' ? 'Cybertek Pro' : 'GrosBill Pro'}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="client" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="client" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Client
          </TabsTrigger>
          <TabsTrigger value="matrice" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Matrice
          </TabsTrigger>
          <TabsTrigger value="options" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Options
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
        <TabsContent value="client" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client-nom">Nom / Raison sociale</Label>
                  <Input
                    id="client-nom"
                    value={clientData.nom}
                    onChange={(e) => updateClientField('nom', e.target.value)}
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Matrice Tab */}
        <TabsContent value="matrice" className="mt-4 space-y-6">
          {/* Encart Saisie (anciennement Location) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Saisie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="montant-invest">Montant investissement HT</Label>
                  <Input
                    id="montant-invest"
                    type="number"
                    step="0.01"
                    value={matriceData.montantInvestissement ?? ''}
                    onChange={(e) => updateMatriceField('montantInvestissement', e.target.value ? parseFloat(e.target.value) : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duree">Durée (mois)</Label>
                  <Input
                    id="duree"
                    type="number"
                    min="12"
                    step="12"
                    value={matriceData.duree ?? ''}
                    onChange={(e) => updateMatriceField('duree', e.target.value ? parseInt(e.target.value) : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="refinanceur">Refinanceur</Label>
                  <Select
                    value={matriceData.refinanceur ?? ''}
                    onValueChange={(value) => updateMatriceField('refinanceur', value as any)}
                  >
                    <SelectTrigger id="refinanceur">
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {PARTENAIRES.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="marge-appliquee">Marge appliquée (%)</Label>
                  <Input
                    id="marge-appliquee"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={matriceData.margeAppliquee}
                    onChange={(e) => updateMatriceField('margeAppliquee', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Encart Données (anciennement Matrice) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Données</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Montant investissement</Label>
                  <div className="flex items-center h-10 px-3 bg-muted rounded-md">
                    <span>{formatNumber(matriceData.montantInvestissement)} € HT</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Invest margé</Label>
                  <div className="flex items-center h-10 px-3 bg-muted rounded-md">
                    <span>{formatNumber(calculatedValues.investMarge)} € HT</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Services inclus loyers</Label>
                  <div className="flex items-center h-10 px-3 bg-muted rounded-md">
                    <span>{formatNumber(calculatedValues.servicesInclusLoyers)} €</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Loyer Services Inclus</Label>
                  <div className="flex items-center h-10 px-3 bg-muted rounded-md">
                    <span>{formatNumber(calculatedValues.loyerServicesInclus)} €</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Durée</Label>
                  <div className="flex items-center h-10 px-3 bg-muted rounded-md">
                    <span>{matriceData.duree ?? '-'} mois</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Coefficient</Label>
                  <div className="flex items-center h-10 px-3 bg-muted rounded-md">
                    <span>{calculatedValues.coefficient ?? '-'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Loyer mensuel HT</Label>
                  <div className="flex items-center h-10 px-3 bg-muted rounded-md">
                    <span className="font-medium">{formatNumber(calculatedValues.loyerMensuel)} €</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Coût locatif annuel</Label>
                    <Switch
                      checked={matriceData.showCoutLocatifAnnuel}
                      onCheckedChange={(checked) => updateMatriceField('showCoutLocatifAnnuel', checked)}
                    />
                  </div>
                  <div className="flex items-center h-10 px-3 bg-muted rounded-md">
                    <span className="font-medium">{formatPercent(calculatedValues.coutLocatifAnnuel)}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Coût du contrat</Label>
                  <div className="flex items-center h-10 px-3 bg-muted rounded-md">
                    <span>{formatNumber(calculatedValues.coutContrat)} €</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Marge Loc</Label>
                  <div className="flex items-center h-10 px-3 bg-muted rounded-md">
                    <span>{formatNumber(calculatedValues.margeLoc)} €</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Encart Condition fin de contrat */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Condition fin de contrat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  {matriceData.refinanceur ? (
                    <Badge 
                      variant={getConditionFinContrat(matriceData.refinanceur) === 'Reprise obligatoire loueur' ? 'destructive' : 'default'}
                      className="text-sm"
                    >
                      {getConditionFinContrat(matriceData.refinanceur) ?? 'Non définie'}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-sm">Sélectionnez un refinanceur</Badge>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Frais de dossier</Label>
                  <div className="flex items-center h-10 px-3 bg-muted rounded-md">
                    <span className="font-medium">{calculatedValues.fraisDossier ?? '-'} €</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Options Tab */}
        <TabsContent value="options" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Options services</CardTitle>
                <CardDescription>Services inclus dans le loyer</CardDescription>
              </div>
              <div className="flex gap-2">
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" disabled={activeAdminOptions.length === 0}>
                      <Download className="h-4 w-4 mr-2" />
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
              <div className="space-y-3">
                {optionsServices.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucune option service</p>
                ) : (
                  optionsServices.map((opt) => (
                    <div key={opt.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Switch checked={opt.selected} onCheckedChange={() => toggleOptionService(opt.id)} />
                      <Input
                        placeholder="Nom"
                        value={opt.name}
                        onChange={(e) => updateOptionService(opt.id, { name: e.target.value })}
                        className="flex-1"
                      />
                      <Input
                        placeholder="Description"
                        value={opt.description}
                        onChange={(e) => updateOptionService(opt.id, { description: e.target.value })}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Prix"
                        value={opt.price ?? ''}
                        onChange={(e) => updateOptionService(opt.id, { price: e.target.value ? parseFloat(e.target.value) : null })}
                        className="w-24"
                      />
                      <Button variant="ghost" size="icon" onClick={() => deleteOptionService(opt.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))
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
              <Button variant="outline" size="sm" onClick={addLigne}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Désignation</TableHead>
                      <TableHead className="w-24 text-right">Nb</TableHead>
                      <TableHead className="w-28 text-right">VUN</TableHead>
                      <TableHead className="w-28 text-right">VTN</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lignesData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Aucune ligne de produit
                        </TableCell>
                      </TableRow>
                    ) : (
                      lignesData.map((ligne, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Input
                              value={ligne.designation}
                              onChange={(e) => updateLigne(index, { designation: e.target.value })}
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={ligne.quantite}
                              onChange={(e) => updateLigne(index, { quantite: parseInt(e.target.value) || 1 })}
                              className="h-8 text-right"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={ligne.prixUnitaire ?? ''}
                              onChange={(e) => updateLigne(index, { prixUnitaire: e.target.value ? parseFloat(e.target.value) : null })}
                              className="h-8 text-right"
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatNumber(ligne.totalHT)} €
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteLigne(index)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
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
                    {BASE_TAUX_DATA.slice(0, 50).map((row, index) => (
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
                Affichage limité à 50 lignes. Total : {BASE_TAUX_DATA.length} entrées.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
