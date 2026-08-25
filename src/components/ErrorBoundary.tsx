import React, { Component } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Aequitas Protocol Uncaught App Error:', error, errorInfo);
  }

  private handleReload = () => {
    localStorage.removeItem('stocklens_wallet_mode');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] text-slate-200 flex flex-col items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full glass-panel border border-white/10 p-6 rounded-2xl shadow-2xl space-y-5 text-center">
            
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Application Render Notice</h2>
              <p className="text-xs text-slate-400 mt-1">
                Aequitas Protocol encountered an unexpected state while rendering onchain data.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-left font-mono text-[11px] text-rose-300 break-all max-h-32 overflow-y-auto">
                {this.state.error.toString()}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#ADF802] hover:bg-[#9ee002] text-black text-xs font-bold transition-all shadow-lg shadow-[#ADF802]/15 flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="flex-1 py-2.5 px-4 rounded-xl glass-panel hover:bg-white/10 text-white text-xs font-bold transition-all"
              >
                Try Recovering
              </button>
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
