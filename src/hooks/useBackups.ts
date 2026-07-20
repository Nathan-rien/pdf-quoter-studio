import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BackupRow {
  id: string;
  created_at: string;
  created_by: string | null;
  created_by_name: string | null;
  file_path: string;
  size_bytes: number;
  tables_count: number;
  rows_count: number;
  label: string | null;
  kind: string;
  restored_from: string | null;
}

export function useBackups() {
  return useQuery({
    queryKey: ['backups'],
    queryFn: async (): Promise<BackupRow[]> => {
      const { data, error } = await supabase
        .from('backups')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as BackupRow[];
    },
  });
}

export function useCreateBackup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('backup-export', { body: {} });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as { backup: BackupRow; download_url: string | null; manifest: any };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['backups'] }),
  });
}

export function useDownloadBackup() {
  return useMutation({
    mutationFn: async (filePath: string) => {
      const { data, error } = await supabase.storage
        .from('backups')
        .createSignedUrl(filePath, 300);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}

export function useRestoreBackup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { backup_id?: string; zip_base64?: string }) => {
      const { data, error } = await supabase.functions.invoke('backup-restore', {
        body: { ...args, confirm: 'REMPLACER' },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as { ok: true; report: Record<string, { deleted?: number; inserted?: number; error?: string }>; manifest: any };
    },
    onSuccess: () => {
      qc.invalidateQueries();
    },
  });
}

export function useDeleteBackup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (backup: BackupRow) => {
      await supabase.storage.from('backups').remove([backup.file_path]);
      const { error } = await supabase.from('backups').delete().eq('id', backup.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['backups'] }),
  });
}
