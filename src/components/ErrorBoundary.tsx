import { Component, type ErrorInfo, type ReactNode } from 'react';
import { LOGO_GLYPH } from '@/constants';

interface Props {
  children: ReactNode;
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

    return (
      <div className="flex items-center justify-center h-screen w-screen bg-[var(--bg-outer)] p-4">
        <div className="glass glow-lg rounded-2xl p-8 max-w-md w-full text-center space-y-5">
          <span className="text-7xl block glow-text">{LOGO_GLYPH}</span>
          <h2 className="text-xl font-bold font-[var(--font-display)] text-[var(--text-primary)]">
            حدث خطأ غير متوقع
          </h2>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            {this.state.error?.message ?? 'An unexpected error occurred in Wazeer OS.'}
          </p>
          <button
            onClick={this.handleRetry}
            className="px-6 py-2.5 rounded-lg bg-[var(--accent-500)] text-[var(--bg-outer)] font-semibold text-sm hover:brightness-110 transition-all cursor-pointer"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }
}
