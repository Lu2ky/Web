import { useState, useEffect } from "react";
import { createAcademicPeriod } from "../../../services/academicPeriodsService";
import { getUserData } from "../../../services/userService";
import "../CSS ViewAdmin/AddAcademicPeriodCard.css";

function AddAcademicPeriodCard({ userId = null, onCreated = () => {} }) {
  const [nombre, setNombre] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFinal, setFechaFinal] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lastRequest, setLastRequest] = useState(null);
  const [lastResponse, setLastResponse] = useState(null);
  const [resolvedUserIdUsed, setResolvedUserIdUsed] = useState("");

  const isDebug = (String(import.meta.env.VITE_DEBUG_ACADEMIC_PERIODS || "").trim().toLowerCase() === "true") || Boolean(import.meta.env.DEV);

  // Log inicial para diagnosticar el userId recibido de props
  useEffect(() => {
    if (isDebug) {
      console.log("[AddAcademicPeriodCard] Initialized with userId from props:", {
        userId: userId,
        typeOfUserId: typeof userId,
        isDevelopment: import.meta.env.DEV
      });
    }
  }, [isDebug, userId]);

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

    // Validar que userId viene desde props
    if (!userId) {
      const errorMsg = `No se encontro una sesion valida de administrador. (userId: ${userId})`;
      if (isDebug) console.error("[AddAcademicPeriodCard]", errorMsg);
      setError("No se encontro una sesion valida de administrador.");
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

    // Obtener datos del usuario desde userService para extraer idUsuario numérico
    let resolvedUserId = null;
    try {
      if (isDebug) console.log("[AddAcademicPeriodCard] Fetching user data from userService for userId:", userId);
      
      const userData = await getUserData(userId);
      if (isDebug) console.log("[AddAcademicPeriodCard] getUserData response from VITE_API_GET_USER_DATA:", userData);
      
      if (!userData) {
        throw new Error("No se encontraron datos del usuario en el servicio");
      }
      
      const currentUser = Array.isArray(userData) ? userData[0] : userData;
      
      // Extraer idUsuario numérico de los datos reales del servidor
      const extracted = 
        currentUser?.idUsuario ?? 
        currentUser?.N_idUsuario ?? 
        currentUser?.id_user ?? 
        currentUser?.ID_USER ?? 
        currentUser?.id ?? 
        null;
      
      if (!extracted) {
        throw new Error("No se encontró idUsuario en la respuesta del servidor");
      }
      
      // Convertir a número si es necesario
      resolvedUserId = typeof extracted === 'number' ? extracted : Number(extracted);
      
      if (!Number.isInteger(resolvedUserId)) {
        throw new Error(`idUsuario inválido: ${extracted} (no se puede convertir a número)`);
      }
      
      if (isDebug) console.log("[AddAcademicPeriodCard] Successfully resolved idUsuario:", { extracted, resolvedUserId, type: typeof resolvedUserId });
    } catch (err) {
      if (isDebug) console.error("[AddAcademicPeriodCard] Error fetching/resolving user data:", err?.message || err);
      setIsSubmitting(false);
      setError(`Error al obtener datos del usuario: ${err?.message || "Error desconocido"}`);
      return;
    }

    setResolvedUserIdUsed(resolvedUserId);

    const payload = {
      idUsuario: resolvedUserId,
      nombre: safeName,
      fechaInicio,
      fechaFinal
    };
    
    if (isDebug) {
      console.log("[AddAcademicPeriodCard] Creating academic period with payload:", {
        ...payload,
        resolvedUserIdType: typeof resolvedUserId,
        isResolvedUserIdInteger: Number.isInteger(resolvedUserId)
      });
      setLastRequest(payload);
    }

    const result = await createAcademicPeriod(payload);
    if (isDebug) {
      console.log("[AddAcademicPeriodCard] createAcademicPeriod result:", result);
      setLastResponse(result || null);
    }

    setIsSubmitting(false);

    if (!result?.success) {
      setError(result?.message || "No se pudo crear el periodo academico.");
      return;
    }

    setSuccess(result.message || "Periodo academico creado correctamente.");
    resetForm();
    onCreated(result.data);
  };

  return (
    <section className="addPeriodCard" aria-labelledby="add-period-title">
      <header className="addPeriodCard__header">
        <h2 id="add-period-title">Crear nuevo periodo academico</h2>
        <p>Registra un periodo para habilitar su uso en los filtros del calendario.</p>
      </header>

      <form className="addPeriodCard__form" onSubmit={handleSubmit}>
        <label className="addPeriodCard__field" htmlFor="period-name">
          <span>Nombre del periodo</span>
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
          {isSubmitting ? "Creando periodo..." : "Crear periodo"}
        </button>

        {error ? <p className="addPeriodCard__message addPeriodCard__message--error">{error}</p> : null}
        {success ? <p className="addPeriodCard__message addPeriodCard__message--success">{success}</p> : null}
      </form>
    </section>
  );
}

export default AddAcademicPeriodCard;
