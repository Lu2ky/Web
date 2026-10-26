import React, { useEffect, useState } from "react";

// Componente de tarjeta de actividad
// Se usa export const porque se pueden exportar múltiples componentes de este archivo.

export const BlockClasses = ({
  id, // Identificador único para accesibilidad
  subject_name, //Materia
  professor_name, //Profesor
  classroom, 
  nrc,
  tag, //Etiqueta de tipo de clase (Teoría, Laboratorio, etc.)
  start_time,
  end_time,
  background_color = "#ddc8b7", // Color por defecto 
  text_color = "#000000", // Color de texto por defecto
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

  const open_details = () => {
    window.dispatchEvent(new CustomEvent("onboarding:official-card-opened"));
    onClick();
  };

  const uid = id ?? "unknown";
  const titleId = `official-title-${uid}`;
  const profId = `official-prof-${uid}`;
  const timeId = `official-time-${uid}`;
  const roomId = `official-room-${uid}`;
  const nrcId = nrc ? `official-nrc-${uid}` : null;
  const parts = [titleId, profId, timeId, roomId];
  if (nrcId) parts.push(nrcId);
  parts.push("official-action-hint");
  const labelledBy = parts.join(" ");

  return (
    <button
      type="button"
      className={"activity-card official-class-card" + (is_mounted ? " enter" : "")}
      style={{ ...style, backgroundColor: background_color, color: text_color, cursor: "pointer" }}
      data-onboarding-id="official-class-card"
      aria-labelledby={labelledBy}
      aria-haspopup="dialog"
      onClick={open_details}
    >
      <div className="activity-card-header">
        <div className="activity-card-left">
          <h3 id={titleId} className="activity-card-title">
            {subject_name}
          </h3>
          <p id={profId} className="activity-card-professor">
            {professor_name}
          </p>
        </div>
        <div id={timeId} className="activity-card-time">
          {format_time_range()}
        </div>
      </div>

      <div className="activity-card-footer">
        <span id={roomId} className="activity-card-classroom">
          {classroom}
        </span>
        {nrc && (
          <span id={nrcId} className="activity-card-nrc">
            NRC {nrc}
          </span>
        )}
      </div>

      <span id="official-action-hint" className="sr-only">Abrir detalles de la clase</span>
    </button>
  );
};
