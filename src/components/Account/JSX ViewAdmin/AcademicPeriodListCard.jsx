import { useEffect, useMemo, useState } from "react";

import MessageConfirmation from "../../TodoList/MessageConfirmation";
import {
  deleteAcademicPeriod,
  fetchAcademicPeriods,
  updateAcademicPeriod
} from "../../../services/academicPeriodsService";
import { getUserData } from "../../../services/userService";
import "../../../styles/Reminder.css";
import "../CSS ViewAdmin/AcademicPeriodListCard.css";

const isAcademicPeriodsUiDebugEnabled = () => {
  const rawValue = String(import.meta.env.VITE_DEBUG_ACADEMIC_PERIODS || "").trim().toLowerCase();
  return import.meta.env.DEV || rawValue === "1" || rawValue === "true";
};

const logAcademicPeriodsUiWarn = (...args) => {
  if (!isAcademicPeriodsUiDebugEnabled()) return;
  console.warn("[AcademicPeriodsUI]", ...args);
};

const formatDate = (rawDate) => {
  const safeDate = String(rawDate || "").trim();
  if (!safeDate) return "Sin fecha";

  const match = safeDate.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return safeDate;

  return `${match[3]}/${match[2]}/${match[1]}`;
};

function AcademicPeriodListCard({ userId = null, refreshToken = 0 }) {
  const [periods, setPeriods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [resolvedUserId, setResolvedUserId] = useState(null);

  // Resolver userId (username) a idUsuario (numérico) desde userService
  useEffect(() => {
    let isMounted = true;

    const resolveUserId = async () => {
      if (!userId) {
        if (isMounted) setResolvedUserId(null);
        return;
      }

      try {
        logAcademicPeriodsUiDebug("resolveUserId:start", { userId });
        const currentData = await getUserData(userId);
        const currentUser = Array.isArray(currentData) ? currentData[0] : currentData;
        
        const candidateId =
          currentUser?.idUsuario ??
          currentUser?.N_idUsuario ??
          currentUser?.id_user ??
          currentUser?.ID_USER ??
          currentUser?.id ??
          null;

        if (!candidateId) {
          throw new Error("No se encontró idUsuario en los datos del usuario");
        }

        const numericId = typeof candidateId === 'number' ? candidateId : Number(candidateId);
        
        if (isMounted) {
          setResolvedUserId(numericId);
          logAcademicPeriodsUiDebug("resolveUserId:success", {
            userId,
            resolvedUserId: numericId
          });
        }
      } catch (error) {
        if (isMounted) {
          logAcademicPeriodsUiWarn("resolveUserId:error", {
            userId,
            error: error?.message || error
          });
        }
      }
    };

    resolveUserId();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const sortedPeriods = useMemo(() => {
    return [...periods].sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || "")));
  }, [periods]);

  const loadPeriods = async () => {
    setIsLoading(true);
    setError("");
    logAcademicPeriodsUiDebug("loadPeriods:start");

    try {
      const data = await fetchAcademicPeriods();
      setPeriods(Array.isArray(data) ? data : []);
      logAcademicPeriodsUiDebug("loadPeriods:success", {
        total: Array.isArray(data) ? data.length : 0
      });
    } catch {
      setError("No se pudieron cargar los periodos academicos.");
      setPeriods([]);
      logAcademicPeriodsUiWarn("loadPeriods:error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPeriods();
  }, [refreshToken]);

  const startEdit = (period) => {
    logAcademicPeriodsUiDebug("startEdit", {
      periodId: period?.id,
      periodName: period?.nombre
    });
    setSuccess("");
    setError("");
    setEditingId(period.id);
    setEditName(String(period.nombre || ""));
    setEditStart(String(period.start_date || ""));
    setEditEnd(String(period.end_date || ""));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditStart("");
    setEditEnd("");
  };

  const saveEdit = async () => {
    const safeName = editName.trim();

    setSuccess("");
    setError("");

    if (!editingId || !safeName || !editStart || !editEnd) {
      setError("Completa todos los campos para actualizar el periodo.");
      return;
    }

    if (!resolvedUserId) {
      setError("No se encontro una sesion valida de administrador.");
      return;
    }

    if (editStart > editEnd) {
      setError("La fecha de inicio no puede ser mayor que la fecha final.");
      return;
    }

    setIsSaving(true);

    logAcademicPeriodsUiDebug("saveEdit:request", {
      userId: resolvedUserId,
      idPeriodo: editingId,
      nombre: safeName,
      fechaInicio: editStart,
      fechaFinal: editEnd
    });

    const result = await updateAcademicPeriod({
      idUsuario: resolvedUserId,
      idPeriodo: editingId,
      nombre: safeName,
      fechaInicio: editStart,
      fechaFinal: editEnd
    });

    setIsSaving(false);
    logAcademicPeriodsUiDebug("saveEdit:response", result);

    if (!result?.success) {
      setError(result?.message || "No se pudo actualizar el periodo academico.");
      return;
    }

    setSuccess(result.message || "Periodo academico actualizado correctamente.");
    cancelEdit();
    await loadPeriods();
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;

    setSuccess("");
    setError("");

    if (!resolvedUserId) {
      setError("No se encontro una sesion valida de administrador.");
      return;
    }

    setIsDeleting(true);

    logAcademicPeriodsUiDebug("confirmDelete:request", {
      userId: resolvedUserId,
      idPeriodo: deleteTarget.id,
      nombre: deleteTarget.nombre
    });

    const result = await deleteAcademicPeriod({
      idUsuario: resolvedUserId,
      idPeriodo: deleteTarget.id
    });

    setIsDeleting(false);
    setDeleteTarget(null);
  logAcademicPeriodsUiDebug("confirmDelete:response", result);

    if (!result?.success) {
      setError(result?.message || "No se pudo eliminar el periodo academico.");
      return;
    }

    setSuccess(result.message || "Periodo academico eliminado correctamente.");
    await loadPeriods();
  };

  return (
    <section className="academicPeriodListCard" aria-labelledby="period-list-title">
      <header className="academicPeriodListCard__header">
        <h2 id="period-list-title">Periodos academicos registrados</h2>
        <button
          className="academicPeriodListCard__refresh"
          type="button"
          onClick={loadPeriods}
          disabled={isLoading || isSaving || isDeleting}
        >
          {isLoading ? "Actualizando..." : "Actualizar"}
        </button>
      </header>

      {error ? <p className="academicPeriodListCard__message academicPeriodListCard__message--error">{error}</p> : null}
      {success ? <p className="academicPeriodListCard__message academicPeriodListCard__message--success">{success}</p> : null}

      {isLoading ? <p className="academicPeriodListCard__state">Cargando periodos...</p> : null}

      {!isLoading && sortedPeriods.length === 0 ? (
        <p className="academicPeriodListCard__state">Aun no hay periodos academicos registrados.</p>
      ) : null}

      {!isLoading && sortedPeriods.length > 0 ? (
        <ul className="academicPeriodListCard__list">
          {sortedPeriods.map((period) => {
            const isEditing = editingId === period.id;

            return (
              <li key={period.id} className="academicPeriodListCard__item">
                {!isEditing ? (
                  <>
                    <div className="academicPeriodListCard__details">
                      <p className="academicPeriodListCard__name">{period.nombre}</p>
                      <p className="academicPeriodListCard__dates">
                        {formatDate(period.start_date)} - {formatDate(period.end_date)}
                      </p>
                    </div>

                    <div className="academicPeriodListCard__actions">
                      <button
                        className="remindcard-delete"
                        onClick={() => setDeleteTarget(period)}
                        aria-label="Eliminar periodo"
                        title="Eliminar"
                        type="button"
                        disabled={isDeleting}
                      >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                          <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                        </svg>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="academicPeriodListCard__editForm">
                    <input
                      type="text"
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      maxLength={120}
                      disabled={isSaving}
                      placeholder="Nombre del periodo"
                    />
                    <input
                      type="date"
                      value={editStart}
                      onChange={(event) => setEditStart(event.target.value)}
                      disabled={isSaving}
                    />
                    <input
                      type="date"
                      value={editEnd}
                      onChange={(event) => setEditEnd(event.target.value)}
                      disabled={isSaving}
                    />
                    <div className="academicPeriodListCard__editActions">
                      <button type="button" onClick={saveEdit} disabled={isSaving}>
                        {isSaving ? "Guardando..." : "Guardar"}
                      </button>
                      <button type="button" onClick={cancelEdit} disabled={isSaving}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}

      <MessageConfirmation
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Eliminar periodo academico"
        description={`Se eliminara el periodo ${deleteTarget?.nombre || ""}. Esta accion no se puede deshacer.`}
        confirmText={isDeleting ? "Eliminando..." : "Si, eliminar"}
        cancelText="No, mantener"
      />
    </section>
  );
}

export default AcademicPeriodListCard;
