import { useState, useCallback } from "react";
import { useQuoteStore } from "@/stores/quoteStore";
import { AppSidebar, ViewType } from "@/components/layout/AppSidebar";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { RentalProposalDashboard } from "@/components/dashboard/RentalProposalDashboard";
import { HistoryView } from "@/components/history/HistoryView";
import { TemplateSelection } from "@/components/steps/TemplateSelection";
import { DataEditorLayout } from "@/components/data-editor";
import { CSVImport } from "@/components/steps/CSVImport";
import { QuotePreview } from "@/components/steps/QuotePreview";
import { ExportView } from "@/components/steps/ExportView";
import { WorkflowProgress } from "@/components/workflow/WorkflowProgress";
import { TemplateEditorLayout } from "@/components/template-editor";
import OptionsServicesAdmin from "@/pages/OptionsServicesAdmin";
import { Button } from "@/components/ui/button";
import { WorkflowStep, StepStatus } from "@/types/quote";
import { ChevronLeft, ChevronRight } from "lucide-react";

// 5 étapes : Template → Données → Tarifs CSV → Aperçu → Export
const workflowStepsConfig: { step: WorkflowStep; label: string }[] = [
  { step: 'template', label: 'Template' },
  { step: 'data-editor', label: 'Données' },
  { step: 'csv-import', label: 'Tarifs CSV' },
  { step: 'preview', label: 'Aperçu' },
  { step: 'export', label: 'Export' },
];

export default function Index() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  
  const {
    currentStep,
    setCurrentStep,
    template,
    setTemplate,
    excelImport,
    setExcelImport,
    investData,
    csvImport,
    setCSVImport,
    csvConfig,
    setCSVConfig,
    auditLogs,
    addAuditLog,
    canProceedToStep,
    canExportPDF,
    resetQuote,
  } = useQuoteStore();

  const isWorkflowActive = currentView === 'workflow' || !!template || !!excelImport;

  const getStepStatus = (step: WorkflowStep): StepStatus => {
    const stepOrder: WorkflowStep[] = [
      'template', 'data-editor', 'csv-import', 'preview', 'export'
    ];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(step);

    if (stepIndex < currentIndex) {
      if (step === 'template' && template) return 'complete';
      if (step === 'data-editor') return 'complete';
      if (step === 'csv-import') return csvImport?.isValid ? 'complete' : 'pending';
      return 'pending';
    }
    
    if (step === currentStep) return 'active';
    if (!canProceedToStep(step)) return 'blocked';
    return 'pending';
  };

  const handleStartNewQuote = useCallback(() => {
    resetQuote();
    setCurrentStep('template');
    setCurrentView('workflow');
  }, [resetQuote, setCurrentStep]);

  const handleResumeQuote = useCallback(() => {
    setCurrentView('workflow');
  }, []);

  const handleStepNavigate = useCallback((step: WorkflowStep) => {
    if (canProceedToStep(step)) {
      setCurrentStep(step);
      setCurrentView('workflow');
    }
  }, [canProceedToStep, setCurrentStep]);

  const handleNextStep = useCallback(() => {
    const stepOrder: WorkflowStep[] = [
      'template', 'data-editor', 'csv-import', 'preview', 'export'
    ];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      const nextStep = stepOrder[currentIndex + 1];
      if (canProceedToStep(nextStep)) {
        setCurrentStep(nextStep);
      }
    }
  }, [currentStep, canProceedToStep, setCurrentStep]);

  const handlePrevStep = useCallback(() => {
    const stepOrder: WorkflowStep[] = [
      'template', 'data-editor', 'csv-import', 'preview', 'export'
    ];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  }, [currentStep, setCurrentStep]);

  const handleExcelImport = useCallback((result: typeof excelImport) => {
    if (!result) return;
    
    setExcelImport(result);
    
    if (result.isValid) {
      addAuditLog({
        type: 'excel-import',
        message: 'Import Excel réussi',
        status: 'success',
        details: `${result.sheets.length} onglets détectés`
      });
      
      handleNextStep();
    }
  }, [setExcelImport, addAuditLog, handleNextStep]);

  const handleExport = useCallback(async () => {
    if (!canExportPDF()) {
      addAuditLog({
        type: 'error',
        message: 'Export bloqué : données Invest non validées',
        status: 'blocked',
      });
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    addAuditLog({
      type: 'export',
      message: 'Devis exporté avec succès',
      status: 'success',
      details: 'Fichier PDF généré et prêt au téléchargement',
    });
  }, [addAuditLog, canExportPDF]);

  const renderWorkflowStep = () => {
    switch (currentStep) {
      case 'template':
        return (
          <TemplateSelection 
            onSelect={(t) => {
              setTemplate(t);
              handleNextStep();
            }}
            selectedTemplate={template}
          />
        );
      case 'data-editor':
        return <DataEditorLayout />;
      case 'csv-import':
        return (
          <CSVImport 
            onImport={(result) => {
              setCSVImport(result);
              if (result.isValid) {
                handleNextStep();
              }
            }}
            currentImport={csvImport}
            config={csvConfig}
            onConfigChange={setCSVConfig}
          />
        );
      case 'preview':
        return (
          <QuotePreview 
            template={template}
            investData={investData}
            csvImport={csvImport}
            selectedOptions={[]}
            onExport={() => setCurrentStep('export')}
          />
        );
      case 'export':
        return (
          <ExportView 
            isReady={canExportPDF()}
            auditLogs={auditLogs}
            onExport={handleExport}
          />
        );
      default:
        return null;
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            onNewQuote={handleStartNewQuote}
            onResumeQuote={handleResumeQuote}
            onViewHistory={() => setCurrentView('history')}
          />
        );
      case 'rental-proposal':
        return (
          <RentalProposalDashboard 
            onNewProposal={handleStartNewQuote}
            onResumeProposal={handleResumeQuote}
            onViewHistory={() => setCurrentView('history')}
          />
        );
      case 'history':
        return <HistoryView />;
      case 'template-editor':
        return <TemplateEditorLayout />;
      case 'options-admin':
        return <OptionsServicesAdmin />;
      case 'workflow':
        return (
          <div className="space-y-6">
            <WorkflowProgress
              steps={workflowStepsConfig.map(({ step, label }) => ({
                step,
                label,
                status: getStepStatus(step),
              }))}
              currentStep={currentStep}
              onStepClick={handleStepNavigate}
              canNavigateTo={canProceedToStep}
            />

            <div className="min-h-[400px]">
              {renderWorkflowStep()}
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-border">
              <Button
                variant="ghost"
                onClick={handlePrevStep}
                disabled={currentStep === 'template'}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>

              {currentStep !== 'export' && (
                <Button
                  variant="default"
                  onClick={handleNextStep}
                  disabled={!canProceedToStep(
                    workflowStepsConfig[
                      workflowStepsConfig.findIndex(s => s.step === currentStep) + 1
                    ]?.step as WorkflowStep
                  )}
                  className="gap-2"
                >
                  Suivant
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        currentView={currentView}
        currentStep={currentStep}
        onNavigate={setCurrentView}
        onStepNavigate={handleStepNavigate}
        canNavigateTo={canProceedToStep}
        isWorkflowActive={isWorkflowActive}
      />
      
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-5xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
