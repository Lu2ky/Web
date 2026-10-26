import ModalBase from "../../../../shared/ui/Modal";

const formatHour = (hour, minutes = 0) => {
  const period = hour < 12 ? "AM" : "PM";
  const displayHour = hour % 12 || 12;
  const displayMinutes = String(minutes).padStart(2, "0");
  return `${displayHour}:${displayMinutes} ${period}`;
};

const DAYS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

function HourPreview({ value }) {
  if (!value) return null;

  const [hours, minutes] = value.split(":");
  return (
    <p className="hourPreview">
      Seleccionaste: {formatHour(Number(hours), Number(minutes))}
    </p>
  );
}

export default function AddActivityModal({
  isOpen,
  formData,
  error,
  loading,
  onChange,
  onClose,
  onSave,
  titleInputRef,
  restoreFocusRef,
}) {
  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="Nueva Actividad"
      closeOnOverlayClick={true}
      showFooter={false}
      initialFocusRef={titleInputRef}
      restoreFocusRef={restoreFocusRef}
      className="controlBarModal controlBarModal--addActivity"
      bodyClassName="controlBarModalBody controlBarModalBody--addActivity"
    >
      <div className="addActivityModalContent" data-onboarding-id="add-activity-modal">
        {error && <p className="errorMessage" role="alert">{error}</p>}

        <input
          ref={titleInputRef}
          type="text"
          name="title"
          placeholder="Título"
          value={formData.title}
          onChange={onChange}
          required
        />

        <textarea
          name="description"
          placeholder="Descripción"
          value={formData.description}
          onChange={onChange}
        />

        <select name="day" value={formData.day} onChange={onChange}>
          <option value="">Selecciona día</option>
          {DAYS.map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>

        <label>Hora inicio</label>
        <input
          type="time"
          name="startHour"
          value={formData.startHour}
          onChange={onChange}
          required
        />
        <HourPreview value={formData.startHour} />

        <label>Hora fin</label>
        <input
          type="time"
          name="endHour"
          value={formData.endHour}
          onChange={onChange}
          required
        />
        <HourPreview value={formData.endHour} />

        <label>Fecha de inicio</label>
        <input
          type="date"
          name="dateStart"
          value={formData.dateStart}
          onChange={onChange}
          required
        />

        <label>Fecha de fin</label>
        <input
          type="date"
          name="dateEnd"
          value={formData.dateEnd}
          onChange={onChange}
          required
        />

        <div className="modalActions">
          <button
            className="cancelButton"
            onClick={() => onClose({ clearForm: true })}
            type="button"
          >
            Cancelar
          </button>

          <button
            className="saveButton"
            onClick={onSave}
            type="button"
            disabled={loading}
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </ModalBase>
  );
}
