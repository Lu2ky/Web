// ============================================================================
// Componente EditActivityModal
// ============================================================================
// Modal para editar/actualizar una actividad personal.
// Valida que todos los campos sean válidos y que las horas sean coherentes.
// ============================================================================

import { useState, useEffect } from "react";
import "../../styles/AddActivityButton.css";
import { updatePersonalActivity } from "../../services/PersonalFetcher";

function EditActivityModal({ isOpen = false, onClose = () => {}, userId, activity = {}, onUpdated = () => {} }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    day: "",
    startHour: "",
    endHour: "",
    dateStart: "",
    dateEnd: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activity) {
      setFormData({
        title: activity.name || activity.activity_name || activity.subject_name || "",
        description: activity.description || "",
        day: activity.day || "",
        startHour: activity.start_time || activity.start_hour || "",
        endHour: activity.end_time || activity.end_hour || "",
        dateStart: activity.date_start || "",
        dateEnd: activity.date_end || ""
      });
    }
  }, [activity]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (error) setError("");
  };

  // Valida que el formulario cumpla con todas las restricciones
  // Verifica: título, día, horas, coherencia de horarios y fechas
  const validate = () => {
    if (!formData.title.trim()) return "El título es obligatorio.";
    if (!formData.day) return "Debes seleccionar un día.";
    if (!formData.startHour || !formData.endHour) return "Debes seleccionar hora de inicio y fin.";
    const [sh, sm] = formData.startHour.split(":").map(Number);
    const [eh, em] = formData.endHour.split(":").map(Number);
    if (sh * 60 + sm >= eh * 60 + em) return "La hora de inicio debe ser menor que la hora de fin.";
    const ds = new Date(formData.dateStart);
    const de = new Date(formData.dateEnd);
    if (formData.dateStart && formData.dateEnd && ds > de) return "La fecha de inicio debe ser menor que la fecha de fin.";
    return "";
  };

  const handleSave = async () => {
    const v = validate();
    if (v) { setError(v); return; }
    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description || "",
        day: formData.day,
        startHour: formData.startHour,
        endHour: formData.endHour,
        dateStart: formData.dateStart ? new Date(formData.dateStart).toISOString() : new Date().toISOString(),
        dateEnd: formData.dateEnd ? new Date(formData.dateEnd).toISOString() : new Date().toISOString()
      };

      const resp = await updatePersonalActivity(userId, activity.id || activity.id_course, payload);
      const updated = {
        id: resp.id || activity.id || activity.id_course,
        name: payload.title,
        description: payload.description,
        tag: "Personal",
        day: payload.day,
        start_time: payload.startHour,
        end_time: payload.endHour,
        activity_name: payload.title,
        subject_name: payload.title,
        date_start: payload.dateStart,
        date_end: payload.dateEnd,
        apiData: resp
      };

      onUpdated(updated);
      onClose();
    } catch (err) {
      console.error("Error updating activity:", err);
      setError(err.message || "Error al actualizar actividad.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modalContainer" onClick={(e) => e.stopPropagation()}>
        <h2>Editar Actividad</h2>
        <button className="modalClose" onClick={onClose} title="Cerrar" aria-label="Cerrar" type="button">X</button>
        {error && <p className="errorMessage">{error}</p>}

        <label>Título</label>
        <input name="title" value={formData.title} onChange={handleChange} />

        <label>Descripción</label>
        <textarea name="description" value={formData.description} onChange={handleChange} />

        <label>Día</label>
        <select name="day" value={formData.day} onChange={handleChange}>
          <option value="">Seleccionar</option>
          <option value="Lunes">Lunes</option>
          <option value="Martes">Martes</option>
          <option value="Miércoles">Miércoles</option>
          <option value="Jueves">Jueves</option>
          <option value="Viernes">Viernes</option>
          <option value="Sábado">Sábado</option>
          <option value="Domingo">Domingo</option>
        </select>

        <label>Hora inicio</label>
        <input type="time" name="startHour" value={formData.startHour} onChange={handleChange} />

        <label>Hora fin</label>
        <input type="time" name="endHour" value={formData.endHour} onChange={handleChange} />

        <label>Fecha inicio</label>
        <input type="date" name="dateStart" value={formData.dateStart ? formData.dateStart.split('T')[0] : ''} onChange={handleChange} />

        <label>Fecha fin</label>
        <input type="date" name="dateEnd" value={formData.dateEnd ? formData.dateEnd.split('T')[0] : ''} onChange={handleChange} />

        <div className="modalActions">
          <button className="saveButton" onClick={handleSave} disabled={loading}>{loading ? "Guardando..." : "Guardar"}</button>
          <button className="close-button" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

export default EditActivityModal;
