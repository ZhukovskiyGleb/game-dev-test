import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class CanvasErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 text-red-400 gap-3">
          <span className="text-4xl">⚠</span>
          <p className="font-semibold">Canvas error</p>
          <p className="text-xs text-gray-500 max-w-xs text-center break-all">
            {this.state.error.message}
          </p>
          <button
            className="mt-2 px-4 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
            onClick={() => this.setState({ error: null })}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
