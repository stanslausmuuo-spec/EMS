import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from './ui/Button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || String(error) };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Uncaught error:', error, info);
  }

  componentDidUpdate(prevProps) {
    if (this.props.resetKey !== prevProps.resetKey && this.state.hasError) {
      this.setState({ hasError: false, message: '' });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="grain flex min-h-[70vh] flex-col items-center justify-center bg-canvas px-6 text-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/15 text-danger ring-1 ring-danger/30"
            aria-hidden="true"
          >
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-semibold tracking-display text-foreground">
            Something went wrong
          </h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            This section hit an unexpected error. The details were logged to your browser console.
          </p>
          {this.state.message && (
            <code className="mt-5 max-w-lg truncate rounded-xl border border-border bg-surface-1 px-3 py-2 font-mono text-xs text-danger">
              {this.state.message}
            </code>
          )}
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button onClick={() => window.location.reload()}>
              <RotateCcw className="h-4 w-4" /> Reload app
            </Button>
            <Button variant="secondary" onClick={() => this.setState({ hasError: false, message: '' })}>
              Try again
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}