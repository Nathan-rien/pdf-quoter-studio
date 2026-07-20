import { useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Download, Loader2, RefreshCw, Save, Trash2, Upload, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import {
  BackupRow,
  useBackups,
  useCreateBackup,
  useDeleteBackup,
  useDownloadBackup,
  useRestoreBackup,
} from '@/hooks/useBackups';

function formatSize(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function BackupsView() {
  const { toast } = useToast();
  const { data: backups = [], isLoading, refetch } = useBackups();
  const createBackup = useCreateBackup();
  const restoreBackup = useRestoreBackup();
  const downloadBackup = useDownloadBackup();
  const deleteBackup = useDeleteBackup();

  const lastManualBackup = backups.find((b) => b.kind === 'manual');

  const [confirmText, setConfirmText] = useState('');
  const [restoreTarget, setRestoreTarget] = useState<BackupRow | null>(null);
  const [restoreFileMode, setRestoreFileMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const handleCreate = async () => {
    try {
      const res = await createBackup.mutateAsync();
      toast({ title: 'Sauvegarde créée', description: `${res.manifest.total_rows} lignes archivées.` });
      if (res.download_url) {
        window.open(res.download_url, '_blank');
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Échec de la sauvegarde', description: (e as Error).message });
    }
  };

  const handleDownload = async (b: BackupRow) => {
    try {
      const url = await downloadBackup.mutateAsync(b.file_path);
      window.open(url, '_blank');
    } catch (e) {
      toast({ variant: 'destructive', title: 'Téléchargement impossible', description: (e as Error).message });
    }
  };

  const handleRestoreConfirm = async () => {
    if (confirmText !== 'REMPLACER') return;
    try {
      if (restoreFileMode && pendingFile) {
        const b64 = await fileToBase64(pendingFile);
        await restoreBackup.mutateAsync({ zip_base64: b64 });
      } else if (restoreTarget) {
        await restoreBackup.mutateAsync({ backup_id: restoreTarget.id });
      }
      toast({ title: 'Restauration terminée', description: 'Les données ont été remplacées.' });
      setConfirmText('');
      setRestoreTarget(null);
      setRestoreFileMode(false);
      setPendingFile(null);
      refetch();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Échec de la restauration', description: (e as Error).message });
    }
  };

  const handleDelete = async (b: BackupRow) => {
    try {
      await deleteBackup.mutateAsync(b);
      toast({ title: 'Sauvegarde supprimée' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Suppression impossible', description: (e as Error).message });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Sauvegardes</h1>
        <p className="text-sm text-muted-foreground">
          Export et restauration de toutes les données métier de l'application.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Créer une sauvegarde</CardTitle>
          <CardDescription>
            {lastManualBackup ? (
              <>
                Dernière sauvegarde réalisée le{' '}
                <strong>
                  {format(parseISO(lastManualBackup.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                </strong>{' '}
                par {lastManualBackup.created_by_name ?? '—'} ({lastManualBackup.rows_count} lignes,{' '}
                {formatSize(lastManualBackup.size_bytes)})
              </>
            ) : (
              'Aucune sauvegarde n\'a encore été effectuée.'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={handleCreate} disabled={createBackup.isPending}>
            {createBackup.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Créer une sauvegarde
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setRestoreFileMode(true);
              fileInputRef.current?.click();
            }}
          >
            <Upload className="h-4 w-4 mr-2" />
            Restaurer depuis un fichier
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,application/zip"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setPendingFile(f);
              e.target.value = '';
            }}
          />
          <Button variant="ghost" size="icon" onClick={() => refetch()} title="Rafraîchir">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardContent className="pt-6 flex gap-3 items-start">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm space-y-1">
            <p className="font-medium">La restauration remplace toutes les données métier existantes.</p>
            <p className="text-muted-foreground">
              Comptes utilisateurs, mots de passe et pièces jointes (contract-attachments) ne sont pas inclus dans les
              sauvegardes.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Historique</CardTitle>
          <CardDescription>50 dernières sauvegardes et restaurations</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
            </div>
          ) : backups.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Aucune sauvegarde.</p>
          ) : (
            <div className="space-y-2">
              {backups.map((b) => (
                <div
                  key={b.id}
                  className="flex flex-wrap items-center gap-3 justify-between border border-border rounded-md p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant={b.kind === 'restore' ? 'destructive' : 'secondary'}>
                      {b.kind === 'restore' ? 'Restauration' : 'Sauvegarde'}
                    </Badge>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {format(parseISO(b.created_at), "d MMM yyyy HH:mm", { locale: fr })} — {b.created_by_name ?? '—'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {b.tables_count} tables · {b.rows_count} lignes · {formatSize(b.size_bytes)}
                        {b.label ? ` · ${b.label}` : ''}
                      </div>
                    </div>
                  </div>
                  {b.kind === 'manual' && (
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleDownload(b)}>
                        <Download className="h-4 w-4 mr-1" /> Télécharger
                      </Button>
                      <AlertDialog
                        onOpenChange={(open) => {
                          if (open) {
                            setRestoreTarget(b);
                            setRestoreFileMode(false);
                            setConfirmText('');
                          } else {
                            setRestoreTarget(null);
                            setConfirmText('');
                          }
                        }}
                      >
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="secondary">
                            Restaurer
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Restaurer cette sauvegarde ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette opération <strong>supprime toutes les données métier actuelles</strong> et les
                              remplace par le contenu du fichier du{' '}
                              {format(parseISO(b.created_at), "d MMM yyyy HH:mm", { locale: fr })}.
                              <br />
                              Pour confirmer, tapez <strong>REMPLACER</strong> ci-dessous.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="py-2">
                            <Label className="text-xs">Confirmation</Label>
                            <Input
                              value={confirmText}
                              onChange={(e) => setConfirmText(e.target.value)}
                              placeholder="Tapez REMPLACER"
                            />
                          </div>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              disabled={confirmText !== 'REMPLACER' || restoreBackup.isPending}
                              onClick={handleRestoreConfirm}
                            >
                              {restoreBackup.isPending ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : null}
                              Restaurer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer cette sauvegarde ?</AlertDialogTitle>
                            <AlertDialogDescription>Le fichier ZIP sera définitivement supprimé.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(b)}>Supprimer</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog restauration depuis fichier */}
      <AlertDialog
        open={restoreFileMode && !!pendingFile}
        onOpenChange={(open) => {
          if (!open) {
            setRestoreFileMode(false);
            setPendingFile(null);
            setConfirmText('');
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurer depuis un fichier ?</AlertDialogTitle>
            <AlertDialogDescription>
              Fichier sélectionné : <strong>{pendingFile?.name}</strong>. Cette opération remplace toutes les données
              métier actuelles. Tapez <strong>REMPLACER</strong> pour confirmer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label className="text-xs">Confirmation</Label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Tapez REMPLACER"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={confirmText !== 'REMPLACER' || restoreBackup.isPending}
              onClick={handleRestoreConfirm}
            >
              {restoreBackup.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Restaurer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
