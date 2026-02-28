import React, { useEffect, useState } from "react";

// Componente de tarjeta de actividad (versión simplificada sin NRC ni profesor)
export const BlockPersonal = ({
  id,
  subject_name,
  classroom,
  start_time,
  end_time,
  background_color = "#c99cd7",
  text_color = "#000000", 
  style = {},
  onDelete = () => {},
}) => {
  const [is_mounted, set_is_mounted] = useState(false);

  useEffect(() => {
    // Activar animación de entrada al montar
    const id = window.setTimeout(() => set_is_mounted(true), 10);
    return () => window.clearTimeout(id);
  }, []);
  // Validar que los datos requeridos estén presentes
  const is_valid_data = subject_name && classroom && 
    start_time && end_time;

  if (!is_valid_data) {
    return (
      <div className="activity-card-error">
        <p>Datos incompletos</p>
      </div>
    );
  }

  // Formatear la hora en un rango legible
  const format_time_range = () => {
    return `${start_time} - ${end_time}`;
  };

  return (
    <div
      className={"activity-card" + (is_mounted ? " enter" : "")}
      style={{ ...style, backgroundColor: background_color, color: text_color, cursor: "pointer"  }}
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

      <div className="activity-card-header">
        <div className="activity-card-left">
          <h3 className="activity-card-title">{subject_name}</h3>
        </div>
        <div className="activity-card-time">{format_time_range()}</div>
      </div>

      <div className="activity-card-footer">
        <span className="activity-card-classroom">{classroom}</span>
      </div>
    </div>
  );
};
