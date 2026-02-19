import { Bell, FileText, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { AdminNotification } from "@/hooks/useAdminNotifications";

interface AdminNotificationBellProps {
  notifications: AdminNotification[];
  unreadCount: number;
  onMarkAllAsRead: () => void;
  onMarkAsRead: (id: string) => void;
  onNavigateToHistory: (highlightedIds: string[]) => void;
}

export function AdminNotificationBell({
  notifications,
  unreadCount,
  onMarkAllAsRead,
  onMarkAsRead,
  onNavigateToHistory,
}: AdminNotificationBellProps) {
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMs / 3600000);

    if (diffMin < 1) return "À l'instant";
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    if (diffH < 24) return `Il y a ${diffH}h`;
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' }).format(date);
  };

  const handleNotificationClick = (notification: AdminNotification) => {
    onMarkAsRead(notification.id);
    onNavigateToHistory([notification.id]);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="right"
        className="w-80 p-0"
        sideOffset={8}
      >
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-muted-foreground hover:text-foreground px-2"
              onClick={onMarkAllAsRead}
            >
              Tout marquer lu
            </Button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="h-6 w-6 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-xs text-muted-foreground">Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => (
                <button
                  key={notif.id}
                  className={cn(
                    "w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors flex items-start gap-2.5",
                    !notif.isRead && "bg-primary/5"
                  )}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className={cn(
                    "mt-0.5 p-1.5 rounded-md shrink-0",
                    !notif.isRead ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    <FileText className="h-3 w-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate leading-tight">
                      {notif.proposal_name}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {notif.commercial_name && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <User className="h-2.5 w-2.5" />
                          {notif.commercial_name}
                        </span>
                      )}
                      {notif.client_name && (
                        <span className="text-[10px] text-muted-foreground">
                          {notif.commercial_name ? '· ' : ''}{notif.client_name}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatTime(notif.created_at)}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="border-t px-3 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-7 text-xs text-muted-foreground"
              onClick={() => onNavigateToHistory([])}
            >
              Voir tout l'historique
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
