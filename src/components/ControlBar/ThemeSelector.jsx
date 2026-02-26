import { useState, useEffect } from "react";
import "../../styles/ThemeSelector.css";
import { IoColorPalette } from "react-icons/io5";
import { getCategories } from "../../services/categoriesService";
import { THEME_OPTIONS } from "./ThemeOptions";

// Temas disponibles, por Id, nombre y paleta según etiqueta de la materia (o tema)

// Componente selector de temas
export const ThemeSelector = ({ onThemeChange }) => {
    const [is_modal_open, set_is_modal_open] = useState(false);
    const [current_theme, set_current_theme] = useState("default");
    const [is_saved_anim, set_is_saved_anim] = useState(false);
    const [is_modal_closing, set_is_modal_closing] = useState(false);
    const [categories, set_categories] = useState([]); // Carga de categorias 

    const MODAL_CLOSE_DURATION = 150; // ms, debe coincidir con App.css

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
        if (onThemeChange) {
            onThemeChange(theme_id);
        }
    };

    // Obtener tema actual
    const current_theme_data = THEME_OPTIONS.find(
        (theme) => theme.id === current_theme
    );

    useEffect(() => {
        // Cargar categorías al subir el componente
        getCategories().then((data) => {
            set_categories(data);
        });
    }, []);

    return (
        <div className="themeSelectorContainer">
            <button
                className={`themeSelectorButton ${is_saved_anim ? "themeSaved" : ""}`}
                onClick={toggle_modal}
                aria-label="Selector de temas"
                type="button"
            >
                <IoColorPalette />
            </button>

            {
                is_modal_open && (
                    <div className={`themeModalOverlay ${is_modal_closing ? "hide" : "show"}`}
                        onClick={toggle_modal}
                    >
                        <div className="themeModal">
                            <h2>Paleta de temas</h2>
                            <div className="themeGrid">
                                {THEME_OPTIONS.map((theme) => (
                                    <button
                                        key={theme.id}
                                        className={`themeCard ${current_theme === theme.id ? "active" : ""}`}
                                        onClick={() => handle_theme_change(theme.id)}
                                        type="button"
                                    >
                                        <h3 className="themeTitle">{theme.name}</h3>
                                        <div className="themePreview">
                                            {categories.map((subject, index) => {
                                                const bgColor = theme.colors[index % theme.colors.length];
                                                const textColor = getContrastColor(bgColor);
                                                return (
                                                    <span
                                                        key={index}
                                                        className="subjectChip"
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
                            <button className="closeModal" onClick={toggle_modal}>Cerrar</button>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default ThemeSelector;