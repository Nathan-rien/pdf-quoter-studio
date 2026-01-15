import { useState } from "react";
import { useRentalProposalStore } from "@/stores/rentalProposalStore";
import { AppSidebar, ViewType } from "@/components/layout/AppSidebar";
import { RentalProposalDashboard } from "@/components/dashboard/RentalProposalDashboard";
import { HistoryView } from "@/components/history/HistoryView";
import { TemplateEditorLayout } from "@/components/template-editor";
import { RentalWorkflow } from "@/components/rental-proposal/RentalWorkflow";
import OptionsServicesAdmin from "@/pages/OptionsServicesAdmin";
import BaseTauxAdmin from "@/pages/BaseTauxAdmin";
import { cn } from "@/lib/utils";

export default function Index() {
  const [currentView, setCurrentView] = useState<ViewType>('rental-proposal');

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
        return <HistoryView />;
      case 'template-editor':
        return <TemplateEditorLayout />;
      case 'options-admin':
        return <OptionsServicesAdmin />;
      case 'base-taux-admin':
        return <BaseTauxAdmin />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        currentView={currentView}
        onNavigate={setCurrentView}
      />
      
      <main className="flex-1 p-3 lg:p-4 overflow-auto">
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
