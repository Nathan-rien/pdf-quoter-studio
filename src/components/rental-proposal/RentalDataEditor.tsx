import React from 'react';
import { User, FileText, Package, Clock, Trash2, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRentalProposalStore } from '@/stores/rentalProposalStore';

export function RentalDataEditor() {
  const {
    clientData,
    devisData,
    commercialData,
    lignesData,
    locationData,
    totauxData,
    pdfImportStatus,
    updateClientField,
    updateDevisField,
    updateCommercialField,
    updateLocationField,
    updateLigne,
    addLigne,
    deleteLigne,
  } = useRentalProposalStore();

  const formatNumber = (value: number | null) => {
    if (value === null) return '';
    return value.toFixed(2);
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="client" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Client
          </TabsTrigger>
          <TabsTrigger value="devis" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Devis
          </TabsTrigger>
          <TabsTrigger value="produits" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Produits
            {lignesData.length > 0 && (
              <Badge variant="secondary" className="ml-1">{lignesData.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="location" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Location
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

        {/* Devis Tab */}
        <TabsContent value="devis" className="mt-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations devis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="devis-ref">Référence devis</Label>
                  <Input
                    id="devis-ref"
                    value={devisData.reference}
                    onChange={(e) => updateDevisField('reference', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="devis-client">N° Client</Label>
                  <Input
                    id="devis-client"
                    value={devisData.numeroClient}
                    onChange={(e) => updateDevisField('numeroClient', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="devis-date">Date</Label>
                    <Input
                      id="devis-date"
                      value={devisData.date}
                      onChange={(e) => updateDevisField('date', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="devis-validite">Validité</Label>
                    <Input
                      id="devis-validite"
                      value={devisData.validite}
                      onChange={(e) => updateDevisField('validite', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact commercial</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="commercial-nom">Nom</Label>
                  <Input
                    id="commercial-nom"
                    value={commercialData.nom}
                    onChange={(e) => updateCommercialField('nom', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commercial-email">Email</Label>
                  <Input
                    id="commercial-email"
                    type="email"
                    value={commercialData.email}
                    onChange={(e) => updateCommercialField('email', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Produits Tab */}
        <TabsContent value="produits" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Lignes de produits</CardTitle>
              <Button variant="outline" size="sm" onClick={addLigne}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une ligne
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Référence</TableHead>
                      <TableHead>Désignation</TableHead>
                      <TableHead className="w-[100px] text-right">Prix unit. HT</TableHead>
                      <TableHead className="w-[80px] text-right">Qté</TableHead>
                      <TableHead className="w-[120px] text-right">Total HT</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lignesData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Aucune ligne de produit
                        </TableCell>
                      </TableRow>
                    ) : (
                      lignesData.map((ligne, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Input
                              value={ligne.reference || ''}
                              onChange={(e) => updateLigne(index, { reference: e.target.value || null })}
                              className="h-8"
                            />
                          </TableCell>
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
                              step="0.01"
                              value={ligne.prixUnitaire ?? ''}
                              onChange={(e) => updateLigne(index, { 
                                prixUnitaire: e.target.value ? parseFloat(e.target.value) : null 
                              })}
                              className="h-8 text-right"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={ligne.quantite}
                              onChange={(e) => updateLigne(index, { 
                                quantite: parseInt(e.target.value) || 1 
                              })}
                              className="h-8 text-right"
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatNumber(ligne.totalHT)} €
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => deleteLigne(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Totaux */}
              {lignesData.length > 0 && (
                <div className="mt-4 flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total HT</span>
                      <span className="font-medium">
                        {formatNumber(totauxData.totalHT ?? lignesData.reduce((sum, l) => sum + l.totalHT, 0))} €
                      </span>
                    </div>
                    {totauxData.tva !== null && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">TVA (20%)</span>
                        <span>{formatNumber(totauxData.tva)} €</span>
                      </div>
                    )}
                    {totauxData.totalTTC !== null && (
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-medium">Total TTC</span>
                        <span className="font-bold">{formatNumber(totauxData.totalTTC)} €</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Location Tab */}
        <TabsContent value="location" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Conditions de location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location-duree">Durée (mois)</Label>
                  <Input
                    id="location-duree"
                    type="number"
                    min="1"
                    value={locationData.duree ?? ''}
                    onChange={(e) => updateLocationField('duree', e.target.value ? parseInt(e.target.value) : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location-loyer">Loyer mensuel HT (€)</Label>
                  <Input
                    id="location-loyer"
                    type="number"
                    step="0.01"
                    value={locationData.loyerMensuel ?? ''}
                    onChange={(e) => updateLocationField('loyerMensuel', e.target.value ? parseFloat(e.target.value) : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location-total">Montant total (€)</Label>
                  <Input
                    id="location-total"
                    type="number"
                    step="0.01"
                    value={locationData.montantTotal ?? ''}
                    onChange={(e) => updateLocationField('montantTotal', e.target.value ? parseFloat(e.target.value) : null)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
