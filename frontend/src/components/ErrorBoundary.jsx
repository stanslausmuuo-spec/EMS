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

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/15 text-danger">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h1 className="mt-5 font-display text-2xl font-bold text-foreground">Something went wrong</h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            The app hit an unexpected error. The details were logged to your browser console.
          </p>
          {this.state.message && (
            <code className="mt-4 max-w-lg truncate rounded-lg border border-border bg-card px-3 py-2 text-xs text-danger">
              {this.state.message}
            </code>
          )}
          <Button className="mt-6" onClick={() => window.location.reload()}>
            <RotateCcw className="h-4 w-4" /> Reload app
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}