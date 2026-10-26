import { Component } from "react";
import "./ErrorBoundary.css";

/**
 * Captura errores de renderizado y muestra una pantalla de recuperación.
 * No captura errores asíncronos ni de manejadores de eventos: esos siguen
 * manejándose en cada flujo.
 */
export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        console.error("[ErrorBoundary] Error de renderizado:", error, info?.componentStack);
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.hash = "#/";
        this.setState({ error: null });
    };

    render() {
        const { error } = this.state;
        if (!error) return this.props.children;

        return (
            <div className="error-boundary" role="alert" aria-live="assertive">
                <div className="error-boundary-card">
                    <h1 className="error-boundary-title" tabIndex={-1}>
                        Algo salió mal
                    </h1>
                    <p className="error-boundary-message">
                        Ocurrió un error inesperado al mostrar esta pantalla. Puedes
                        recargar la página o volver al inicio.
                    </p>
                    <div className="error-boundary-actions">
                        <button
                            type="button"
                            className="error-boundary-button error-boundary-button--primary"
                            onClick={this.handleReload}
                        >
                            Recargar página
                        </button>
                        <button
                            type="button"
                            className="error-boundary-button"
                            onClick={this.handleGoHome}
                        >
                            Volver al inicio
                        </button>
                    </div>
                    {import.meta.env.DEV && (
                        <pre className="error-boundary-detail" aria-label="Detalle técnico">
                            {String(error?.stack || error?.message || error)}
                        </pre>
                    )}
                </div>
            </div>
        );
    }
}
