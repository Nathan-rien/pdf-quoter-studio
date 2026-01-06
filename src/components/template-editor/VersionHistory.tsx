/**
 * Historique des versions du template
 * Affiche toutes les versions avec leur statut
 */

import type { TemplateVersion } from "@/types/template-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { 
  History, 
  Plus, 
  Eye, 
  Edit3, 
  Archive,
  CheckCircle,
  Clock,
  User
} from "lucide-react";

interface VersionHistoryProps {
  versions: TemplateVersion[];
  currentVersionId: string | null;
  onSelectVersion: (version: TemplateVersion) => void;
  onCreateVersion: () => void;
}

const STATUS_CONFIG = {
  brouillon: {
    label: 'Brouillon',
    variant: 'pending' as const,
    icon: Edit3,
    description: 'En cours de modification'
  },
  publie: {
    label: 'Publié',
    variant: 'success' as const,
    icon: CheckCircle,
    description: 'Disponible pour les devis'
  },
  archive: {
    label: 'Archivé',
    variant: 'secondary' as const,
    icon: Archive,
    description: 'Version obsolète'
  }
};

export function VersionHistory({ 
  versions, 
  currentVersionId, 
  onSelectVersion,
  onCreateVersion 
}: VersionHistoryProps) {
  // Trier par numéro de version décroissant
  const sortedVersions = [...versions].sort((a, b) => b.versionNumber - a.versionNumber);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5" />
          Historique des versions
        </CardTitle>
        <Button onClick={onCreateVersion} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle version
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-3">
            {sortedVersions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p>Aucune version disponible</p>
                <p className="text-sm">Créez une nouvelle version pour commencer.</p>
              </div>
            ) : (
              sortedVersions.map((version) => {
                const isSelected = version.id === currentVersionId;
                const statusConfig = STATUS_CONFIG[version.status];
                const StatusIcon = statusConfig.icon;

                return (
                  <Card
                    key={version.id}
                    variant={isSelected ? "selected" : "interactive"}
                    className={cn(
                      "cursor-pointer transition-all",
                      isSelected && "ring-2 ring-primary"
                    )}
                    onClick={() => onSelectVersion(version)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            version.status === 'publie' ? "bg-success/10 text-success" :
                            version.status === 'brouillon' ? "bg-warning/10 text-warning" :
                            "bg-muted text-muted-foreground"
                          )}>
                            <StatusIcon className="h-5 w-5" />
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">
                                Version {version.versionNumber}
                              </span>
                              <Badge variant={statusConfig.variant}>
                                {statusConfig.label}
                              </Badge>
                            </div>
                            
                            <p className="text-xs text-muted-foreground mb-2">
                              {statusConfig.description}
                            </p>
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {format(new Date(version.createdAt), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>{version.createdBy}</span>
                              </div>
                            </div>

                            {version.publishedAt && (
                              <div className="mt-2 text-xs">
                                <Badge variant="outline" className="gap-1">
                                  <CheckCircle className="h-3 w-3 text-success" />
                                  Publié le {format(new Date(version.publishedAt), "dd MMM yyyy", { locale: fr })}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectVersion(version);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {version.status === 'brouillon' ? 'Éditer' : 'Voir'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Statistiques */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-warning">
                {versions.filter(v => v.status === 'brouillon').length}
              </div>
              <div className="text-xs text-muted-foreground">Brouillons</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-success">
                {versions.filter(v => v.status === 'publie').length}
              </div>
              <div className="text-xs text-muted-foreground">Publiés</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-muted-foreground">
                {versions.filter(v => v.status === 'archive').length}
              </div>
              <div className="text-xs text-muted-foreground">Archivés</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
