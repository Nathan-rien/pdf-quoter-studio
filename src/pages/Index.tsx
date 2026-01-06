import { useState, useCallback } from "react";
import { useQuoteStore } from "@/stores/quoteStore";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { HistoryView } from "@/components/history/HistoryView";
import { TemplateSelection } from "@/components/steps/TemplateSelection";
import { ExcelImport } from "@/components/steps/ExcelImport";
import { InvestValidation } from "@/components/steps/InvestValidation";
import { CSVImport } from "@/components/steps/CSVImport";
import { OptionsSelection } from "@/components/steps/OptionsSelection";
import { QuotePreview } from "@/components/steps/QuotePreview";
import { ExportView } from "@/components/steps/ExportView";
import { WorkflowProgress } from "@/components/workflow/WorkflowProgress";
import { Button } from "@/components/ui/button";
import { WorkflowStep, StepStatus, InvestData, ServiceOption } from "@/types/quote";
import { ChevronLeft, ChevronRight } from "lucide-react";

type ViewType = 'dashboard' | 'workflow' | 'history';

const workflowStepsConfig: { step: WorkflowStep; label: string }[] = [
  { step: 'template', label: 'Template' },
  { step: 'excel-import', label: 'Import Excel' },
  { step: 'invest-validation', label: 'Validation' },
  { step: 'csv-import', label: 'Tarifs CSV' },
  { step: 'options-selection', label: 'Options' },
  { step: 'preview', label: 'Aperçu' },
  { step: 'export', label: 'Export' },
];

// Mock service options
const initialOptions: ServiceOption[] = [
  { id: "opt-1", name: "Support Premium 24/7", description: "Assistance technique disponible 24h/24, 7j/7", price: 299, selected: false, category: "Support" },
  { id: "opt-2", name: "Formation avancée", description: "Formation approfondie de 2 jours pour les administrateurs", price: 1500, selected: false, category: "Formation" },
  { id: "opt-3", name: "Garantie étendue", description: "Extension de garantie de 2 ans supplémentaires", price: 450, selected: false, category: "Garantie" },
  { id: "opt-4", name: "Migration données", description: "Service de migration complète des données existantes", price: 800, selected: false, category: "Services" },
  { id: "opt-5", name: "Audit sécurité", description: "Audit de sécurité complet avec rapport détaillé", price: 1200, selected: false, category: "Sécurité" },
  { id: "opt-6", name: "Sauvegarde cloud", description: "Solution de sauvegarde automatique dans le cloud", price: 99, selected: false, category: "Infrastructure" },
];

export default function Index() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [localOptions, setLocalOptions] = useState<ServiceOption[]>(initialOptions);
  
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
    csvImport,
    setCSVImport,
    selectedOptions,
    setSelectedOptions,
    toggleOption,
    auditLogs,
    addAuditLog,
    canProceedToStep,
    resetQuote,
  } = useQuoteStore();

  const isWorkflowActive = currentView === 'workflow' || !!template || !!excelImport;

  const getStepStatus = (step: WorkflowStep): StepStatus => {
    const stepOrder: WorkflowStep[] = [
      'template', 'excel-import', 'invest-validation', 
      'csv-import', 'options-selection', 'preview', 'export'
    ];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(step);

    if (stepIndex < currentIndex) {
      // Check if prerequisites are met
      if (step === 'template' && template) return 'complete';
      if (step === 'excel-import' && excelImport?.isValid) return 'complete';
      if (step === 'invest-validation' && investData?.isValidated) return 'complete';
      if (step === 'csv-import' && csvImport?.isValid) return 'complete';
      if (step === 'options-selection') return 'complete';
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
      'template', 'excel-import', 'invest-validation', 
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
      'template', 'excel-import', 'invest-validation', 
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

  const handleExport = useCallback(async () => {
    // Simulate export
    await new Promise(resolve => setTimeout(resolve, 2000));
    addAuditLog({
      type: 'export',
      message: 'Devis exporté avec succès',
      status: 'success',
      details: 'Fichier PDF généré et prêt au téléchargement',
    });
  }, [addAuditLog]);

  // Mock invest data for validation step
  const mockInvestData: InvestData = {
    columns: ["Référence", "Désignation", "Quantité", "Prix unitaire", "Total"],
    rows: [
      { Référence: "INV-001", Désignation: "Installation serveur principal", Quantité: 1, "Prix unitaire": 2500, Total: 2500 },
      { Référence: "INV-002", Désignation: "Configuration réseau", Quantité: 1, "Prix unitaire": 1200, Total: 1200 },
      { Référence: "INV-003", Désignation: "Licences logicielles", Quantité: 10, "Prix unitaire": 150, Total: 1500 },
      { Référence: "INV-004", Désignation: "Formation utilisateurs", Quantité: 2, "Prix unitaire": 800, Total: 1600 },
      { Référence: "INV-005", Désignation: "Support technique", Quantité: 12, "Prix unitaire": 200, Total: 2400 },
    ],
    isValidated: investData?.isValidated || false,
    validationErrors: [],
  };

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
      case 'excel-import':
        return (
          <ExcelImport 
            onImport={(result) => {
              setExcelImport(result);
              if (result.isValid) {
                setInvestData(mockInvestData);
                handleNextStep();
              }
            }}
            currentImport={excelImport}
          />
        );
      case 'invest-validation':
        return (
          <InvestValidation 
            investData={investData || mockInvestData}
            onValidate={() => {
              validateInvestData();
              handleNextStep();
            }}
            isValidated={investData?.isValidated || false}
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
          />
        );
      case 'options-selection':
        return (
          <OptionsSelection 
            options={localOptions}
            onToggle={handleToggleOption}
            selectedCount={localOptions.filter(o => o.selected).length}
          />
        );
      case 'preview':
        return (
          <QuotePreview 
            template={template}
            investData={investData || mockInvestData}
            csvImport={csvImport}
            selectedOptions={localOptions}
            onExport={() => setCurrentStep('export')}
          />
        );
      case 'export':
        return (
          <ExportView 
            isReady={!!template && (investData?.isValidated || mockInvestData.isValidated)}
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
      case 'workflow':
        return (
          <div className="space-y-6">
            {/* Workflow progress */}
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

            {/* Step content */}
            <div className="min-h-[400px]">
              {renderWorkflowStep()}
            </div>

            {/* Navigation buttons */}
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
