import { useState } from "react";
import { useRentalProposalStore } from "@/stores/rentalProposalStore";
import { useAuth } from "@/hooks/useAuth";
import { AppSidebar, ViewType } from "@/components/layout/AppSidebar";
import { RentalProposalDashboard } from "@/components/dashboard/RentalProposalDashboard";
import { HistoryView } from "@/components/history/HistoryView";
import { TemplateEditorLayout } from "@/components/template-editor";
import { RentalWorkflow } from "@/components/rental-proposal/RentalWorkflow";
import { AccessManagement } from "@/components/access/AccessManagement";
import { StatisticsDashboard } from "@/components/admin/StatisticsDashboard";
import { AdminNotificationBell } from "@/components/admin/AdminNotificationBell";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";
import OptionsServicesAdmin from "@/pages/OptionsServicesAdmin";
import BaseTauxAdmin from "@/pages/BaseTauxAdmin";
import { cn } from "@/lib/utils";

export default function Index() {
  const [currentView, setCurrentView] = useState<ViewType>('rental-proposal');
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);
  const { isAdmin, userRole, signOut } = useAuth();
  const canAccessAdmin = userRole === 'admin';

  const { notifications, unreadCount, markAllAsRead, markAsRead } = useAdminNotifications(isAdmin);

  const handleNavigateToHistory = (ids: string[]) => {
    setHighlightedIds(ids);
    setCurrentView('history');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'rental-proposal':
        return (
          <RentalProposalDashboard
            onNewProposal={() => {
              useRentalProposalStore.getState().startNewProposal();
              setCurrentView('rental-workflow');
            }}
            onResumeProposal={() => setCurrentView('rental-workflow')}
            onViewHistory={() => setCurrentView('history')}
          />
        );
      case 'rental-workflow':
        return <RentalWorkflow />;
      case 'history':
        return (
          <HistoryView
            isAdmin={isAdmin}
            highlightedIds={highlightedIds}
          />
        );
      case 'template-editor':
        return <TemplateEditorLayout />;
      case 'options-admin':
        return <OptionsServicesAdmin />;
      case 'base-taux-admin':
        return <BaseTauxAdmin />;
      case 'access-management':
        return <AccessManagement />;
      case 'statistics':
        return <StatisticsDashboard />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        currentView={currentView}
        onNavigate={(view) => {
          if (view !== 'history') setHighlightedIds([]);
          setCurrentView(view);
        }}
        isAdmin={isAdmin}
        canAccessAdmin={canAccessAdmin}
        onSignOut={signOut}
      />

      <main className="flex-1 p-3 lg:p-4 overflow-auto">
        {isAdmin && (
          <div className="flex justify-end mb-2">
            <AdminNotificationBell
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAllAsRead={markAllAsRead}
              onMarkAsRead={markAsRead}
              onNavigateToHistory={handleNavigateToHistory}
            />
          </div>
        )}
        <div className={cn(
          "mx-auto",
          currentView === 'template-editor' ? "max-w-full" : "max-w-7xl"
        )}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
