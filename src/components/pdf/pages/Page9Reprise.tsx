/**
 * Page 9 - Reprise matériel
 * DYNAMIQUE - Affichée uniquement si matriceData.showCoutLocatifAnnuel === true
 */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table as TableIcon } from "lucide-react";
import type { RepriseData } from "@/stores/rentalProposalStore";
import type { RepriseGradeComputed } from "@/lib/reprise-calculations";

interface Page9RepriseProps {
  repriseData: RepriseData;
  computedGrades: RepriseGradeComputed[];
}

const formatNumber = (value: number) =>
  value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function Page9Reprise({ repriseData, computedGrades }: Page9RepriseProps) {
  return (
    <Card className="border-2 border-primary">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Badge variant="success" className="gap-1">
            <TableIcon className="h-3 w-3" />
            Dynamique
          </Badge>
          <span className="text-xs text-muted-foreground">Page 9</span>
        </div>

        <div className="aspect-[210/297] bg-background rounded-lg border-2 border-dashed border-muted p-6 overflow-hidden">
          <h3 className="text-lg font-bold mb-4">Synthèse reprise</h3>

          <div className="overflow-hidden rounded-md border">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-black text-white">
                  <th className="text-left p-2">Description</th>
                  <th className="text-right p-2 w-20">Quantités</th>
                  <th className="text-right p-2 w-20">A</th>
                  <th className="text-right p-2 w-20">B</th>
                  <th className="text-right p-2 w-20">C</th>
                  <th className="text-right p-2 w-20">D</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2 font-medium">Total HT</td>
                  <td />
                  {computedGrades.map((g) => (
                    <td key={g.grade} className="text-right p-2">{formatNumber(g.totalHT)} €</td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">TVA</td>
                  <td />
                  {computedGrades.map((g) => (
                    <td key={g.grade} className="text-right p-2">{formatNumber(g.tva)} €</td>
                  ))}
                </tr>
                <tr className="bg-black text-white font-bold">
                  <td className="p-2">Total TTC</td>
                  <td />
                  {computedGrades.map((g) => (
                    <td key={g.grade} className="text-right p-2">{formatNumber(g.totalTTC)} €</td>
                  ))}
                </tr>
                {repriseData.descriptions.map((d, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-2">{d.description || '—'}</td>
                    <td className="text-right p-2">{d.quantite}</td>
                    <td /><td /><td /><td />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
