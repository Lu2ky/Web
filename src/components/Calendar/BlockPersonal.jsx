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

  return (
    <div
      className={"activity-card" + (is_mounted ? " enter" : "")}
      style={{ ...style, backgroundColor: background_color, color: text_color, cursor: "pointer" }}
      onClick={onClick}
    >
      <button
        className="activity-delete-button"
        aria-label="Eliminar actividad"
        title="Eliminar actividad"
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(id);
        }}
      >
        ✕
      </button>

      <div className="activity-card-content">
        <h3 className="activity-card-title">{activity_name}</h3>
        
        {description && (
          <p className="activity-card-description">{description}</p>
        )}

        {tag && (
          <div className="activity-card-tag">
            <span className="tag-label">{tag}</span>
          </div>
        )}
      </div>
    </div>
  );
};
