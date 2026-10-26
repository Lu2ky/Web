/**
 * Resincroniza los recordatorios futuros cuando el usuario cambia la
 * anticipación de las notificaciones.
 *
 * El backend guarda la anticipación en el perfil, no en cada recordatorio, así
 * que hay que recrear los futuros para que el nuevo valor aplique. El evento
 * `preferences:anticipation-updated` lo emite la feature de perfil.
 */

import { useCallback, useEffect, useRef } from "react";
import ReminderService from "../api/reminderService";
import { getUserData } from "../../../shared/api/userService";
import { getTaskPriority, normalizePriority, parseDueDateForFilter } from "../lib/taskFilters";

export function useAnticipationSync({ userId, tasks, reloadTasks }) {
  const inProgressRef = useRef(false);

  const isFutureTask = useCallback((task) => {
    const dueDate = parseDueDateForFilter(task?.dueDate);
    return Boolean(dueDate && dueDate >= new Date());
  }, []);

  const syncFutureTasks = useCallback(
    async (event) => {
      if (!userId) return;

      const eventUserId = String(event?.detail?.userId || "").trim();
      if (eventUserId && eventUserId !== String(userId)) return;
      if (inProgressRef.current) return;

      inProgressRef.current = true;

      const snapshotFutureTasks = tasks
        .filter((task) => isFutureTask(task))
        .map((task) => ({
          ...task,
          tags: Array.isArray(task.tags)
            ? task.tags.map((tag) => (typeof tag === "object" && tag !== null ? { ...tag } : tag))
            : [],
        }));

      if (snapshotFutureTasks.length === 0) {
        inProgressRef.current = false;
        return;
      }

      try {
        const userData = await getUserData(userId);
        const userObj = Array.isArray(userData) ? userData[0] : userData;
        const actualUserId =
          userObj?.id ?? (Number.isInteger(Number(userId)) ? Number(userId) : null);

        if (!actualUserId) {
          throw new Error("No se pudo resolver el ID numérico del usuario");
        }

        const apiIds = snapshotFutureTasks
          .map((task) => task.recordatorioId ?? task.idTodo ?? task.id)
          .filter(Boolean);

        if (apiIds.length === 0) {
          await reloadTasks();
          return;
        }

        await ReminderService.deleteMultipleReminders(actualUserId, apiIds);

        for (const task of snapshotFutureTasks) {
          const priority = getTaskPriority(task) || normalizePriority(task.priority) || "media";
          const tagLabels = (Array.isArray(task.tags) ? task.tags : [])
            .filter((tag) =>
              typeof tag === "string" ? true : !String(tag?.type ?? "").startsWith("priority-")
            )
            .map((tag) => (typeof tag === "string" ? tag : tag?.label || ""))
            .filter(Boolean);

          const addResult = await ReminderService.addReminder(
            actualUserId,
            task.name || "",
            task.description || "",
            task.dueDate,
            priority,
            tagLabels
          );

          if (task.completed === true) {
            const insertedId = addResult?.toDoId ?? addResult?.reminderId;
            if (insertedId) {
              await ReminderService.updateState(insertedId, true, task);
            }
          }
        }

        await reloadTasks();
      } catch (error) {
        console.error("Error al resincronizar tareas tras cambio de anticipación:", error);
        await reloadTasks();
      } finally {
        inProgressRef.current = false;
      }
    },
    [isFutureTask, reloadTasks, tasks, userId]
  );

  useEffect(() => {
    window.addEventListener("preferences:anticipation-updated", syncFutureTasks);
    return () => {
      window.removeEventListener("preferences:anticipation-updated", syncFutureTasks);
    };
  }, [syncFutureTasks]);
}

export default useAnticipationSync;
