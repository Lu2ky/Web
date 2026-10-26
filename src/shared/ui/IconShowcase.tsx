import React from 'react';
import { Icon, outlineIcons, filledIcons, IconSizes, type IconStyle, type IconSize } from './IconSystem';
import './IconShowcase.css';

/**
 * Componente de demostración para evaluar estilos de iconos
 * Muestra los 3 estilos (outline, filled, duotone) aplicados a iconos clave del To-Do
 */

const todoIcons = [
  { name: 'task', label: 'Tarea (pendiente)' },
  { name: 'taskCompleted', label: 'Tarea completada' },
  { name: 'plus', label: 'Nueva tarea' },
  { name: 'trash', label: 'Eliminar' },
  { name: 'edit', label: 'Editar' },
  { name: 'duplicate', label: 'Duplicar' },
  { name: 'filter', label: 'Filtrar' },
  { name: 'filterActive', label: 'Filtrar (activo)' },
  { name: 'tag', label: 'Etiqueta' },
  { name: 'calendar', label: 'Fecha' },
  { name: 'clock', label: 'Hora' },
  { name: 'flag', label: 'Prioridad' },
  { name: 'bell', label: 'Notificaciones' },
  { name: 'bellOff', label: 'Notif. silenciadas' },
  { name: 'checkbox', label: 'Checkbox' },
  { name: 'checkboxChecked', label: 'Checkbox checked' },
  { name: 'radio', label: 'Radio' },
  { name: 'radioChecked', label: 'Radio checked' },
  { name: 'settings', label: 'Configuración' },
  { name: 'user', label: 'Usuario' },
  { name: 'sun', label: 'Tema claro' },
  { name: 'moon', label: 'Tema oscuro' },
  { name: 'eye', label: 'Ver' },
  { name: 'eyeOff', label: 'Ocultar' },
  { name: 'download', label: 'Importar' },
  { name: 'upload', label: 'Exportar' },
  { name: 'search', label: 'Buscar' },
  { name: 'home', label: 'Inicio' },
  { name: 'menu', label: 'Menú' },
  { name: 'chevronDown', label: 'Desplegar' },
  { name: 'chevronRight', label: 'Siguiente' },
] as const;

type TodoIconName = typeof todoIcons[number]['name'];

export function IconShowcase() {
  const [style, setStyle] = React.useState<IconStyle>('outline');
  const [size, setSize] = React.useState<IconSize>('md');
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light');

  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <div className={`icon-showcase theme-${theme}`}>
      <header className="showcase-header">
        <h1>UPB Planner — Icon System Evaluation</h1>
        <p>To-Do List icons across styles, sizes, and themes</p>
      </header>

      <div className="showcase-controls">
        <fieldset className="control-group">
          <legend>Style</legend>
          <div className="radio-group">
            {(['outline', 'filled'] as IconStyle[]).map(s => (
              <label key={s} className="radio-label">
                <input
                  type="radio"
                  value={s}
                  checked={style === s}
                  onChange={() => setStyle(s)}
                />
                <span className="radio-custom" />
                <span className="radio-text">{s.charAt(0).toUpperCase() + s.slice(1)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="control-group">
          <legend>Size</legend>
          <div className="radio-group">
            {(['xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as IconSize[]).map(s => (
              <label key={s} className="radio-label">
                <input
                  type="radio"
                  value={s}
                  checked={size === s}
                  onChange={() => setSize(s)}
                />
                <span className="radio-custom" />
                <span className="radio-text">{s.toUpperCase()} ({IconSizes[s]}px)</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="control-group">
          <legend>Theme</legend>
          <div className="radio-group">
            {(['light', 'dark'] as const).map(t => (
              <label key={t} className="radio-label">
                <input
                  type="radio"
                  value={t}
                  checked={theme === t}
                  onChange={() => setTheme(t)}
                />
                <span className="radio-custom" />
                <span className="radio-text">{t.charAt(0).toUpperCase() + t.slice(1)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="showcase-grid">
        {todoIcons.map(({ name, label }) => (
          <div key={name} className="icon-card">
            <div className="icon-preview">
              <Icon 
                name={name as keyof typeof outlineIcons} 
                size={size} 
                style={style}
                aria-label={label}
              />
            </div>
            <div className="icon-label">{label}</div>
            <div className="icon-name">{name}</div>
          </div>
        ))}
      </div>

      <section className="showcase-context">
        <h2>Contextual Examples</h2>
        <div className="context-examples">
          <div className="context-card">
            <h3>TodoListHeader Actions</h3>
            <div className="context-row">
              <button className="context-btn">
                <Icon name="filter" size="md" style={style} />
              </button>
              <button className="context-btn">
                <Icon name="chevronDown" size="sm" style={style} />
              </button>
              <button className="context-btn primary">
                <Icon name="plus" size="md" style={style} />
              </button>
            </div>
          </div>

          <div className="context-card">
            <h3>Task Card Actions</h3>
            <div className="context-row">
              <button className="context-btn" aria-label="Editar">
                <Icon name="edit" size="sm" style={style} />
              </button>
              <button className="context-btn" aria-label="Duplicar">
                <Icon name="duplicate" size="sm" style={style} />
              </button>
              <button className="context-btn danger" aria-label="Eliminar">
                <Icon name="trash" size="sm" style={style} />
              </button>
            </div>
          </div>

          <div className="context-card">
            <h3>Task States</h3>
            <div className="context-row">
              <span className="state-badge pending">
                <Icon name="radio" size="xs" style={style} /> Pendiente
              </span>
              <span className="state-badge completed">
                <Icon name="radioChecked" size="xs" style={style} /> Completada
              </span>
              <span className="state-badge priority-high">
                <Icon name="flag" size="xs" style={style} /> Alta
              </span>
            </div>
          </div>

          <div className="context-card">
            <h3>Filter & Tags</h3>
            <div className="context-row">
              <button className="context-btn" aria-label="Filtrar">
                <Icon name="filter" size="sm" style={style} />
              </button>
              <button className="context-btn active" aria-label="Filtrar activo">
                <Icon name="filterActive" size="sm" style={style} />
              </button>
              <span className="tag-preview">
                <Icon name="tag" size="xs" style={style} /> Universidad
              </span>
            </div>
          </div>

          <div className="context-card">
            <h3>Due Date & Priority</h3>
            <div className="context-row">
              <span className="meta-item">
                <Icon name="calendar" size="xs" style={style} /> 15/12/2024
              </span>
              <span className="meta-item">
                <Icon name="clock" size="xs" style={style} /> 10:30 a.m.
              </span>
              <span className="meta-item priority">
                <Icon name="flag" size="xs" style={style} /> Media
              </span>
            </div>
          </div>

          <div className="context-card">
            <h3>User Menu & Theme</h3>
            <div className="context-row">
              <button className="context-btn" aria-label="Usuario">
                <Icon name="user" size="md" style={style} />
              </button>
              <button className="context-btn" aria-label="Tema">
                <Icon name={theme === 'dark' ? 'sun' : 'moon'} size="md" style={style} />
              </button>
              <button className="context-btn" aria-label="Configuración">
                <Icon name="settings" size="md" style={style} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default IconShowcase;