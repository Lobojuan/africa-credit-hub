import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack?: string | null }) {
    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary]", error, errorInfo?.componentStack);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;
      return (
        <div className="flex items-center justify-center min-h-[50vh] p-6">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7 text-destructive" />
            </div>
            <h2 className="text-lg font-bold" data-testid="text-error-title">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">
              {this.props.fallbackMessage || "An unexpected error occurred while loading this page."}
            </p>
            {this.state.error && (
              <p className="text-xs text-muted-foreground/70 font-mono bg-muted rounded-md p-2 break-all" data-testid="text-error-detail">
                {isDev ? this.state.error.message : "Please try refreshing the page or contact support."}
              </p>
            )}
            <div className="flex gap-3 justify-center pt-2">
              <Button onClick={this.handleRetry} data-testid="button-retry">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button variant="outline" onClick={() => window.location.href = "/dashboard"} data-testid="button-go-home">
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
