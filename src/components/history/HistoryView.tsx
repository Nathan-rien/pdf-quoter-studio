import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  History as HistoryIcon, 
  FileText, 
  Download, 
  Calendar,
  Clock,
  Check,
  AlertTriangle
} from "lucide-react";

interface HistoryEntry {
  id: string;
  fileName: string;
  createdAt: Date;
  template: string;
  status: 'success' | 'error';
  rowCount: number;
  optionsCount: number;
}

// Mock history data
const mockHistory: HistoryEntry[] = [
  {
    id: "exp-001",
    fileName: "Devis_Client_ABC_2024-01-15.pdf",
    createdAt: new Date("2024-01-15T14:30:00"),
    template: "Devis Standard",
    status: 'success',
    rowCount: 42,
    optionsCount: 3,
  },
  {
    id: "exp-002",
    fileName: "Devis_Projet_XYZ_2024-01-12.pdf",
    createdAt: new Date("2024-01-12T09:15:00"),
    template: "Devis Standard",
    status: 'success',
    rowCount: 28,
    optionsCount: 5,
  },
  {
    id: "exp-003",
    fileName: "Devis_Demo_2024-01-10.pdf",
    createdAt: new Date("2024-01-10T16:45:00"),
    template: "Devis Compact",
    status: 'error',
    rowCount: 0,
    optionsCount: 0,
  },
];

interface HistoryViewProps {
  onSelectEntry?: (entry: HistoryEntry) => void;
}

export function HistoryView({ onSelectEntry }: HistoryViewProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(date);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h2 className="text-lg font-semibold mb-1">Historique des exports</h2>
        <p className="text-muted-foreground text-sm">
          Consultez et téléchargez les devis générés précédemment.
        </p>
      </div>

      {mockHistory.length > 0 ? (
        <div className="space-y-3">
          {mockHistory.map((entry) => (
            <Card 
              key={entry.id}
              variant="interactive"
              className="group"
            >
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    entry.status === 'success' 
                      ? 'bg-success/10 text-success' 
                      : 'bg-destructive/10 text-destructive'
                  }`}>
                    {entry.status === 'success' ? (
                      <FileText className="h-5 w-5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-medium text-sm truncate">{entry.fileName}</h3>
                      <Badge variant={entry.status === 'success' ? 'success' : 'error'} className="text-xs">
                        {entry.status === 'success' ? 'Succès' : 'Erreur'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(entry.createdAt)}
                      </span>
                      <span>Template: {entry.template}</span>
                    </div>
                    
                    {entry.status === 'success' && (
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span>{entry.rowCount} lignes Invest</span>
                        <span>{entry.optionsCount} options</span>
                      </div>
                    )}
                  </div>

                  {entry.status === 'success' && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <div className="p-3 rounded-full bg-muted inline-block mb-3">
                <HistoryIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-sm mb-1">Aucun historique</h3>
              <p className="text-xs text-muted-foreground">
                Les devis exportés apparaîtront ici.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
