import { Component, type ErrorInfo, type ReactNode } from 'react';
import { LOGO_GLYPH } from '@/constants';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  title?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Wazeer OS] ErrorBoundary caught:', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <div className="flex items-center justify-center h-full min-h-[200px] w-full bg-[var(--bg-outer)] p-4">
        <div className="glass glow-lg rounded-2xl p-6 max-w-md w-full text-center space-y-4">
          <span className="text-5xl block glow-text">{LOGO_GLYPH}</span>
          <h2 className="text-lg font-bold font-[var(--font-display)] text-[var(--text-primary)]">
            {this.props.title ?? 'حدث خطأ في هذا الجزء'}
          </h2>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed font-mono">
            {this.state.error?.message ?? 'An unexpected error occurred in this component.'}
          </p>
          <button
            onClick={this.handleRetry}
            className="px-5 py-2 rounded-lg bg-[var(--accent-500)] text-[var(--bg-outer)] font-semibold text-xs hover:brightness-110 transition-all cursor-pointer shadow-md"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }
}
