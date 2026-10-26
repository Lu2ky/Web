import { useAppearance } from "../../../../shared/appearance/appearanceContext";
import "./AppearanceSettings.css";

const THEME_OPTIONS = [
  { value: "light", label: "Claro", hint: "Fondos claros" },
  { value: "dark", label: "Oscuro", hint: "Fondos oscuros" },
  { value: "auto", label: "Automático", hint: "Sigue al sistema" },
];

const FONT_SIZE_OPTIONS = [
  { value: "sm", label: "Pequeña", hint: "90 %" },
  { value: "md", label: "Mediana", hint: "100 %" },
  { value: "lg", label: "Grande", hint: "112 %" },
];

const THEME_LABELS = Object.fromEntries(THEME_OPTIONS.map(({ value, label }) => [value, label]));
const FONT_LABELS = Object.fromEntries(FONT_SIZE_OPTIONS.map(({ value, label }) => [value, label]));

function OptionGroup({ legend, name, options, value, onChange }) {
  return (
    <fieldset className="appearance-group">
      <legend className="appearance-group__legend">{legend}</legend>
      <div className="appearance-options">
        {options.map((option) => (
          <label className="appearance-option" key={option.value}>
            <input
              className="appearance-option__input"
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span className="appearance-option__label">{option.label}</span>
            <span className="appearance-option__hint">{option.hint}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Selector de tema claro/oscuro/automático y tamaño de letra. */
export default function AppearanceSettings() {
  const { theme, fontSize, resolvedTheme, setTheme, setFontSize, resetAppearance } = useAppearance();

  const announcement =
    theme === "auto"
      ? `Tema automático, ahora ${resolvedTheme === "dark" ? "oscuro" : "claro"}. Tamaño de letra ${FONT_LABELS[fontSize]}.`
      : `Tema ${THEME_LABELS[theme]}. Tamaño de letra ${FONT_LABELS[fontSize]}.`;

  return (
    <div className="appearance-settings">
      <p className="appearance-settings__intro">
        Elige cómo se ve UPB Planner. La preferencia se guarda en este dispositivo.
      </p>

      <OptionGroup
        legend="Tema"
        name="appearance-theme"
        options={THEME_OPTIONS}
        value={theme}
        onChange={setTheme}
      />

      {theme === "auto" ? (
        <p className="appearance-settings__note">
          Ahora mismo se usa el tema {resolvedTheme === "dark" ? "oscuro" : "claro"} del sistema.
        </p>
      ) : null}

      <OptionGroup
        legend="Tamaño de letra"
        name="appearance-font-size"
        options={FONT_SIZE_OPTIONS}
        value={fontSize}
        onChange={setFontSize}
      />

      <button type="button" className="appearance-reset" onClick={resetAppearance}>
        Restablecer apariencia
      </button>

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
