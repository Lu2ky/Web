import React, { useEffect, useState } from "react";

// Componente de tarjeta de actividad personal
// Muestra: nombre, descripción y etiqueta
export const BlockPersonal = ({
  id,
  name,
  description,
  tag,
  background_color = "#c99cd7",
  text_color = "#000000", 
  style = {},
  onClick = () => {},
  onDelete = () => {},
}) => {
  const [is_mounted, set_is_mounted] = useState(false);

  useEffect(() => {
    // Activar  nimación de entrada al montar
    const timer = window.setTimeout(() => set_is_mounted(true), 10);
    return () => window.clearTimeout(timer);
  }, []);

  const activity_name = name || "Actividad personal";
  const titleId = `activity-title-${id}`;
  const descId = description ? `activity-desc-${id}` : null;
  const tagId = tag ? `activity-tag-${id}` : null;
  const parts = [titleId];
  if (descId) parts.push(descId);
  if (tagId) parts.push(tagId);
  parts.push("activity-action-hint");
  const labelledBy = parts.join(" ");

  return (
    <div className="activity-card-shell" style={style}>
      <button
        type="button"
        className={"activity-card" + (is_mounted ? " enter" : "")}
        style={{ backgroundColor: background_color, color: text_color, cursor: "pointer" }}
        aria-labelledby={labelledBy}
        aria-haspopup="dialog"
        onClick={onClick}
      >
        <div className="activity-card-content">
          <h3 id={titleId} className="activity-card-title">{activity_name}</h3>

          {description && (
            <p id={descId} className="activity-card-description">{description}</p>
          )}

          {tag && (
            <div className="activity-card-tag">
              <span id={tagId} className="tag-label">{tag}</span>
            </div>
          )}

          <span id="activity-action-hint" className="sr-only">Abrir detalles de la actividad</span>
        </div>
      </button>

      <button
        className="activity-delete-button"
        aria-label={`Eliminar ${activity_name}`}
        title="Eliminar actividad"
        type="button"
        onClick={() => onDelete(id)}
      >
        ✕
      </button>
    </div>
  );
};
