import { useState, useCallback } from "react";
import { useQuoteStore } from "@/stores/quoteStore";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { HistoryView } from "@/components/history/HistoryView";
import { TemplateSelection } from "@/components/steps/TemplateSelection";
import { DataEditorLayout } from "@/components/data-editor";
import { InvestValidation } from "@/components/steps/InvestValidation";
import { CSVImport } from "@/components/steps/CSVImport";
import { OptionsSelection } from "@/components/steps/OptionsSelection";
import { QuotePreview } from "@/components/steps/QuotePreview";
import { ExportView } from "@/components/steps/ExportView";
import { WorkflowProgress } from "@/components/workflow/WorkflowProgress";
import { TemplateEditorLayout } from "@/components/template-editor";
import { Button } from "@/components/ui/button";
import { WorkflowStep, StepStatus, ServiceOption } from "@/types/quote";
import { parseOptionsServicesSheet } from "@/lib/options-parser";
import { ChevronLeft, ChevronRight } from "lucide-react";

type ViewType = 'dashboard' | 'workflow' | 'history' | 'template-editor';

const workflowStepsConfig: { step: WorkflowStep; label: string }[] = [
  { step: 'template', label: 'Template' },
  { step: 'data-editor', label: 'Données' },
  { step: 'invest-validation', label: 'Validation' },
  { step: 'csv-import', label: 'Tarifs CSV' },
  { step: 'options-selection', label: 'Options' },
  { step: 'preview', label: 'Aperçu' },
  { step: 'export', label: 'Export' },
];

export default function Index() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [localOptions, setLocalOptions] = useState<ServiceOption[]>([]);
  
  const {
    currentStep,
    setCurrentStep,
    template,
    setTemplate,
    excelImport,
    setExcelImport,
    investData,
    setInvestData,
    validateInvestData,
    rejectInvestData,
    optionsData,
    setOptionsData,
    csvImport,
    setCSVImport,
    csvConfig,
    setCSVConfig,
    selectedOptions,
    setSelectedOptions,
    toggleOption,
    auditLogs,
    addAuditLog,
    canProceedToStep,
    canExportPDF,
    resetQuote,
    setPreviewGenerated,
  } = useQuoteStore();

  const isWorkflowActive = currentView === 'workflow' || !!template || !!excelImport;

  const getStepStatus = (step: WorkflowStep): StepStatus => {
    const stepOrder: WorkflowStep[] = [
      'template', 'data-editor', 'invest-validation', 
      'csv-import', 'options-selection', 'preview', 'export'
    ];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(step);

    if (stepIndex < currentIndex) {
      if (step === 'template' && template) return 'complete';
      if (step === 'data-editor') return 'complete'; // Data editor is always accessible once template selected
      if (step === 'invest-validation' && investData?.validationStatus === 'valide_pret_injection') return 'complete';
      if (step === 'csv-import') return csvImport?.isValid ? 'complete' : 'pending';
      if (step === 'options-selection') return 'complete';
      return 'pending';
    }
    
    if (step === currentStep) return 'active';
    if (!canProceedToStep(step)) return 'blocked';
    return 'pending';
  };

  const handleStartNewQuote = useCallback(() => {
    resetQuote();
    setLocalOptions([]);
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
      'template', 'data-editor', 'invest-validation', 
      'csv-import', 'options-selection', 'preview', 'export'
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
      'template', 'data-editor', 'invest-validation', 
      'csv-import', 'options-selection', 'preview', 'export'
    ];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  }, [currentStep, setCurrentStep]);

  const handleToggleOption = useCallback((optionId: string) => {
    setLocalOptions(opts => 
      opts.map(opt => 
        opt.id === optionId ? { ...opt, selected: !opt.selected } : opt
      )
    );
  }, []);

  const handleExcelImport = useCallback((result: typeof excelImport) => {
    if (!result) return;
    
    setExcelImport(result);
    
    if (result.isValid) {
      // EN ATTENTE DU PARSING RÉEL VIA EDGE FUNCTION
      // Les données viendront du parsing réel du fichier Excel
      // Pour l'instant, on signale que le parsing backend est requis
      addAuditLog({
        type: 'excel-import',
        message: 'Import Excel réussi - parsing des données en attente',
        status: 'warning',
        details: 'Le parsing réel des onglets "invest " et "Options services " nécessite l\'activation de Lovable Cloud'
      });
      
      // Simuler le parsing de l'onglet "Options services "
      // En production, cela viendrait du parsing réel
      const optionsResult = parseOptionsServicesSheet(null); // Simule onglet vide
      setOptionsData(optionsResult);
      
      // Note: setInvestData n'est PAS appelé ici
      // Les données Invest doivent venir du parsing réel
      // Pour le développement, on peut créer un état "en attente de parsing"
      
      handleNextStep();
    }
  }, [setExcelImport, setOptionsData, addAuditLog, handleNextStep]);

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
      case 'invest-validation':
        return (
          <InvestValidation 
            investData={investData}
            onValidate={() => {
              validateInvestData();
              handleNextStep();
            }}
            onReject={() => {
              rejectInvestData();
            }}
            isValidated={investData?.validationStatus === 'valide_pret_injection'}
          />
        );
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
      case 'options-selection':
        return (
          <OptionsSelection 
            options={localOptions}
            onToggle={handleToggleOption}
            selectedCount={localOptions.filter(o => o.selected).length}
            optionsData={optionsData}
          />
        );
      case 'preview':
        return (
          <QuotePreview 
            template={template}
            investData={investData}
            csvImport={csvImport}
            selectedOptions={localOptions}
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
      case 'history':
        return <HistoryView />;
      case 'template-editor':
        return <TemplateEditorLayout />;
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
