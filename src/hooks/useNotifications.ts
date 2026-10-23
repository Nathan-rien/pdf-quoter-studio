import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

export type InterventionNotification = Tables<'notifications'>;
export function useNotifications(userId: string | undefined) {
  const qc = useQueryClient();
  const key = ['notifications', userId];
  const query = useQuery({
    queryKey: key, enabled: !!userId, refetchInterval: 15000,
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const mark = useMutation({
    mutationFn: async (id?: string) => {
      if (!userId) return;
      let request = supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
      if (id) request = request.eq('id', id);
      const { error } = await request;
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: () => toast.error('Lecture non enregistrée', { description: 'NOTIFICATION_READ — Impossible d’enregistrer la lecture. Réessayez.' }),
  });
  const notifications = query.data ?? [];
  return { notifications, unreadCount: notifications.filter(n => !n.is_read).length, error: query.error, markAsRead: (id: string) => mark.mutate(id), markAllAsRead: () => mark.mutate(undefined) };
}