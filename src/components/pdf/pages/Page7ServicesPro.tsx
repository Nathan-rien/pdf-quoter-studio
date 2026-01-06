/**
 * Page 7 - Les services CybertekPro
 * 100% STATIQUE - Aucune donnée dynamique
 */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, Recycle, Shield, Wrench, Truck, Settings, Repeat, BarChart3 } from "lucide-react";

export function Page7ServicesPro() {
  const services = [
    { icon: Recycle, title: "Reprise et Reconditionnement" },
    { icon: Shield, title: "CyberSécurité" },
    { icon: Wrench, title: "Intervention sur site" },
    { icon: Truck, title: "Logistique" },
    { icon: Settings, title: "Maintenance et garantie" },
    { icon: Wrench, title: "Services atelier" },
    { icon: Repeat, title: "Lease Back" },
    { icon: BarChart3, title: "Données RSE" }
  ];

  return (
    <Card className="border-muted">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Badge variant="outline" className="gap-1">
            <Lock className="h-3 w-3" />
            Statique
          </Badge>
          <span className="text-xs text-muted-foreground">Page 7/8</span>
        </div>

        <div className="aspect-[210/297] bg-muted/30 rounded-lg border-2 border-dashed border-muted p-6 overflow-hidden">
          <h3 className="text-lg font-bold mb-4">Les services CybertekPro</h3>

          <div className="grid grid-cols-2 gap-3">
            {services.map((service, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-background rounded-lg border">
                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                  <service.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-medium">{service.title}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-dashed flex items-center justify-center">
            <div className="text-xs text-muted-foreground">Footer CybertekPro</div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-3 text-center">
          Contenu fixe : 8 cartes de services
        </p>
      </CardContent>
    </Card>
  );
}
