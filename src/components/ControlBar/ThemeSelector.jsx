import { useState } from "react";
import "../../styles/ThemeSelector.css";
import { IoColorPalette } from "react-icons/io5";

// Temas disponibles, por Id, nombre y paleta según etiqueta de la materia (o tema)

// Componente selector de temas
export const ThemeSelector = ({ on_theme_change }) => {
    const [is_modal_open, set_is_modal_open] = useState(false);
    const [current_theme, set_current_theme] = useState("default");
    const [is_saved_anim, set_is_saved_anim] = useState(false);
    const [is_modal_closing, set_is_modal_closing] = useState(false);

    const MODAL_CLOSE_DURATION = 150; // ms, debe coincidir con App.css

    // Opciones de temas disponibles
    const THEME_OPTIONS = [
        {
            id: "palette01",
            name: "Lavanda",
            colors: ["#2a1b3f", "#4B2E83", "#7a4fa3", "#7d2b9b", "#C77BB6", "#E7B3CF", "#F6E8C3"]
        },
        {
            id: "palette02",
            name: "Cyber Neón",
            colors: ["#975ACF", "#201D30", "#ED7843", "#8EDF5F", "#5649B5", "#E2D2E0", "#dcd32b"]
        },
        {
            id: "palette03",
            name: "Sunrise Forest",
            colors: ["#000000", "#1F3B1F", "#3F2B2F", "#01762e", "#F2B705", "#C79200", "#E6E6E6"]
        },
        {
            id: "palette04",
            name: "Ejecutivo",
            colors: ["#3e78b2", "#004BA8", "#1c395d", "#9494ee", "#4A525A", "#24272B", "#07070A"]
        },
        {
            id: "palette05",
            name: "Cafeteria Retro",
            colors: ["#8c7c80", "#D4ADB0", "#C2A59D", "#DDC8B7", "#EBDBD9", "#BEBEBC", "#f4d7ce"]
        },
        {
            id: "palette06",
            name: "Sunlight Nature",
            colors: ["#d8b45a", "#f0e966", "#4FA3D9", "#3F5B3C", "#6B4A2B", "#C8B89A", "#6E8FAF"]
        },
        {
            id: "palette07",
            name: "Magma profundo",
            colors: ["#040505", "#14161C", "#45130E", "#AA2C1A", "#F64617", "#d16319", "#954d00"]
        },
        {
            id: "palette08",
            name: "Aire",
            colors: ["#648E99", "#AFC2C0", "#9DDCE1", "#B996C8", "#8184A7", "#f5d9d9", "#9ae2ee"]
        },
        {
            id: "palette09",
            name: "Tierra",
            colors: ["#642D1A", "#985B0A", "#DFB174", "#D5ED9F", "#425B07", "#7AB444", "#0ad27f"]
        },
        {
            id: "palette10",
            name: "Agua",
            colors: ["#011A47", "#124487", "#07A3E1", "#6AA2FF", "#79E2F8", "#1BAAB6", "#aca0f1"]
        },
        {
            id: "palette11",
            name: "Fuego",
            colors: ["#750006", "#D96D00", "#FFE76B", "#FFBA56", "#CF4128", "#FEC798", "#db8d48"]
        },
        {
            id: "palette12",
            name: "Candy Shop",
            colors: ["#353D6D", "#726EA2", "#8A80BD", "#D47F84", "#C86185", "#FBD271", "#b78ddc"]
        },
    ];


    // Calcular el color de letra para cada tema según su paleta, usando la función de contraste para asegurar legibilidad
    const getContrastColor = (hex) => {
        const r = parseInt(hex.substr(1, 2), 16);
        const g = parseInt(hex.substr(3, 2), 16);
        const b = parseInt(hex.substr(5, 2), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5 ? "#000000" : "#FFFFFF";
    };

    // Alternar visibilidad del desplegable
    const toggle_modal = () => {
        if (is_modal_open) {
            // Activar animación de cierre
            set_is_modal_closing(true);
            window.setTimeout(() => {
                set_is_modal_open(false);
                set_is_modal_closing(false);
            }, MODAL_CLOSE_DURATION);
        } else {
            set_is_modal_open(true);
        }
    };

    // Manejar cambio de tema
    const handle_theme_change = (theme_id) => {
        const ANIM_DURATION = 150; // ms
        set_current_theme(theme_id);

        // Cerrar modal con animación
        set_is_modal_closing(true);
        window.setTimeout(() => {
            set_is_modal_open(false);
            set_is_modal_closing(false);
        }, MODAL_CLOSE_DURATION);

        // Reinicia/reproduce la animación de guardado en el botón
        set_is_saved_anim(false);
        // Asegurarnos que React aplique el cambio antes de activar la animación
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                set_is_saved_anim(true);
                window.setTimeout(() => set_is_saved_anim(false), ANIM_DURATION);
            });
        });

        // Notificar al componente padre
        if (on_theme_change) {
            on_theme_change(theme_id);
        }
    };

    // Obtener tema actual
    const current_theme_data = THEME_OPTIONS.find(
        (theme) => theme.id === current_theme
    );

    return (
        <div className="theme-selector-container">
            <button
                className={`theme-selector-button ${is_saved_anim ? "theme-saved" : ""}`}
                onClick={toggle_modal}
                aria-label="Selector de temas"
                type="button"
            >
                <IoColorPalette/>
            </button>

            {
                is_modal_open && (
                    <div className={`theme-modal-overlay ${is_modal_closing ? "hide" : "show"}`}
                        onClick={toggle_modal}
                    >
                        <div className="theme-modal">
                            <h2>Paleta de temas</h2>
                            <div className="theme-grid">
                                {THEME_OPTIONS.map((theme) => (
                                    <button
                                        key={theme.id}
                                        className={`theme-card ${current_theme === theme.id ? "active" : ""}`}
                                        onClick={() => handle_theme_change(theme.id)}
                                        type="button"
                                    >
                                        <h3 className="theme-title">{theme.name}</h3>
                                        <div className="theme-preview">
                                            {["Teoría", "Pastoral", "Deportiva", "Centro de Lenguas", "Personal", "Cultural", "Laboratorio"].map(
                                                (subject, index) => {
                                                    const bgColor = theme.colors[index % theme.colors.length];
                                                    const textColor = getContrastColor(bgColor);
                                                    return (
                                                        <span
                                                            key={index}
                                                            className="subject-chip"
                                                            style={{ backgroundColor: bgColor, color: textColor }}
                                                        >
                                                            {subject}
                                                        </span>
                                                    );
                                                }
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <button className="close-modal" onClick={toggle_modal}>Cerrar</button>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default ThemeSelector;