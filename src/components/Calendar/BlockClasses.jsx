import React, { useEffect, useState } from "react";

// Componente de tarjeta de actividad
// Se usa export const porque se pueden exportar múltiples componentes de este archivo.

export const BlockClasses = ({
  subject_name, //Materia
  professor_name, //Profesor
  classroom, 
  nrc,
  tag, //Etiqueta de tipo de clase (Teoría, Laboratorio, etc.)
  start_time,
  end_time,
  background_color = "#ddc8b7", // Color por defecto 
  style = {},
  onClick = () => {},
}) => {
  const [is_mounted, set_is_mounted] = useState(false);

  useEffect(() => {
    // Activar animación de entrada al montar
    const id = window.setTimeout(() => set_is_mounted(true), 10);
    return () => window.clearTimeout(id);
  }, []);
  // Validar que los datos requeridos estén presentes
  const is_valid_data = subject_name && professor_name && classroom && 
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
      style={{ ...style, backgroundColor: background_color, cursor: "pointer" }}
      onClick={onClick}
    >
      <div className="activity-card-header">
        <div className="activity-card-left">
          <h3 className="activity-card-title">
            {subject_name}
          </h3>
          <p className="activity-card-professor">
            {professor_name}
          </p>
        </div>
        <div className="activity-card-time">
          {format_time_range()}
        </div>
      </div>

      <div className="activity-card-footer">
        <span className="activity-card-classroom">
          {classroom}
        </span>
        {nrc && (
          <span className="activity-card-nrc">
            NRC {nrc}
          </span>
        )}
      </div>
    </div>
  );
};
