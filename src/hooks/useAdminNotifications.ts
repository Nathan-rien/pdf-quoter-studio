import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AdminNotification {
  id: string;
  commercial_name: string | null;
  proposal_name: string;
  client_name: string | null;
  created_at: string;
  isRead: boolean;
}

const POLL_INTERVAL_MS = 30_000;

export function useAdminNotifications(isAdmin: boolean) {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastSeenAtRef = useRef<string>(new Date().toISOString());

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

    let cancelled = false;

    const poll = async () => {
      const since = lastSeenAtRef.current;
      const { data, error } = await supabase
        .from('proposal_exports')
        .select('id, commercial_name, proposal_name, client_name, created_at, status')
        .eq('status', 'success')
        .gt('created_at', since)
        .order('created_at', { ascending: false })
        .limit(20);

      if (cancelled || error || !data || data.length === 0) return;

      lastSeenAtRef.current = data[0].created_at;
      const newNotifications: AdminNotification[] = data.map((row: any) => ({
        id: row.id,
        commercial_name: row.commercial_name || null,
        proposal_name: row.proposal_name,
        client_name: row.client_name || null,
        created_at: row.created_at,
        isRead: false,
      }));

      setNotifications(prev => [...newNotifications, ...prev].slice(0, 20));
      setUnreadCount(prev => prev + newNotifications.length);
    };

    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isAdmin]);

  return {
    notifications,
    unreadCount,
    markAllAsRead,
    markAsRead,
  };
}
