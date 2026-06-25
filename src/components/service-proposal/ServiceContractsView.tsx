import { FileCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function ServiceContractsView() {
  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-lg font-semibold">Contrats Services</h2>
      <Card>
        <CardContent className="py-16">
          <div className="text-center space-y-4">
            <div className="p-4 rounded-full bg-muted inline-block">
              <FileCheck className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Fonctionnalité à venir — les contrats de services seront disponibles prochainement
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
