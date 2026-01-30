

# Plan : Réparer le chargement de l'historique et ajouter la visualisation

## Probleme identifie

L'erreur de chargement est causee par un **timeout de la base de donnees**. Les logs PostgreSQL montrent :
```
canceling statement due to statement timeout
```

**Cause racine** : La requete actuelle utilise `SELECT *` qui inclut la colonne `pdf_html_content`. Chaque proposition stocke environ **3.3 Mo** de HTML. Avec 50 lignes, cela represente potentiellement **165 Mo** a charger, ce qui depasse le timeout de 8 secondes.

## Solution

### 1. Correction du chargement (timeout)

**Strategie** : Ne pas charger le contenu HTML lors du listing. Le charger uniquement a la demande (telechargement ou visualisation).

| Fichier | Modification |
|---------|--------------|
| `src/components/history/HistoryView.tsx` | Modifier `fetchExports()` pour selectionner uniquement les colonnes necessaires (exclure `pdf_html_content`) |

**Avant** :
```typescript
const { data, error: fetchError } = await supabase
  .from('proposal_exports')
  .select('*')  // Charge ~3.3 Mo par ligne
```

**Apres** :
```typescript
const { data, error: fetchError } = await supabase
  .from('proposal_exports')
  .select('id, proposal_name, file_name, client_name, template_name, status, row_count, options_count, created_at')
```

### 2. Fonctionnalite de visualisation

Ajouter un bouton "Visualiser" (icone oeil) a cote du bouton "Telecharger" pour chaque proposition.

**Comportement** :
- Clic sur Visualiser : charge le `pdf_html_content` uniquement pour cette proposition, puis ouvre un Dialog plein ecran avec un iframe affichant le HTML
- Clic sur Telecharger : charge le HTML puis ouvre la fenetre d'impression (comportement actuel)

| Fichier | Modification |
|---------|--------------|
| `src/components/history/HistoryView.tsx` | Ajouter bouton Visualiser, Dialog de visualisation, fonction de chargement a la demande |

### 3. Detail des modifications

#### Interface ProposalExport
```typescript
// Nouvelle interface pour les donnees de liste (sans HTML)
interface ProposalExportSummary {
  id: string;
  proposal_name: string;
  file_name: string;
  client_name: string | null;
  template_name: string;
  status: string;
  row_count: number;
  options_count: number;
  created_at: string;
}
```

#### Nouvelle fonction de chargement du contenu
```typescript
const fetchHtmlContent = async (id: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from('proposal_exports')
    .select('pdf_html_content')
    .eq('id', id)
    .single();
  
  if (error || !data) return null;
  return data.pdf_html_content;
};
```

#### Etats supplementaires
```typescript
const [previewingEntry, setPreviewingEntry] = useState<ProposalExportSummary | null>(null);
const [previewContent, setPreviewContent] = useState<string | null>(null);
const [loadingPreviewId, setLoadingPreviewId] = useState<string | null>(null);
```

#### Bouton Visualiser
```tsx
<Button 
  variant="ghost" 
  size="icon"
  className="h-8 w-8"
  onClick={() => handlePreview(entry)}
  disabled={loadingPreviewId === entry.id}
>
  {loadingPreviewId === entry.id ? (
    <Loader2 className="h-3.5 w-3.5 animate-spin" />
  ) : (
    <Eye className="h-3.5 w-3.5" />
  )}
</Button>
```

#### Dialog de visualisation
```tsx
<Dialog open={!!previewingEntry} onOpenChange={() => setPreviewingEntry(null)}>
  <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0">
    <DialogHeader className="p-4 border-b">
      <DialogTitle>{previewingEntry?.proposal_name}</DialogTitle>
    </DialogHeader>
    <div className="flex-1 overflow-hidden">
      {previewContent && (
        <iframe
          srcDoc={previewContent}
          className="w-full h-full border-0"
          title="Apercu de la proposition"
        />
      )}
    </div>
  </DialogContent>
</Dialog>
```

## Resume des changements

| Composant | Type | Description |
|-----------|------|-------------|
| `fetchExports()` | Correction | Select explicite sans `pdf_html_content` |
| `fetchHtmlContent()` | Ajout | Chargement du HTML a la demande |
| `handlePreview()` | Ajout | Ouvre la visualisation |
| `handleDownload()` | Modification | Charge le HTML avant d'ouvrir la fenetre d'impression |
| Dialog de visualisation | Ajout | Iframe plein ecran pour afficher le PDF HTML |
| Bouton Eye | Ajout | Icone "oeil" pour visualiser |

## Resultat attendu

| Avant | Apres |
|-------|-------|
| Erreur de timeout a chaque chargement | Chargement rapide (~100ms) de la liste |
| Seulement bouton Telecharger | Boutons Visualiser + Telecharger |
| Telechargement direct (parfois lent) | Chargement du HTML uniquement a la demande |

## Import a ajouter

```typescript
import { Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
```

