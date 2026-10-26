import { useEffect } from "react";
import { 
  usePersonalSchedule, 
  useAddPersonalActivity as useAddPersonalActivityHook,
  useUpdatePersonalActivity as useUpdatePersonalActivityHook,
  useDeletePersonalActivity as useDeletePersonalActivityHook
} from "./useSchedule";
import { apiClient } from "../../../shared/api/apiClient";
import { getSessionCodUsuario } from "../../../shared/session/authSession";
import LoadingModal from "../../../shared/ui/LoadingModal";

const toDatePart = (value) => {
  if (!value) return null;
  const raw = String(value);
  const iso = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
};

const toTimePart = (value) => {
  if (!value) return null;
  const raw = String(value);
  const match = raw.match(/(\d{2}:\d{2})(?::\d{2})?/);
  return match ? match[1] : null;
};

/** Traduce el modelo de la UI al contrato de Go (NewPersonalActivity). */
function toPersonalPayload(userId, data = {}) {
  return {
    P_usuario: Number(userId),
    P_nombreCurso: data.title ?? data.name ?? data.activity_name ?? "",
    P_descripcion: data.description ?? "",
    P_fechaInicio: toDatePart(data.dateStart ?? data.date_start),
    P_fechaFin: toDatePart(data.dateEnd ?? data.date_end),
    P_dia: Number(data.day ?? 0),
    P_horaInicio: toTimePart(data.startHour ?? data.start_time),
    P_horaFin: toTimePart(data.endHour ?? data.end_time),
    codUsuario: getSessionCodUsuario(),
  };
}

/**
 * PersonalFetcher - Hook wrapper para TanStack Query
 * Carga el horario personal/actividades usando usePersonalSchedule (cache L1 automático)
 * Propiedades:
 *   - onDataLoaded: Función que recibe los datos normalizados
 *   - userId: ID del usuario
 *   - academicPeriod: { id, nombre } del período académico a filtrar, null = todos
 */
export function PersonalFetcher({ onDataLoaded, userId, academicPeriod }) {
  const periodId = academicPeriod?.id;
  const { data, isLoading, error, refetch } = usePersonalSchedule(userId, periodId);

  useEffect(() => {
    if (data !== undefined) {
      onDataLoaded?.(data || []);
    }
  }, [data, onDataLoaded]);

  useEffect(() => {
    if (userId && !isLoading) {
      refetch();
    }
  }, [userId, periodId, refetch]);

  if (isLoading) {
    return (
      <LoadingModal
        isOpen={true}
        title="Cargando horario personal"
      />
    );
  }

  if (error) {
    console.error("Error cargando horario personal:", error);
    onDataLoaded?.([]);
  }

  return null;
}

/**
 * Exporta la mutación para agregar actividad personal (compatibilidad con componentes existentes)
 * @returns {Object} { mutateAsync, isLoading, isError, error }
 */
export function useAddPersonalActivity() {
  return useAddPersonalActivityHook();
}

/**
 * Exporta la mutación para actualizar actividad personal
 * @returns {Object} { mutateAsync, isLoading, isError, error }
 */
export function useUpdatePersonalActivity() {
  return useUpdatePersonalActivityHook();
}

/**
 * Exporta la mutación para eliminar actividad personal
 * @returns {Object} { mutateAsync, isLoading, isError, error }
 */
export function useDeletePersonalActivity() {
  return useDeletePersonalActivityHook();
}

/**
 * Funciones de escritura para componentes que no usan hooks.
 * Usan `apiClient` directamente: no se llama a un hook fuera de React.
 */
export async function addPersonalActivity(userId, activityData) {
  const raw = await apiClient.post('/schedules/personal', toPersonalPayload(userId, activityData));
  return { ...raw, id: raw?.new_activity ?? raw?.id };
}

export async function updatePersonalActivity(userId, activityId, activityData) {
  return apiClient.post('/schedules/personal/update', {
    P_idCurso: Number(activityId),
    ...toPersonalPayload(userId, activityData),
  });
}

export async function deletePersonalActivity(userId, activityId) {
  return apiClient.post('/schedules/personal/delete-or-recover', {
    IdPersonalSchedule: Number(activityId),
    N_idUsuario: Number(userId),
    codUsuario: getSessionCodUsuario(),
  });
}

export default PersonalFetcher;