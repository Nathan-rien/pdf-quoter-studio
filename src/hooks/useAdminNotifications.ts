import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AdminNotification {
  id: string;
  commercial_name: string | null;
  proposal_name: string;
  client_name: string | null;
  created_at: string;
  isRead: boolean;
}

export function useAdminNotifications(isAdmin: boolean) {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    // S'abonner aux nouveaux exports en temps réel
    const channel = supabase
      .channel('admin-proposal-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'proposal_exports',
          filter: "status=eq.success",
        },
        (payload) => {
          const newRecord = payload.new as any;
          const notification: AdminNotification = {
            id: newRecord.id,
            commercial_name: newRecord.commercial_name || null,
            proposal_name: newRecord.proposal_name,
            client_name: newRecord.client_name || null,
            created_at: newRecord.created_at,
            isRead: false,
          };
          setNotifications(prev => [notification, ...prev].slice(0, 20));
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  return {
    notifications,
    unreadCount,
    markAllAsRead,
    markAsRead,
  };
}
