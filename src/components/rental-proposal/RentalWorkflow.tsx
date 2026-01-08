import React from 'react';
import { FileUp, Table, Eye, Download, Check, ChevronRight, ChevronLeft, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PDFImportZone } from '@/components/data-editor/PDFImportZone';
import { RentalDataEditor } from './RentalDataEditor';
import { RentalProposalPreview } from './RentalProposalPreview';
import { TemplateListView } from '@/components/template-editor/TemplateListView';
import { useRentalProposalStore, RentalWorkflowStep } from '@/stores/rentalProposalStore';
import { cn } from '@/lib/utils';

interface WorkflowStepConfig {
  id: RentalWorkflowStep;
  label: string;
  icon: React.ElementType;
}

const WORKFLOW_STEPS: WorkflowStepConfig[] = [
  { id: 'import', label: 'Import PDF', icon: FileUp },
  { id: 'data', label: 'Données', icon: Table },
  { id: 'template', label: 'Template', icon: FileText },
  { id: 'preview', label: 'Aperçu', icon: Eye },
  { id: 'export', label: 'Export', icon: Download },
];

export function RentalWorkflow() {
  const {
    currentStep,
    pdfImportStatus,
    lignesData,
    hasUnsavedChanges,
    setCurrentStep,
    canNavigateToStep,
    importFromPDF,
    markAsSaved,
  } = useRentalProposalStore();

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
    switch (currentStep) {
      case 'import':
        return (
          <div className="space-y-6">
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
        return <RentalDataEditor />;

      case 'template':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Sélection du template</CardTitle>
              <CardDescription>
                Choisissez le template à utiliser pour générer la proposition.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TemplateListView />
            </CardContent>
          </Card>
        );

      case 'preview':
        return <RentalProposalPreview />;

      case 'export':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Exporter la proposition</CardTitle>
              <CardDescription>
                Générez et téléchargez le document final.
              </CardDescription>
            </CardHeader>
            <CardContent className="min-h-[300px] flex items-center justify-center">
              <div className="text-center space-y-4">
                <Download className="h-12 w-12 mx-auto text-primary" />
                <p className="font-medium">Proposition prête à l'export</p>
                <Button size="lg">
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger le PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
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
                  'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
                  status === 'active' && 'bg-primary text-primary-foreground',
                  status === 'complete' && 'bg-success/10 text-success hover:bg-success/20 cursor-pointer',
                  status === 'pending' && 'bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer',
                  status === 'blocked' && 'bg-muted/50 text-muted-foreground/50 cursor-not-allowed'
                )}
              >
                {status === 'complete' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                <span className="font-medium hidden sm:inline">{step.label}</span>
                {status === 'active' && hasUnsavedChanges && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    Non sauvegardé
                  </Badge>
                )}
              </button>
              
              {index < WORKFLOW_STEPS.length - 1 && (
                <div className={cn(
                  'flex-1 h-0.5 mx-2',
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
      <div className="flex items-center justify-between pt-4 border-t">
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
