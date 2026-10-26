/** Selección múltiple y borrado masivo de recordatorios. */

import { useCallback, useState } from "react";
import ReminderService from "../api/reminderService";
import { getUserData } from "../../../shared/api/userService";

export function useBulkSelection({ userId, tasks, filteredTasks, setTasks }) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState(new Set());
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  const toggleSelectionMode = useCallback(() => {
    if (selectionMode) {
      setSelectedTaskIds(new Set());
    }
    setSelectionMode((current) => !current);
  }, [selectionMode]);

  const toggleTaskSelection = useCallback((taskId) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }, []);

  const toggleAllTasks = useCallback(() => {
    if (selectedTaskIds.size === filteredTasks.length) {
      setSelectedTaskIds(new Set());
      return;
    }
    setSelectedTaskIds(new Set(filteredTasks.map((task) => task.id)));
  }, [filteredTasks, selectedTaskIds.size]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedTaskIds.size === 0) return;

    const tasksToDelete = Array.from(selectedTaskIds)
      .map((id) => tasks.find((task) => task.id === id))
      .filter(Boolean);

    const apiIds = tasksToDelete.map((task) => task.recordatorioId ?? task.id);

    try {
      const userData = await getUserData(userId);
      const userObj = Array.isArray(userData) ? userData[0] : userData;
      const actualUserId =
        userObj?.id ?? (Number.isInteger(Number(userId)) ? Number(userId) : null);

      if (!actualUserId) {
        throw new Error("No se pudo obtener el ID del usuario");
      }

      await ReminderService.deleteMultipleReminders(actualUserId, apiIds);
    } catch (err) {
      return; // No actualizar la UI si hay error
    }

    setTasks((prev) => prev.filter((task) => !selectedTaskIds.has(task.id)));
    setSelectedTaskIds(new Set());
    setIsBulkDeleteModalOpen(false);
    setSelectionMode(false);

    tasksToDelete.forEach(() => {
      window.dispatchEvent(new CustomEvent("onboarding:todo-deleted"));
    });
  }, [selectedTaskIds, setTasks, tasks, userId]);

  const closeBulkDeleteModal = useCallback(() => {
    setIsBulkDeleteModalOpen(false);
  }, []);

  return {
    selectionMode,
    selectedTaskIds,
    isBulkDeleteModalOpen,
    setIsBulkDeleteModalOpen,
    toggleSelectionMode,
    toggleTaskSelection,
    toggleAllTasks,
    handleBulkDelete,
    closeBulkDeleteModal,
  };
}

export default useBulkSelection;
