import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Detect DOM manipulation errors and auto-clear cache
    const errorMessage = error.message || '';
    if (errorMessage.includes('removeChild') || 
        errorMessage.includes('appendChild') ||
        errorMessage.includes('insertBefore')) {
      console.warn('DOM manipulation error detected, clearing cache...');
      try {
        localStorage.removeItem('rental-proposal-storage');
        localStorage.removeItem('template-editor-storage');
        // NOTE: options-admin-storage is intentionally NOT cleared here
        // Options Services data is persisted in the database and must survive ErrorBoundary resets
      } catch (e) {
        console.error('Failed to clear storage after DOM error:', e);
      }
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearStorageAndReload = () => {
    try {
      // Clear potentially corrupted localStorage data
      localStorage.removeItem('rental-proposal-storage');
      localStorage.removeItem('template-editor-storage');
      localStorage.removeItem('options-admin-storage');
      localStorage.removeItem('data-editor-storage');
    } catch (e) {
      console.error('Failed to clear storage:', e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Une erreur s'est produite</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                L'application a rencontré un problème. Cela peut être dû à des données corrompues en cache.
              </p>
              
              {this.state.error && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-xs font-mono text-muted-foreground break-words">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              
              <div className="flex flex-col gap-2">
                <Button onClick={this.handleReload} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Rafraîchir la page
                </Button>
                <Button 
                  variant="outline" 
                  onClick={this.handleClearStorageAndReload}
                  className="w-full"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Effacer le cache et rafraîchir
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;