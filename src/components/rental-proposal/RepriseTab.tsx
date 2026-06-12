import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AutoResizeTextarea } from '@/components/ui/auto-resize-textarea';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { useRentalProposalStore } from '@/stores/rentalProposalStore';
import { computeRepriseGrades } from '@/lib/reprise-calculations';

const formatNumber = (value: number | null) => {
  if (value === null || isNaN(value as number)) return '-';
  return (value as number).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export function RepriseTab() {
  const {
    repriseData,
    matriceData,
    updateMatriceField,
    addRepriseLigne,
    updateRepriseLigne,
    deleteRepriseLigne,
    reorderRepriseLigne,
    addRepriseSeparator,
    updateRepriseMarge,
    updateRepriseGrade,
    addRepriseDescription,
    updateRepriseDescription,
    deleteRepriseDescription,
  } = useRentalProposalStore();

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const computedGrades = useMemo(
    () => computeRepriseGrades(repriseData.grades, repriseData.marge),
    [repriseData.grades, repriseData.marge]
  );

  const grades = (['A', 'B', 'C', 'D'] as const);
  const margePercent = (repriseData.marge * 100).toFixed(0);

  return (
    <div className="space-y-4">
      {/* Bloc 1 - Lignes produits (Reprise) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Lignes produits (Reprise)</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="reprise-show-prices" className="text-sm text-muted-foreground">Afficher prix Investissement</Label>
              <Switch
                id="reprise-show-prices"
                checked={matriceData.repriseShowPrices}
                onCheckedChange={(c) => updateMatriceField('repriseShowPrices', c)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="reprise-show-offer" className="text-sm text-muted-foreground">Afficher montant Offre</Label>
              <Switch
                id="reprise-show-offer"
                checked={matriceData.repriseShowOffer}
                onCheckedChange={(c) => updateMatriceField('repriseShowOffer', c)}
              />
            </div>
            <Button variant="outline" size="sm" onClick={addRepriseLigne}>
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
                  <TableHead className="w-10" />
                  <TableHead className="min-w-[420px]">Désignation</TableHead>
                  <TableHead className="w-28 text-right">Nb</TableHead>
                  {matriceData.repriseShowPrices && (
                    <>
                      <TableHead className="w-36 text-right">VUN</TableHead>
                      <TableHead className="w-36 text-right">VTN</TableHead>
                    </>
                  )}
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {repriseData.lignes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={matriceData.repriseShowPrices ? 6 : 4} className="text-center text-muted-foreground py-8">
                      Aucune ligne de reprise
                    </TableCell>
                  </TableRow>
                ) : (
                  repriseData.lignes.map((ligne, index) => {
                    const colCount = matriceData.repriseShowPrices ? 6 : 4;
                    const insertButton = (atIndex: number) => (
                      <TableRow key={`sep-btn-${atIndex}`} className="group/separator border-0 hover:bg-transparent">
                        <TableCell colSpan={colCount} className="p-0 h-5 relative">
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/separator:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => addRepriseSeparator(atIndex)}
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
                            onDrop={() => { if (dragIndex !== null && dragIndex !== index) reorderRepriseLigne(dragIndex, index); setDragIndex(null); setDragOverIndex(null); }}
                            onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
                            className={`bg-blue-50 border-blue-100 ${dragIndex === index ? 'opacity-40' : ''} ${dragOverIndex === index && dragIndex !== index ? 'border-t-2 border-t-primary' : ''}`}
                          >
                            <TableCell className="w-10 cursor-grab active:cursor-grabbing px-1">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </TableCell>
                            <TableCell colSpan={colCount - 2}>
                              <AutoResizeTextarea
                                value={ligne.designation}
                                onChange={(e) => updateRepriseLigne(index, { designation: e.target.value })}
                                placeholder="Description de la section..."
                                className="min-h-[36px] bg-transparent border-blue-200 focus-visible:ring-blue-300"
                                rows={1}
                              />
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteRepriseLigne(index)}>
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
                          onDrop={() => { if (dragIndex !== null && dragIndex !== index) reorderRepriseLigne(dragIndex, index); setDragIndex(null); setDragOverIndex(null); }}
                          onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
                          className={`${dragIndex === index ? 'opacity-40' : ''} ${dragOverIndex === index && dragIndex !== index ? 'border-t-2 border-t-primary' : ''}`}
                        >
                          <TableCell className="w-10 cursor-grab active:cursor-grabbing px-1">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </TableCell>
                          <TableCell className="min-w-[420px] align-top">
                            <AutoResizeTextarea
                              value={ligne.designation}
                              onChange={(e) => updateRepriseLigne(index, { designation: e.target.value })}
                              className="min-h-[72px]"
                              rows={3}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={ligne.nb}
                              onChange={(e) => updateRepriseLigne(index, { nb: parseInt(e.target.value) || 0 })}
                              className="h-8 text-right w-full"
                            />
                          </TableCell>
                          {matriceData.repriseShowPrices && (
                            <>
                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={ligne.vun ?? ''}
                                  onChange={(e) => updateRepriseLigne(index, { vun: e.target.value ? parseFloat(e.target.value) : null })}
                                  className="h-8 text-right w-full"
                                />
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatNumber(ligne.vtn)} €
                              </TableCell>
                            </>
                          )}
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteRepriseLigne(index)}>
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
        </CardContent>
      </Card>

      {/* Bloc 2 - Grille de reprise par grade */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Grille de reprise par grade</CardTitle>
          <CardDescription>
            <div className="flex items-center gap-2 mt-1">
              <Label htmlFor="reprise-marge" className="text-sm">Marge</Label>
              <Input
                id="reprise-marge"
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={repriseData.marge}
                onChange={(e) => {
                  const v = e.target.value;
                  updateRepriseMarge(v === '' ? null : parseFloat(v));
                }}
                className={`w-28 h-8 ${!repriseData.margeIsOverridden ? 'text-muted-foreground bg-muted' : ''}`}
              />
              <span className={`text-sm ${!repriseData.margeIsOverridden ? 'text-muted-foreground' : ''}`}>
                ({margePercent}%)
              </span>
              {repriseData.margeIsOverridden && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateRepriseMarge(null)}
                  className="h-7 px-2 text-xs"
                >
                  Réinitialiser
                </Button>
              )}
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grade</TableHead>
                  {grades.map(g => (
                    <TableHead key={g} className="text-center">{g}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Prix partenaire</TableCell>
                  {grades.map(g => {
                    const row = repriseData.grades.find(r => r.grade === g)!;
                    return (
                      <TableCell key={g}>
                        <Input
                          type="number"
                          step="0.01"
                          value={row.prixPartenaire}
                          onChange={(e) => updateRepriseGrade(g, parseFloat(e.target.value) || 0)}
                          className="h-8 text-right"
                        />
                      </TableCell>
                    );
                  })}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Marge générée</TableCell>
                  {computedGrades.map(g => (
                    <TableCell key={g.grade} className="text-right text-muted-foreground bg-muted/30">
                      {formatNumber(g.margeGeneree)} €
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Bloc 3 - Synthèse reprise */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Synthèse reprise</CardTitle>
          <Button variant="outline" size="sm" onClick={addRepriseDescription}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-black hover:bg-black">
                  <TableHead className="text-white">Description</TableHead>
                  <TableHead className="text-white text-right w-28">Quantités</TableHead>
                  {grades.map(g => (
                    <TableHead key={g} className="text-white text-right w-28">{g}</TableHead>
                  ))}
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Total HT</TableCell>
                  <TableCell />
                  {computedGrades.map(g => (
                    <TableCell key={g.grade} className="text-right">{formatNumber(g.totalHT)} €</TableCell>
                  ))}
                  <TableCell />
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">TVA</TableCell>
                  <TableCell />
                  {computedGrades.map(g => (
                    <TableCell key={g.grade} className="text-right">{formatNumber(g.tva)} €</TableCell>
                  ))}
                  <TableCell />
                </TableRow>
                <TableRow className="bg-black hover:bg-black">
                  <TableCell className="font-bold text-white">Total TTC</TableCell>
                  <TableCell />
                  {computedGrades.map(g => (
                    <TableCell key={g.grade} className="text-right font-bold text-white">{formatNumber(g.totalTTC)} €</TableCell>
                  ))}
                  <TableCell />
                </TableRow>
                {repriseData.descriptions.map((d, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Input
                        value={d.description}
                        onChange={(e) => updateRepriseDescription(i, { description: e.target.value })}
                        placeholder="Description..."
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={d.quantite}
                        onChange={(e) => updateRepriseDescription(i, { quantite: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="h-8 text-right"
                      />
                    </TableCell>
                    {grades.map(g => (
                      <TableCell key={g} />
                    ))}
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteRepriseDescription(i)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Bloc 4 - Toggle d'affichage page PDF */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="show-cout-locatif-reprise" className="text-sm">Afficher coût locatif annuel</Label>
            <Switch
              id="show-cout-locatif-reprise"
              checked={matriceData.showCoutLocatifAnnuel}
              onCheckedChange={(c) => updateMatriceField('showCoutLocatifAnnuel', c)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
