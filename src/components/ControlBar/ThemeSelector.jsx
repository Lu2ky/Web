import { useState, useEffect } from "react";
import "../../styles/ThemeSelector.css";
import { IoColorPalette } from "react-icons/io5";
import { getCategories } from "../../services/categoriesService";
import { getColorPalette, saveColorPalette } from "../../services/colorService";
import { THEME_OPTIONS } from "./ThemeOptions";

// Temas disponibles, por Id, nombre y paleta según etiqueta de la materia (o tema)
const THEME_CACHE_PREFIX = "theme-palette-cache";

// Componente selector de temas
export const ThemeSelector = ({ userId, onThemeChange }) => {
    const [is_modal_open, set_is_modal_open] = useState(false);
    const [current_theme, set_current_theme] = useState("default");
    const [is_saved_anim, set_is_saved_anim] = useState(false);
    const [is_modal_closing, set_is_modal_closing] = useState(false);
    const [categories, set_categories] = useState([]); // Carga de categorias 

    const MODAL_CLOSE_DURATION = 150; // ms, debe coincidir con App.css

    const resolveThemeId = (paletteValue) => {
        const value = String(paletteValue || "").trim();
        if (!value) return null;

        const byId = THEME_OPTIONS.find((theme) => theme.id === value);
        if (byId) return byId.id;

        const lowered = value.toLowerCase();
        const byName = THEME_OPTIONS.find((theme) => String(theme.name || "").toLowerCase() === lowered);
        return byName ? byName.id : null;
    };

    const getCacheKey = (id) => `${THEME_CACHE_PREFIX}:${id || "anonymous"}`;

    const readCachedThemeId = (id) => {
        try {
            const cached = localStorage.getItem(getCacheKey(id));
            return resolveThemeId(cached);
        } catch {
            return null;
        }
    };

    const writeCachedThemeId = (id, themeId) => {
        if (!themeId) return;
        try {
            localStorage.setItem(getCacheKey(id), themeId);
        } catch {
            // Ignorar errores de almacenamiento local
        }
    };

    const unwrapApiScalar = (value) => {
        if (value == null) return value;
        if (typeof value !== "object") return value;
        if (value.Valid === false) return null;
        if (value.String != null) return value.String;
        if (value.value != null) return value.value;
        return value;
    };

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
            window.dispatchEvent(new CustomEvent("onboarding:theme-selector-opened"));
        }
    };

    // Manejar cambio de tema
    const handle_theme_change = (theme_id) => {
        const ANIM_DURATION = 150; // ms
        set_current_theme(theme_id);
        writeCachedThemeId(userId, theme_id);

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

        // Guardar el tema en la API si hay userId
        if (userId) {
            const selectedTheme = THEME_OPTIONS.find((theme) => theme.id === theme_id);
            const paletteToSave = selectedTheme?.name || theme_id;

            saveColorPalette(userId, paletteToSave)
                .then((result) => {
                    console.log("[ThemeSelector] Color palette saved:", result);
                })
                .catch((error) => {
                    console.error("[ThemeSelector] Error saving color palette:", error);
                });
        }

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
        let is_mounted = true;

        // Cargar categorías al subir el componente y evitar rechazos no controlados
        getCategories()
            .then((data) => {
                if (is_mounted) {
                    set_categories(Array.isArray(data) ? data : []);
                }
            })
            .catch(() => {
                if (is_mounted) {
                    set_categories([]);
                }
            });

        return () => {
            is_mounted = false;
        };
    }, []);

    // Cargar paleta de colores guardada del usuario
    useEffect(() => {
        let is_mounted = true;

        // Aplicar cache
        const cachedThemeId = readCachedThemeId(userId);
        if (cachedThemeId && THEME_OPTIONS.find((theme) => theme.id === cachedThemeId)) {
            set_current_theme(cachedThemeId);
            if (onThemeChange) {
                onThemeChange(cachedThemeId);
            }
        }

        if (userId) {
            // Cargar la paleta guardada del usuario
            getColorPalette(userId)
                .then((palette) => {
                    if (is_mounted && palette) {
                        // Soporta respuestas como string, { palette }, { data: { palette } }, y estructuras legacy.
                        const paletteValue =
                            (typeof palette === "string" ? palette : null) ||
                            unwrapApiScalar(palette.palette) ||
                            unwrapApiScalar(palette?.data?.palette) ||
                            unwrapApiScalar(palette.id) ||
                            palette.paletteId ||
                            palette.themeName;

                        const paletteId = resolveThemeId(paletteValue);
                        
                        // Verificar que el ID existe en THEME_OPTIONS
                        if (paletteId && THEME_OPTIONS.find(t => t.id === paletteId)) {
                            set_current_theme(paletteId);
                            writeCachedThemeId(userId, paletteId);
                            if (onThemeChange) {
                                onThemeChange(paletteId);
                            }
                            console.log("[ThemeSelector] Loaded saved palette:", paletteId);
                        }
                    }
                })
                .catch((error) => {
                    console.log("[ThemeSelector] Could not load saved palette (expected on first load):", error);
                });
        }

        return () => {
            is_mounted = false;
        };
    }, [userId]);

    useEffect(() => {
        const handleCloseUnrelatedUi = (event) => {
            const allowOpenUi = Array.isArray(event?.detail?.allowOpenUi) ? event.detail.allowOpenUi : [];
            if (!allowOpenUi.includes("modal-theme-selector")) {
                set_is_modal_open(false);
                set_is_modal_closing(false);
            }
        };

        window.addEventListener("onboarding:close-unrelated-ui", handleCloseUnrelatedUi);
        return () => window.removeEventListener("onboarding:close-unrelated-ui", handleCloseUnrelatedUi);
    }, []);

    return (
        <div className="themeSelectorContainer">
            <button
                className={`themeSelectorButton ${is_saved_anim ? "themeSaved" : ""}`}
                onClick={toggle_modal}
                aria-label="Selector de temas"
                title="Selector de temas"
                type="button"
                data-onboarding-id="theme-selector-button"
            >
                <IoColorPalette />
            </button>

            {
                is_modal_open && (
                    <div className={`themeModalOverlay ${is_modal_closing ? "hide" : "show"}`}
                    >
                        <div className="themeModal" data-onboarding-id="theme-selector-modal">
                            <h2>Paleta de temas</h2>
                            <button className="closeModal" onClick={toggle_modal} title="Cerrar" aria-label="Cerrar" type="button">X</button>
                            <div className="themeGrid">
                                {THEME_OPTIONS.map((theme) => (
                                    <button
                                        key={theme.id}
                                        className={`themeCard ${current_theme === theme.id ? "active" : ""}`}
                                        onClick={() => {
                                            handle_theme_change(theme.id);
                                            window.dispatchEvent(new CustomEvent("onboarding:theme-selected"));
                                        }}
                                        type="button"
                                        title={`Seleccionar ${theme.name}`}
                                        aria-label={`Seleccionar tema ${theme.name}`}
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
                            <p className="themeProposalText">
                                ¿Quieres proponer tu propia paleta de colores?{" "}
                                <a
                                    className="themeProposalDownloadLink"
                                    href="/plantillaColores.xlsx"
                                    download
                                >
                                    Descarga Aquí
                                </a>
                            </p>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default ThemeSelector;