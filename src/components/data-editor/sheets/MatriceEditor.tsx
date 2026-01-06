import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, Construction } from "lucide-react";

export function MatriceEditor() {
  return (
    <div className="space-y-4">
      <Card className="bg-muted/30 border-dashed">
        <CardHeader className="py-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <CardTitle className="text-sm font-medium">Structure de l'onglet "Matrice"</CardTitle>
              <CardDescription className="text-xs">
                Cet onglet contient la matrice de configuration. La structure exacte sera définie lors de l'import du fichier Excel source.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <Construction className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Structure en attente</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            La structure de l'onglet "Matrice" sera ajoutée une fois que le fichier Excel source sera fourni pour définir les colonnes exactes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
