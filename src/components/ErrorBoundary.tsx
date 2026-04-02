import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: (error: Error) => ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("[ErrorBoundary] Caught render error:", error);
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback(this.state.error);
      return (
        <div className="p-6 rounded border border-destructive bg-destructive/10 text-destructive space-y-2">
          <p className="font-semibold">Erro ao renderizar a página</p>
          <p className="text-sm font-mono break-all">{this.state.error.message}</p>
          <p className="text-xs text-muted-foreground">Veja o console do browser para mais detalhes.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
