import { useEffect, useState } from "react";
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
import { ContractsView } from "@/components/contracts/ContractsView";
import { ServiceProposalView } from "@/components/service-proposal/ServiceProposalView";
import { ServiceHistoryView } from "@/components/service-proposal/ServiceHistoryView";
import { ServiceContractsView } from "@/components/service-proposal/ServiceContractsView";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";
import { MesInfosView } from "@/components/commercial/MesInfosView";
import OptionsServicesAdmin from "@/pages/OptionsServicesAdmin";
import BaseTauxAdmin from "@/pages/BaseTauxAdmin";
import { GanttView } from "@/components/gantt/GanttView";
import { cn } from "@/lib/utils";
import cbproLogo from "@/assets/cbpro-logo.svg.asset.json";

export default function Index() {
  const [currentView, setCurrentView] = useState<ViewType>('rental-proposal');
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);
  const { isAdmin, isCommercial, userRole, signOut } = useAuth();
  const canAccessAdmin = userRole === 'admin';

  const { notifications, unreadCount, markAllAsRead, markAsRead } = useAdminNotifications(isAdmin);

  // Nettoyer le localStorage corrompu par l'ancien code ServiceProposalView
  // qui appelait loadFromExport sur rentalProposalStore.
  // Temporaire : peut être retiré après un cycle de déploiement.
  useEffect(() => {
    const stored = localStorage.getItem('rental-proposal-storage');
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      if (
        parsed?.state?.lignesData?.some((l: { designation?: string }) =>
          ['Produit 1', 'Produit 2', 'Produit 3'].includes(l.designation ?? '')
        )
      ) {
        const cleaned = {
          ...parsed,
          state: {
            ...parsed.state,
            lignesData: [],
            pdfImportStatus: { isImported: false, fileName: null, source: null, importDate: null },
          },
        };
        localStorage.setItem('rental-proposal-storage', JSON.stringify(cleaned));
        window.location.reload();
      }
    } catch {
      /* noop */
    }
  }, []);

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
      case 'contracts':
        return <ContractsView />;
      case 'service-proposal':
        return isAdmin ? <ServiceProposalView /> : null;
      case 'service-history':
        return isAdmin ? <ServiceHistoryView /> : null;
      case 'service-contracts':
        return isAdmin ? <ServiceContractsView /> : null;

      case 'history':
        return (
          <HistoryView
            isAdmin={isAdmin}
            highlightedIds={highlightedIds}
            onLoadProposal={(proposalState) => {
              useRentalProposalStore.getState().loadFromExport(proposalState);
              setCurrentView('rental-workflow');
            }}
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
        return <StatisticsDashboard onNavigateToHistory={handleNavigateToHistory} />;
      case 'gantt':
        return <GanttView />;
      case 'mes-infos':
        return <MesInfosView />;
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
        isCommercial={isCommercial}
        canAccessAdmin={canAccessAdmin}
        onSignOut={signOut}
      />

      <main className={cn("flex-1 p-3 lg:p-4", currentView === 'gantt' ? 'overflow-hidden flex flex-col' : 'overflow-auto')}>
        <div className="flex justify-end items-center gap-3 mb-2">
          {isAdmin && (
            <AdminNotificationBell
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAllAsRead={markAllAsRead}
              onMarkAsRead={markAsRead}
              onNavigateToHistory={handleNavigateToHistory}
            />
          )}
          <img
            src={cbproLogo.url}
            alt="CBpro"
            className="h-12 w-auto select-none"
            draggable={false}
          />
        </div>
        <div className={cn(
          "mx-auto",
          (currentView === 'template-editor' || currentView === 'gantt') ? "max-w-full" : "max-w-7xl"
        )}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
