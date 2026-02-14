import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-100 text-center">
                    <div className="bg-white p-8 rounded-xl shadow-2xl max-w-lg w-full">
                        <h1 className="text-3xl font-bold text-red-600 mb-4">💥 Oups ! Une erreur est survenue.</h1>
                        <p className="text-gray-600 mb-6">L'application a rencontré un problème inattendu.</p>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left mb-6 overflow-auto max-h-60 font-mono text-xs">
                            <p className="text-red-800 font-bold mb-2">
                                {this.state.error && this.state.error.toString()}
                            </p>
                            <pre className="text-red-600 text-[10px]">
                                {this.state.errorInfo && this.state.errorInfo.componentStack}
                            </pre>
                        </div>
                        <button
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition w-full shadow-lg active:scale-95"
                            onClick={() => window.location.reload()}
                        >
                            🔄 ACTUALISER L'APPLICATION
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
