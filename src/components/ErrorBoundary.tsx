import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  autoRecoveryAttempted: boolean;
}

/**
 * ErrorBoundary global.
 *
 * Politique stricte : nous n'effaçons JAMAIS automatiquement
 * `rental-proposal-storage` ni `template-editor-storage`.
 * Les erreurs `removeChild` / `insertBefore` proviennent quasi-systématiquement
 * d'extensions ou de traducteurs navigateurs qui mutent le DOM hors du contrôle
 * de React — ce n'est PAS une corruption du cache.
 *
 * Comportement :
 * - 1ère erreur : tentative de récupération silencieuse (re-render).
 * - Si l'erreur persiste : écran de secours, bouton "Rafraîchir" (sûr) et
 *   bouton "Réinitialiser" derrière une confirmation explicite.
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    autoRecoveryAttempted: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorMessage = error.message || '';
    const isDomMutationError =
      errorMessage.includes('removeChild') ||
      errorMessage.includes('appendChild') ||
      errorMessage.includes('insertBefore') ||
      errorMessage.includes('The node to be removed') ||
      errorMessage.includes('The node before which the new node');

    if (isDomMutationError) {
      console.warn(
        '[ErrorBoundary] Mutation DOM externe détectée (extension/traducteur navigateur). ' +
          'Récupération silencieuse, données utilisateur préservées.'
      );
      // Récupération silencieuse : on ne montre PAS l'écran d'erreur.
      // Le DOM guard de main.tsx empêche normalement ces erreurs d'arriver
      // jusqu'ici, ceci reste un filet de sécurité.
      setTimeout(() => {
        this.setState({
          hasError: false,
          error: null,
          autoRecoveryAttempted: true,
        });
      }, 0);
      return;
    }

    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleHardReset = () => {
    try {
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
                L'application a rencontré un problème. <strong>Vos données ne sont pas perdues</strong> — un simple rafraîchissement devrait suffire à les retrouver.
              </p>

              <p className="text-xs text-muted-foreground text-center">
                Astuce : si vous utilisez un traducteur de navigateur (Edge, Google Translate…), désactivez-le sur ce site pour éviter ce problème.
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

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Réinitialiser (perte des données non sauvegardées)
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Réinitialiser l'application ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action supprimera <strong>tous vos brouillons en cours</strong> (proposition, template en édition, options…) stockés localement dans votre navigateur. Les propositions déjà enregistrées dans l'historique ne sont pas concernées.
                        <br /><br />
                        À n'utiliser que si "Rafraîchir la page" ne résout pas le problème.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={this.handleHardReset}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Oui, tout réinitialiser
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
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
