/**
 * Formulario de actividad personal.
 *
 * Valida rango de horas y fechas antes de enviar y construye la actividad con
 * los identificadores que consumen `BlockPersonal` y `PopUpPersonal`.
 */

import { useCallback, useEffect, useState } from "react";
import { addPersonalActivity } from "../api/PersonalFetcher";
import {
  isReminderDateInPast,
  PAST_REMINDER_DATE_MESSAGE,
} from "../../../shared/lib/reminderDateValidation";

export const INITIAL_FORM_DATA = {
  title: "",
  description: "",
  day: "",
  startHour: "",
  endHour: "",
  dateStart: "",
  dateEnd: "",
};

export function useAddActivity({ userId, idCourse, onActivityAdd }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = useCallback(
    (event) => {
      const { name, value } = event.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      setError((prev) => (prev ? "" : prev));
    },
    []
  );

  const closeModal = useCallback(({ clearForm } = { clearForm: false }) => {
    setIsOpen(false);
    setError("");
    if (clearForm) setFormData(INITIAL_FORM_DATA);
  }, []);

  const openModal = useCallback(() => {
    setIsOpen(true);
    window.dispatchEvent(new CustomEvent("onboarding:add-activity-opened"));
  }, []);

  const validateForm = useCallback(() => {
    if (!formData.title.trim()) return "El título es obligatorio.";
    if (!formData.day) return "Debes seleccionar un día.";
    if (!formData.startHour || !formData.endHour) {
      return "Debes seleccionar hora de inicio y fin.";
    }
    if (!formData.dateStart) return "Debes seleccionar la fecha de inicio.";
    if (!formData.dateEnd) return "Debes seleccionar la fecha de fin.";
    if (isReminderDateInPast(formData.dateStart)) return PAST_REMINDER_DATE_MESSAGE;
    if (isReminderDateInPast(formData.dateEnd)) {
      return "La fecha de fin no puede ser en el pasado.";
    }

    const [startH, startM] = formData.startHour.split(":").map(Number);
    const [endH, endM] = formData.endHour.split(":").map(Number);
    if (startH * 60 + startM >= endH * 60 + endM) {
      return "La hora de inicio debe ser menor que la hora de fin.";
    }

    if (new Date(formData.dateStart) > new Date(formData.dateEnd)) {
      return "La fecha de inicio debe ser menor que la fecha de fin.";
    }

    return "";
  }, [formData]);

  const handleSave = useCallback(async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!userId) {
      setError("Usuario no identificado. Por favor, recarga la página.");
      return;
    }

    setLoading(true);

    try {
      const dateStartISO = new Date(formData.dateStart).toISOString();
      const dateEndISO = new Date(formData.dateEnd).toISOString();

      const response = await addPersonalActivity(userId, {
        title: formData.title,
        description: formData.description || "",
        day: formData.day,
        startHour: formData.startHour,
        endHour: formData.endHour,
        dateStart: dateStartISO,
        dateEnd: dateEndISO,
        idCourse: idCourse || null,
      });

      const newActivity = {
        id: response.id || `activity-${Date.now()}`,
        name: formData.title,
        description: formData.description || "",
        tag: "Personal",
        day: formData.day,
        start_time: formData.startHour,
        end_time: formData.endHour,
        activity_name: formData.title,
        subject_name: formData.title,
        location: "",
        classroom: "",
        date_start: dateStartISO,
        date_end: dateEndISO,
        id_course: idCourse || null,
      };

      onActivityAdd?.(newActivity);
      window.dispatchEvent(new CustomEvent("onboarding:add-activity-saved"));
      closeModal({ clearForm: true });
    } catch (err) {
      console.error("Error al guardar actividad:", err);
      setError(`No se pudo guardar la actividad. ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [closeModal, formData, idCourse, onActivityAdd, userId, validateForm]);

  useEffect(() => {
    const handleCloseUnrelatedUi = (event) => {
      const allowOpenUi = Array.isArray(event?.detail?.allowOpenUi)
        ? event.detail.allowOpenUi
        : [];
      if (!allowOpenUi.includes("modal-add-activity")) {
        closeModal();
      }
    };

    window.addEventListener("onboarding:close-unrelated-ui", handleCloseUnrelatedUi);
    return () =>
      window.removeEventListener("onboarding:close-unrelated-ui", handleCloseUnrelatedUi);
  }, [closeModal]);

  return {
    isOpen,
    formData,
    error,
    loading,
    openModal,
    closeModal,
    handleChange,
    handleSave,
  };
}

export default useAddActivity;
