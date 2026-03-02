import React, { useEffect, useState } from "react";

// Componente de tarjeta de actividad (versión simplificada sin NRC ni profesor)
export const BlockPersonal = ({
  id,
  subject_name,
  name,
  classroom,
  tag,
  start_time,
  end_time,
  times,
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

  const times_array = Array.isArray(times) ? times : [];
  const has_times_with_id = times_array.length >= 5;
  const has_basic_times = times_array.length >= 2;

  const normalized_subject_name = subject_name || name || "Actividad personal";
  const normalized_classroom = classroom || tag || "Personal";
  const normalized_start_time = start_time || (has_times_with_id ? String(times_array[1]).slice(0, 5) : has_basic_times ? String(times_array[0]).slice(0, 5) : "");
  const normalized_end_time = end_time || (has_times_with_id ? String(times_array[2]).slice(0, 5) : has_basic_times ? String(times_array[1]).slice(0, 5) : "");

  // Validar que los datos requeridos estén presentes
  const is_valid_data = normalized_subject_name && normalized_start_time && normalized_end_time;

  if (!is_valid_data) {
    return (
      <div className="activity-card-error">
        <p>Datos incompletos</p>
      </div>
    );
  }

  // Formatear la hora en un rango legible
  const format_time_range = () => {
    return `${normalized_start_time} - ${normalized_end_time}`;
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
          <h3 className="activity-card-title">{normalized_subject_name}</h3>
        </div>
        <div className="activity-card-time">{format_time_range()}</div>
      </div>

      <div className="activity-card-footer">
        <span className="activity-card-classroom">{normalized_classroom}</span>
      </div>
    </div>
  );
};
