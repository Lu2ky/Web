/**
 * Estado del listado de periodos académicos: resolución del id numérico,
 * carga, edición y borrado.
 *
 * El `userId` de sesión es el nombre de usuario; las operaciones de escritura
 * necesitan el id numérico, que se resuelve una sola vez con `getUserData`.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deleteAcademicPeriod,
  fetchAcademicPeriods,
  updateAcademicPeriod,
} from "../../../shared/api/academicPeriodsService";
import { getUserData } from "../../../shared/api/userService";
import {
  logAcademicPeriodsDebug,
  logAcademicPeriodsWarn,
} from "../lib/academicPeriods";

export function useAcademicPeriods({ userId = null, refreshToken = 0 }) {
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

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const resolveUserId = async () => {
      if (!userId) {
        if (isMounted) setResolvedUserId(null);
        return;
      }

      try {
        logAcademicPeriodsDebug("resolveUserId:start", { userId });
        const currentData = await getUserData(userId, {
          signal: abortController.signal,
        });
        const currentUser = Array.isArray(currentData) ? currentData[0] : currentData;
        const candidateId = currentUser?.id ?? null;

        if (!candidateId) {
          throw new Error("No se encontró idUsuario en los datos del usuario");
        }

        const numericId = typeof candidateId === "number" ? candidateId : Number(candidateId);

        if (isMounted) {
          setResolvedUserId(numericId);
          logAcademicPeriodsDebug("resolveUserId:success", {
            userId,
            resolvedUserId: numericId,
          });
        }
      } catch (resolveError) {
        if (resolveError.name !== "AbortError" && isMounted) {
          logAcademicPeriodsWarn("resolveUserId:error", {
            userId,
            error: resolveError?.message || resolveError,
          });
        }
      }
    };

    resolveUserId();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [userId]);

  const sortedPeriods = useMemo(
    () =>
      [...periods].sort((a, b) =>
        String(a.nombre || "").localeCompare(String(b.nombre || ""))
      ),
    [periods]
  );

  const loadPeriods = useCallback(async () => {
    setIsLoading(true);
    setError("");
    logAcademicPeriodsDebug("loadPeriods:start");

    try {
      const data = await fetchAcademicPeriods();
      setPeriods(Array.isArray(data) ? data : []);
      logAcademicPeriodsDebug("loadPeriods:success", {
        total: Array.isArray(data) ? data.length : 0,
      });
    } catch {
      setError("No se pudieron cargar los periodos academicos.");
      setPeriods([]);
      logAcademicPeriodsWarn("loadPeriods:error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPeriods();
  }, [loadPeriods, refreshToken]);

  const startEdit = useCallback((period) => {
    logAcademicPeriodsDebug("startEdit", {
      periodId: period?.id,
      periodName: period?.nombre,
    });
    setSuccess("");
    setError("");
    setEditingId(period.id);
    setEditName(String(period.nombre || ""));
    setEditStart(String(period.start_date || ""));
    setEditEnd(String(period.end_date || ""));
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditName("");
    setEditStart("");
    setEditEnd("");
  }, []);

  const saveEdit = useCallback(async () => {
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

    logAcademicPeriodsDebug("saveEdit:request", {
      userId: resolvedUserId,
      idPeriodo: editingId,
      nombre: safeName,
      fechaInicio: editStart,
      fechaFinal: editEnd,
    });

    const result = await updateAcademicPeriod({
      idUsuario: resolvedUserId,
      idPeriodo: editingId,
      nombre: safeName,
      fechaInicio: editStart,
      fechaFinal: editEnd,
    });

    setIsSaving(false);
    logAcademicPeriodsDebug("saveEdit:response", result);

    if (!result?.success) {
      setError(result?.message || "No se pudo actualizar el periodo academico.");
      return;
    }

    setSuccess(result.message || "Periodo academico actualizado correctamente.");
    cancelEdit();
    await loadPeriods();
  }, [cancelEdit, editEnd, editName, editStart, editingId, loadPeriods, resolvedUserId]);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget?.id) return;

    setSuccess("");
    setError("");

    if (!resolvedUserId) {
      setError("No se encontro una sesion valida de administrador.");
      return;
    }

    setIsDeleting(true);

    logAcademicPeriodsDebug("confirmDelete:request", {
      userId: resolvedUserId,
      idPeriodo: deleteTarget.id,
      nombre: deleteTarget.nombre,
    });

    const result = await deleteAcademicPeriod({
      idUsuario: resolvedUserId,
      idPeriodo: deleteTarget.id,
    });

    setIsDeleting(false);
    setDeleteTarget(null);
    logAcademicPeriodsDebug("confirmDelete:response", result);

    if (!result?.success) {
      setError(result?.message || "No se pudo eliminar el periodo academico.");
      return;
    }

    setSuccess(result.message || "Periodo academico eliminado correctamente.");
    await loadPeriods();
  }, [deleteTarget, loadPeriods, resolvedUserId]);

  return {
    periods: sortedPeriods,
    isLoading,
    isSaving,
    isDeleting,
    error,
    success,
    editingId,
    editName,
    setEditName,
    editStart,
    setEditStart,
    editEnd,
    setEditEnd,
    deleteTarget,
    setDeleteTarget,
    loadPeriods,
    startEdit,
    cancelEdit,
    saveEdit,
    confirmDelete,
  };
}

export default useAcademicPeriods;
