import { useState, useEffect } from "react";
import "../styles/loadingModal.css";

/**
Modal de carga con barra de progreso animada,
mensajes rotativos y efecto de partículas.

Props:
- isOpen (boolean): controla si el modal se muestra
- title (string): título del modal
 */
function LoadingModal({
    isOpen, 
    title = "cargando información",
}) {
    const [simulatedProgress, setSimulatedProgress] = useState(0); // Progreso simulado para animación

    // Simulación de progreso cuando no se pasa uno externo
    useEffect(() => {
        if (!isOpen) {
            setSimulatedProgress(0);
            return;
        }
        // Incrementa el progreso simulado cada 150ms, con un avance más lento a medida que se acerca al 90%
        const interval = setInterval(() => {
            setSimulatedProgress((prev) => {
                if (prev >= 90) {
                    clearInterval(interval);
                    return 90; // Se queda en 90% hasta que realmente termine
                }
                // Avance más lento conforme se acerca al final
                const increment = Math.max(0.5, (90 - prev) * 0.08); // Incremento dinámico basado en la distancia al 90%
                return Math.min(prev + increment, 90);
            });
        }, 150);

        return () => clearInterval(interval); // Limpia el intervalo al cerrar
    }, [isOpen]);


    // Reset al cerrar
    useEffect(() => {
        if (!isOpen) {
            setSimulatedProgress(0);
        }
    }, [isOpen]);

    //Si no esta abierto no renderiza nada
    if (!isOpen) return null;

    return (
        <div className="loading-overlay">
            <div className="loading-modal">
                {/* Icono animado */}
                <div className="loading-icon">
                    <div className="pulse-ring" />
                    <div className="pulse-ring delay" />
                    <svg viewBox="0 0 24 24" className="icon-svg" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
                        />
                    </svg>
                </div>

                {/* Título */}
                <h2 className="loading-title">{title}</h2>

                {/* Barra de progreso */}
                <div className="progress-wrapper">
                    <div className="progress-track">
                        <div
                            className="progress-fill"
                            style={{ width: `${simulatedProgress}%` }}
                        >
                            <div className="progress-glow" />
                        </div>
                    </div>
                    <span className="progress-percent">{Math.round(simulatedProgress)}%</span>
                </div>
            </div>
        </div>
    );
}

export default LoadingModal;