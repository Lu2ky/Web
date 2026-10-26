import { useEffect } from "react";
import { useReminders, useReminderTags } from "./useReminders";
import LoadingModal from "../../../shared/ui/LoadingModal";

/**
 * ToDoListFetcher - Hook wrapper para TanStack Query
 * Carga recordatorios y etiquetas usando hooks centralizados
 * Propiedades:
 *   - onDataLoaded: Función que recibe { reminders, tags }
 *   - userId: ID del usuario
 */
export function ToDoListFetcher({ onDataLoaded, userId }) {
  const { data: reminders, isLoading: loadingReminders, error: errorReminders, refetch: refetchReminders } = useReminders(userId);
  const { data: tags, isLoading: loadingTags, error: errorTags, refetch: refetchTags } = useReminderTags(userId);

  useEffect(() => {
    if (reminders !== undefined && tags !== undefined) {
      onDataLoaded?.({ reminders: reminders || [], tags: tags || [] });
    }
  }, [reminders, tags, onDataLoaded]);

  useEffect(() => {
    if (userId && !loadingReminders && !loadingTags) {
      refetchReminders();
      refetchTags();
    }
  }, [userId, loadingReminders, loadingTags, refetchReminders, refetchTags]);

  const isLoading = loadingReminders || loadingTags;

  if (isLoading) {
    return (
      <LoadingModal
        isOpen={true}
        title="Cargando tareas"
      />
    );
  }

  if (errorReminders || errorTags) {
    console.error("Error cargando tareas:", errorReminders || errorTags);
    onDataLoaded?.({ reminders: [], tags: [] });
  }

  return null;
}

export default ToDoListFetcher;