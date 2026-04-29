// ============================================================================
// Componente EditActivityModal
// ============================================================================
// Modal para editar/actualizar una actividad personal.
// Valida que todos los campos sean válidos y que las horas sean coherentes.
// ============================================================================

import { useState, useEffect } from "react";
import ModalBase from "../Templates/Modal";
import "../../styles/ControlBar/AddActivityButton.css";
import { updatePersonalActivity } from "../../services/PersonalFetcher";

const normalizeDateForInput = (value) => {
  if (!value) return "";

  const raw = String(value).trim();
  const isoDate = raw.match(/^(\d{4}-\d{2}-\d{2})$/);
  if (isoDate) return isoDate[1];

  const dateTime = raw.match(/^(\d{4}-\d{2}-\d{2})[ T]\d{2}:\d{2}(?::\d{2})?$/);
  if (dateTime) return dateTime[1];

  const parsed = new Date(raw.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return "";

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeTimeForInput = (value) => {
  if (!value) return "";
  const raw = String(value).trim();

  const strict = raw.match(/^(\d{2}):(\d{2})(?::\d{2})?$/);
  if (strict) return `${strict[1]}:${strict[2]}`;

  const embedded = raw.match(/(?:^|[ T])(\d{2}):(\d{2})(?::\d{2})?(?:$|\b)/);
  if (embedded) return `${embedded[1]}:${embedded[2]}`;

  const parsed = new Date(raw.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return "";

  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

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
        startHour: normalizeTimeForInput(activity.start_time || activity.start_hour || ""),
        endHour: normalizeTimeForInput(activity.end_time || activity.end_hour || ""),
        dateStart: normalizeDateForInput(activity.date_start || ""),
        dateEnd: normalizeDateForInput(activity.date_end || "")
      });
    }
  }, [activity]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (error) setError("");
  };

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

  // ✅ Verifica si hay cambios comparando formData con activity original
  const hasChanges = () => {
    const originalData = {
      title: activity.name || activity.activity_name || activity.subject_name || "",
      description: activity.description || "",
      day: activity.day || "",
      startHour: normalizeTimeForInput(activity.start_time || activity.start_hour || ""),
      endHour: normalizeTimeForInput(activity.end_time || activity.end_hour || ""),
      dateStart: normalizeDateForInput(activity.date_start || ""),
      dateEnd: normalizeDateForInput(activity.date_end || "")
    };

    const changes = {
      title: formData.title !== originalData.title,
      description: formData.description !== originalData.description,
      day: formData.day !== originalData.day,
      startHour: formData.startHour !== originalData.startHour,
      endHour: formData.endHour !== originalData.endHour,
      dateStart: formData.dateStart !== originalData.dateStart,
      dateEnd: formData.dateEnd !== originalData.dateEnd
    };

    const hasAnyChange = Object.values(changes).some(change => change);
    
    return hasAnyChange;
  };

  const handleSave = async () => {
    const v = validate();
    if (v) { setError(v); return; }
    
    //Verificar si hay cambios antes de enviar
    if (!hasChanges()) {
      setError("No hay cambios para guardar.");
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description || "",
        day: formData.day,
        startHour: formData.startHour,
        endHour: formData.endHour,
        dateStart: formData.dateStart,
        dateEnd: formData.dateEnd
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
      console.error("Error actualizando actividad:", err);
      setError(err.message || "Error al actualizar actividad.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Actividad"
      showFooter={false}
      className="controlBarModal--addActivity"
      bodyClassName="controlBarModalBody--addActivity"
    >
      {error && <p className="errorMessage">{error}</p>}

      <div className="addActivityModalContent">
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
        <input type="date" name="dateStart" value={formData.dateStart} onChange={handleChange} />

        <label>Fecha fin</label>
        <input type="date" name="dateEnd" value={formData.dateEnd} onChange={handleChange} />

        <div className="modalActions">
          <button
            className="saveButton"
            onClick={handleSave}
            disabled={loading || !hasChanges()}
            title={!hasChanges() ? "No hay cambios para guardar" : "Guardar cambios de actividad"}
            aria-label="Guardar cambios"
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
          <button
            className="cancelButton"
            onClick={onClose}
            title="Cancelar y descartar cambios"
            aria-label="Cancelar"
          >
            Cancelar
          </button>
        </div>
      </div>
    </ModalBase>
  );
}

export default EditActivityModal;
