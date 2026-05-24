import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Layers } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[CRITICAL FRONTEND RENDER CRASH]', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleResetAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = window.location.origin + window.location.pathname;
    } catch (e) {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div id="react-boundary-crash-container" className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center select-none font-sans">
          <div className="max-w-xl bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/25 rounded-3xl flex items-center justify-center mx-auto text-amber-400">
              <AlertTriangle className="h-8 w-8 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-black text-white">Incident d'Affichage ERP AKPBF</h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                Une exception de rendu graphique a été interceptée par le bouclier React. Les bases de données d'Abidjan et les revenus comptables ne sont pas altérés.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-left overflow-x-auto max-h-40">
                <p className="text-[11px] font-mono text-amber-500 font-bold">Error: {this.state.error.toString()}</p>
                {this.state.errorInfo && (
                  <pre className="text-[10px] font-mono text-slate-500 mt-2 leading-tight">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="h-px bg-slate-850" />

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                Actualiser la page
              </button>
              <button
                type="button"
                onClick={this.handleResetAndReload}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-500/15 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Layers className="h-4 w-4" />
                Réinitialiser & Purger
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
