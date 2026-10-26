import { useEffect } from "react";
import { useOfficialSchedule } from "./useSchedule";
import LoadingModal from "../../../shared/ui/LoadingModal";

/**
 * OficialFetcher - Hook wrapper para TanStack Query
 * Carga el horario oficial usando useOfficialSchedule (cache L1 automático)
 * Propiedades:
 *   - onDataLoaded: Función que recibe los datos cargados
 *   - userId: ID del usuario
 *   - academicPeriod: { id, nombre } del período académico a filtrar, null = todos
 */
export function OficialFetcher({ onDataLoaded, userId, academicPeriod }) {
  const periodId = academicPeriod?.id;
  const { data, isLoading, error, refetch } = useOfficialSchedule(userId, periodId);

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
        title="Cargando horario oficial"
      />
    );
  }

  if (error) {
    console.error("Error cargando horario oficial:", error);
    onDataLoaded?.([]);
  }

  return null;
}

export default OficialFetcher;