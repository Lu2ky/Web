import { useState } from "react";
import "../../styles/ThemeSelector.css";

// Temas disponibles, por Id, nombre y paleta según etiqueta de la materia (o tema)

// Componente selector de temas
export const ThemeSelector = ({ on_theme_change }) => {
  const [is_dropdown_open, set_is_dropdown_open] = useState(false);
  const [current_theme, set_current_theme] = useState("default");
  const [is_saved_anim, set_is_saved_anim] = useState(false);
  const [is_dropdown_closing, set_is_dropdown_closing] = useState(false);

  const DROPDOWN_CLOSE_DURATION = 150; // ms, debe coincidir con App.css

  // Opciones de temas disponibles
  const THEME_OPTIONS = [
    { id: "default", name: "Papoi", color: "#c2a501" },
    { id: "dark", name: "Oscuro", color: "#1f1f1f" },
    { id: "light", name: "Claro", color: "#f5f5f5" },
    { id: "nature", name: "Naturaleza", color: "#2d8659" },
    { id: "sunset", name: "Atardecer", color: "#ff6b35" },
  ];
  const DEFAULT_THEME = "default"; // Tema por defecto

  // Alternar visibilidad del desplegable
  const toggle_dropdown = () => {
    if (is_dropdown_open) {
      // Activar animación de cierre
      set_is_dropdown_closing(true);
      window.setTimeout(() => {
        set_is_dropdown_open(false);
        set_is_dropdown_closing(false);
      }, DROPDOWN_CLOSE_DURATION);
    } else {
      set_is_dropdown_open(true);
    }
  };

  // Manejar cambio de tema
  const handle_theme_change = (theme_id) => {
    const ANIM_DURATION = 150; // ms

    set_current_theme(theme_id);

    // Cerrar dropdown con animación
    set_is_dropdown_closing(true);
    window.setTimeout(() => {
      set_is_dropdown_open(false);
      set_is_dropdown_closing(false);
    }, DROPDOWN_CLOSE_DURATION);

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
        onClick={toggle_dropdown}
        aria-label="Selector de temas"
        type="button"
      >
        <span className="theme-selector-icon-wrapper">
          {/* SVG proporcionado por el usuario, adaptado a JSX */}
            <svg width="22" height="22" viewBox="0 0 14 13" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <g clipPath="url(#clip0_2683_410)">
              <path d="M7.87492 4.08333C8.036 4.08333 8.16659 3.95275 8.16659 3.79167C8.16659 3.63058 8.036 3.5 7.87492 3.5C7.71384 3.5 7.58325 3.63058 7.58325 3.79167C7.58325 3.95275 7.71384 4.08333 7.87492 4.08333Z" fill="#E60076" stroke="#E60076" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10.2084 6.41667C10.3695 6.41667 10.5001 6.28608 10.5001 6.125C10.5001 5.96392 10.3695 5.83333 10.2084 5.83333C10.0473 5.83333 9.91675 5.96392 9.91675 6.125C9.91675 6.28608 10.0473 6.41667 10.2084 6.41667Z" fill="#E60076" stroke="#E60076" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4.95841 4.66667C5.1195 4.66667 5.25008 4.53608 5.25008 4.375C5.25008 4.21392 5.1195 4.08333 4.95841 4.08333C4.79733 4.08333 4.66675 4.21392 4.66675 4.375C4.66675 4.53608 4.79733 4.66667 4.95841 4.66667Z" fill="#E60076" stroke="#E60076" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3.79167 7.58333C3.95275 7.58333 4.08333 7.45275 4.08333 7.29167C4.08333 7.13058 3.95275 7 3.79167 7C3.63058 7 3.5 7.13058 3.5 7.29167C3.5 7.45275 3.63058 7.58333 3.79167 7.58333Z" fill="#E60076" stroke="#E60076" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7.00008 1.16667C3.79175 1.16667 1.16675 3.79167 1.16675 7C1.16675 10.2083 3.79175 12.8333 7.00008 12.8333C7.54025 12.8333 7.96141 12.3982 7.96141 11.8487C7.96141 11.5938 7.85641 11.3616 7.7065 11.1924C7.53733 11.0238 7.451 10.8121 7.451 10.5362C7.44879 10.4078 7.47244 10.2803 7.52056 10.1612C7.56867 10.0422 7.64026 9.93402 7.73106 9.84323C7.82185 9.75243 7.93 9.68084 8.04905 9.63273C8.1681 9.58461 8.29561 9.56096 8.424 9.56317H9.58833C11.3681 9.56317 12.8287 8.10308 12.8287 6.32333C12.813 3.507 10.1857 1.16667 7.00008 1.16667Z" stroke="#E60076" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round" />
            </g>
            <defs>
              <clipPath id="clip0_2683_410">
                <rect width="14" height="14" fill="white" />
              </clipPath>
            </defs>
          </svg>
        </span>

        <span className="theme-selector-text">Tema</span>

        <svg
          className={`theme-selector-arrow ${is_dropdown_open ? "open" : ""}`}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {is_dropdown_open && (
        <div className={`theme-selector-dropdown ${is_dropdown_closing ? "hide" : "show"}`}>
          {THEME_OPTIONS.map((theme) => (
            <button
              key={theme.id}
              className={`theme-option ${
                current_theme === theme.id ? "active" : ""
              }`}
              onClick={() => handle_theme_change(theme.id)}
              type="button"
            >
              <span
                className="theme-option-color"
                style={{ backgroundColor: theme.color }}
              />
              <span className="theme-option-name">{theme.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;