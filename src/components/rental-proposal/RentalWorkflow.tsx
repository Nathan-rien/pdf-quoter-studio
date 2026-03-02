import React, { useEffect, useMemo } from 'react';
import { FileUp, Table, Eye, Download, Check, ChevronRight, ChevronLeft, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PDFImportZone } from '@/components/data-editor/PDFImportZone';
import { RentalDataEditor } from './RentalDataEditor';
import { RentalProposalPreview } from './RentalProposalPreview';
import { RentalProposalExport } from './RentalProposalExport';
import { TemplateSelector } from './TemplateSelector';
import { useRentalProposalStore, RentalWorkflowStep } from '@/stores/rentalProposalStore';
import { useAuth } from '@/hooks/useAuth';
import { useCommercialIdentity } from '@/hooks/useCommercialIdentity';
import { CommercialEntity } from '@/data/commerciaux';
import { cn } from '@/lib/utils';

interface WorkflowStepConfig {
  id: RentalWorkflowStep;
  label: string;
  icon: React.ElementType;
}

const ALL_WORKFLOW_STEPS: WorkflowStepConfig[] = [
  { id: 'import', label: 'Import PDF', icon: FileUp },
  { id: 'data', label: 'Données', icon: Table },
  { id: 'template', label: 'Template', icon: FileText },
  { id: 'preview', label: 'Aperçu', icon: Eye },
  { id: 'export', label: 'Export', icon: Download },
];

const ENTITY_TEMPLATE_MAP: Record<CommercialEntity, string> = {
  'cybertek-pro': 'fd0e078b-0000-4000-8000-000000000000',
  'grosbill-pro': 'f153bcea-1770-4021-8446-177002144623',
};

const SOURCE_TEMPLATE_MAP: Record<string, string> = {
  'dental': '1bc823c7-1771-4939-8179-177193917944',
};

export function RentalWorkflow() {
  const { isAdmin, isCommercial } = useAuth();
  const { commercial } = useCommercialIdentity();

  const {
    currentStep,
    pdfImportStatus,
    lignesData,
    hasUnsavedChanges,
    setCurrentStep,
    canNavigateToStep,
    importFromPDF,
    markAsSaved,
    selectTemplateForProposal,
    selectedTemplateId,
  } = useRentalProposalStore();

  // Auto-select template based on commercial entity
  const entityTemplateId = commercial?.entity ? ENTITY_TEMPLATE_MAP[commercial.entity] : null;
  // Auto-select template based on PDF source (e.g. dental)
  const sourceTemplateId = pdfImportStatus.source ? SOURCE_TEMPLATE_MAP[pdfImportStatus.source] ?? null : null;
  // Resolved auto template: entity takes priority, then source
  const autoTemplateId = entityTemplateId || sourceTemplateId;

  const skipTemplateStep = !isAdmin && !!autoTemplateId;

  useEffect(() => {
    if (skipTemplateStep && autoTemplateId) {
      selectTemplateForProposal(autoTemplateId);
    }
  }, [skipTemplateStep, autoTemplateId, selectTemplateForProposal]);

  const WORKFLOW_STEPS = useMemo(
    () => skipTemplateStep ? ALL_WORKFLOW_STEPS.filter(s => s.id !== 'template') : ALL_WORKFLOW_STEPS,
    [skipTemplateStep]
  );

  const currentStepIndex = WORKFLOW_STEPS.findIndex(s => s.id === currentStep);

  const getStepStatus = (step: WorkflowStepConfig, index: number): 'complete' | 'active' | 'pending' | 'blocked' => {
    if (step.id === currentStep) return 'active';
    if (index < currentStepIndex) return 'complete';
    if (canNavigateToStep(step.id)) return 'pending';
    return 'blocked';
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < WORKFLOW_STEPS.length) {
      const nextStep = WORKFLOW_STEPS[nextIndex];
      if (canNavigateToStep(nextStep.id)) {
        setCurrentStep(nextStep.id);
      }
    }
  };

  const handlePrevious = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(WORKFLOW_STEPS[prevIndex].id);
    }
  };

  const handleSave = () => {
    markAsSaved();
  };

  const renderStepContent = () => {
    // Key unique par étape pour forcer un remontage propre
    switch (currentStep) {
      case 'import':
        return (
          <div key="step-import" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Importer un devis PDF</CardTitle>
                <CardDescription>
                  Importez un devis Cybertek Pro ou GrosBill Pro pour pré-remplir les données de la proposition.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PDFImportZone
                  onImportSuccess={importFromPDF}
                  currentFile={pdfImportStatus.fileName}
                />
              </CardContent>
            </Card>
          </div>
        );

      case 'data':
        return <RentalDataEditor key="step-data" />;

      case 'template':
        return <TemplateSelector key="step-template" />;

      case 'preview':
        return <RentalProposalPreview key="step-preview" />;

      case 'export':
        return <RentalProposalExport key="step-export" />;

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center justify-between">
        {WORKFLOW_STEPS.map((step, index) => {
          const status = getStepStatus(step, index);
          const Icon = step.icon;
          
          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => canNavigateToStep(step.id) && setCurrentStep(step.id)}
                disabled={!canNavigateToStep(step.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-sm',
                  status === 'active' && 'bg-primary text-primary-foreground',
                  status === 'complete' && 'bg-success/10 text-success hover:bg-success/20 cursor-pointer',
                  status === 'pending' && 'bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer',
                  status === 'blocked' && 'bg-muted/50 text-muted-foreground/50 cursor-not-allowed'
                )}
              >
                {status === 'complete' ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
                <span className="font-medium hidden sm:inline">{step.label}</span>
                {status === 'active' && hasUnsavedChanges && (
                  <Badge variant="secondary" className="ml-1 text-[10px]">
                    Non sauvegardé
                  </Badge>
                )}
              </button>
              
              {index < WORKFLOW_STEPS.length - 1 && (
                <div className={cn(
                  'flex-1 h-0.5 mx-1.5',
                  index < currentStepIndex ? 'bg-success' : 'bg-muted'
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step content */}
      {renderStepContent()}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between pt-3 border-t">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStepIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Précédent
        </Button>

        <div className="flex items-center gap-2">
          {currentStep === 'data' && hasUnsavedChanges && (
            <Button variant="secondary" onClick={handleSave}>
              Sauvegarder
            </Button>
          )}
          
          <Button
            onClick={handleNext}
            disabled={currentStepIndex === WORKFLOW_STEPS.length - 1 || !canNavigateToStep(WORKFLOW_STEPS[currentStepIndex + 1]?.id)}
          >
            Suivant
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
