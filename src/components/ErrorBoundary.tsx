import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Catches JavaScript errors thrown during render anywhere in the component
// tree below it, so a bug in one screen shows a recoverable message instead
// of a blank white page for the whole app.
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Unhandled render error:', error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="max-w-sm w-full bg-white border border-slate-200 rounded-lg shadow-sm p-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                Something Went Wrong
              </h1>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                The app hit an unexpected error and couldn't continue. Your data is safe — reloading usually
                fixes this.
              </p>
            </div>
            <button
              onClick={this.handleReload}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-md transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
