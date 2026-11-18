import React from 'react';

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F3F5F2] dark:bg-[#0D111A] p-6">
          <div className="pixel-panel max-w-md w-full rounded-lg bg-white dark:bg-slate-900 border-slate-900 dark:border-slate-600 p-6">
            <h2 className="font-pixel text-base text-rose-600 dark:text-rose-400">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 break-words">
              {this.state.errorMessage || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, errorMessage: '' });
                window.location.reload();
              }}
              className="pixel-btn mt-4 rounded bg-rose-600 px-4 py-2 text-xs font-semibold text-white border-slate-900"
            >
              Reload Game
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
