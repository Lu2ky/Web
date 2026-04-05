import { useState } from "react";
import { createAcademicPeriod } from "../../../services/academicPeriodsService";
import { getAuthSession } from "../../../services/authSession";
import "../CSS ViewAdmin/AddAcademicPeriodCard.css";

function AddAcademicPeriodCard() {
  const session = getAuthSession();
  const userId = String(session?.userId || "").trim();

  const [nombre, setNombre] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFinal, setFechaFinal] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const resetForm = () => {
    setNombre("");
    setFechaInicio("");
    setFechaFinal("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const safeName = nombre.trim();

    if (!userId) {
      setError("No se encontró una sesión válida de administrador.");
      return;
    }

    if (!safeName || !fechaInicio || !fechaFinal) {
      setError("Completa todos los campos obligatorios.");
      return;
    }

    if (fechaInicio > fechaFinal) {
      setError("La fecha de inicio no puede ser mayor que la fecha final.");
      return;
    }

    setIsSubmitting(true);

    const result = await createAcademicPeriod({
      idUsuario: userId,
      nombre: safeName,
      fechaInicio,
      fechaFinal
    });

    setIsSubmitting(false);

    if (!result?.success) {
      setError(result?.message || "No se pudo crear el período académico.");
      return;
    }

    setSuccess(result.message || "Período académico creado correctamente.");
    resetForm();
  };

  return (
    <section className="addPeriodCard" aria-labelledby="add-period-title">
      <header className="addPeriodCard__header">
        <h2 id="add-period-title">Crear nuevo período académico</h2>
        <p>Registra un período para habilitar su uso en los filtros del calendario.</p>
      </header>

      <form className="addPeriodCard__form" onSubmit={handleSubmit}>
        <label className="addPeriodCard__field" htmlFor="period-name">
          <span>Nombre del período</span>
          <input
            id="period-name"
            type="text"
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            placeholder="Ejemplo: 2026-10"
            maxLength={120}
            disabled={isSubmitting}
            required
          />
        </label>

        <label className="addPeriodCard__field" htmlFor="period-start">
          <span>Fecha de inicio</span>
          <input
            id="period-start"
            type="date"
            value={fechaInicio}
            onChange={(event) => setFechaInicio(event.target.value)}
            disabled={isSubmitting}
            required
          />
        </label>

        <label className="addPeriodCard__field" htmlFor="period-end">
          <span>Fecha final</span>
          <input
            id="period-end"
            type="date"
            value={fechaFinal}
            onChange={(event) => setFechaFinal(event.target.value)}
            disabled={isSubmitting}
            required
          />
        </label>

        <button className="addPeriodCard__submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creando período..." : "Crear período"}
        </button>

        {error ? <p className="addPeriodCard__message addPeriodCard__message--error">{error}</p> : null}
        {success ? <p className="addPeriodCard__message addPeriodCard__message--success">{success}</p> : null}
      </form>
    </section>
  );
}

export default AddAcademicPeriodCard;
