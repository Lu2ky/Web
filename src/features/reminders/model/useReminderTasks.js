/**
 * Estado y operaciones de la lista de recordatorios.
 *
 * La UI no llama a la API directamente: este hook concentra carga, edición,
 * duplicado, borrado y la resincronización tras cambiar la anticipación.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import ReminderService from "../api/reminderService";
import { getUserData } from "../../../shared/api/userService";
import { defaultFilters, filterTasks, initialTasks } from "../lib/taskFilters";
import { useAnticipationSync } from "./useAnticipationSync";
import { useBulkSelection } from "./useBulkSelection";

export function useReminderTasks(userId) {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeFilters, setActiveFilters] = useState(defaultFilters);

  const [taskToEdit, setTaskToEdit] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDuplicate, setTaskToDuplicate] = useState(null);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const loadReminderTasks = useCallback(async () => {
    if (!userId) {
      setTasks(initialTasks);
      return;
    }

    try {
      const reminders = await ReminderService.getByUser(userId);

      // Defensa ante IDs duplicados que rompen las keys de React.
      const seenIds = new Set();
      const uniqueReminders = reminders.filter((task) => {
        if (seenIds.has(task.id)) {
          console.warn(
            `[ToDoList] Duplicate task ID detected in loaded reminders: ${task.id}, filtering out`
          );
          return false;
        }
        seenIds.add(task.id);
        return true;
      });

      setTasks(uniqueReminders);
    } catch (error) {
      console.error("Error al cargar recordatorios:", error);
      setTasks([]);
    }
  }, [userId]);

  useEffect(() => {
    loadReminderTasks();
  }, [loadReminderTasks]);

  useAnticipationSync({ userId, tasks, reloadTasks: loadReminderTasks });

  const filteredTasks = useMemo(() => filterTasks(tasks, activeFilters), [tasks, activeFilters]);

  const bulk = useBulkSelection({
    userId,
    tasks,
    filteredTasks,
    setTasks,
  });

  useEffect(() => {
    const handleCloseUnrelatedUi = (event) => {
      const allowOpenUi = Array.isArray(event?.detail?.allowOpenUi)
        ? event.detail.allowOpenUi
        : [];

      if (!allowOpenUi.includes("modal-todo-filter")) setIsFilterModalOpen(false);
      if (!allowOpenUi.includes("modal-todo-edit")) {
        setIsEditModalOpen(false);
        setTaskToEdit(null);
      }
      if (!allowOpenUi.includes("modal-todo-delete")) {
        setIsDeleteModalOpen(false);
        setTaskToDelete(null);
      }
      if (!allowOpenUi.includes("modal-todo-duplicate")) {
        setIsDuplicateModalOpen(false);
        setTaskToDuplicate(null);
      }
    };

    window.addEventListener("onboarding:close-unrelated-ui", handleCloseUnrelatedUi);
    return () => window.removeEventListener("onboarding:close-unrelated-ui", handleCloseUnrelatedUi);
  }, []);

  const toggleTask = useCallback(
    async (id) => {
      const task = tasks.find((item) => item.id === id);
      if (!task) {
        console.warn("[ToDoList] toggleTask — task not found for id:", id);
        return;
      }

      const newCompletedState = !task.completed;

      setTasks((prev) =>
        prev.map((item) => (item.id === id ? { ...item, completed: newCompletedState } : item))
      );

      try {
        await ReminderService.updateState(id, newCompletedState, task);
      } catch (error) {
        console.error("[ToDoList] toggleTask — ERROR updating state:", error);
        setTasks((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, completed: !newCompletedState } : item
          )
        );
      }
    },
    [tasks]
  );

  const requestDelete = useCallback(
    (id) => {
      setTaskToDelete(tasks.find((task) => task.id === id) ?? { id });
      setIsDeleteModalOpen(true);
    },
    [tasks]
  );

  const requestEdit = useCallback(
    (id) => {
      setTaskToEdit(tasks.find((task) => task.id === id) ?? null);
      setIsEditModalOpen(true);
    },
    [tasks]
  );

  const requestDuplicate = useCallback(
    (id) => {
      setTaskToDuplicate(tasks.find((task) => task.id === id) ?? null);
      setIsDuplicateModalOpen(true);
    },
    [tasks]
  );

  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setTaskToEdit(null);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setTaskToDelete(null);
  }, []);

  const closeDuplicateModal = useCallback(() => {
    setIsDuplicateModalOpen(false);
    setTaskToDuplicate(null);
  }, []);

  const saveEdit = useCallback(
    async (formData) => {
      if (!taskToEdit) {
        closeEditModal();
        return;
      }

      const updatedTask = {
        ...taskToEdit,
        name: formData.name,
        description: formData.description,
        dueDate: formData.dueDate,
        tags: formData.tags,
        priority: formData.priority,
      };

      setTasks((prev) =>
        prev.map((task) => (task.id === taskToEdit.id ? updatedTask : task))
      );
      closeEditModal();

      try {
        await ReminderService.updateFromEdit(taskToEdit, updatedTask);
        await loadReminderTasks();
      } catch (error) {
        console.error("Error al actualizar recordatorio:", error);
        await loadReminderTasks();
      }
    },
    [closeEditModal, loadReminderTasks, taskToEdit]
  );

  const saveDuplicate = useCallback(
    async (formData) => {
      if (!userId) {
        closeDuplicateModal();
        return;
      }

      try {
        const userData = await getUserData(userId);
        const rawUser = Array.isArray(userData) ? userData[0] : userData;
        const idUsuario =
          rawUser?.id ?? (Number.isInteger(Number(userId)) ? Number(userId) : null);

        if (!idUsuario) {
          throw new Error("No se pudo resolver el ID numérico del usuario");
        }

        const tagLabels = (Array.isArray(formData?.tags) ? formData.tags : [])
          .filter((tag) =>
            typeof tag === "string" ? true : !String(tag?.type ?? "").startsWith("priority-")
          )
          .map((tag) => (typeof tag === "string" ? tag : tag?.label || ""))
          .filter(Boolean);

        await ReminderService.addReminder(
          idUsuario,
          formData.name,
          formData.description,
          formData.dueDate,
          formData.priority,
          tagLabels
        );

        closeDuplicateModal();
        await loadReminderTasks();
      } catch (error) {
        console.error("Error al duplicar recordatorio:", error);
        await loadReminderTasks();
      }
    },
    [closeDuplicateModal, loadReminderTasks, userId]
  );

  const confirmDelete = useCallback(async () => {
    if (userId && taskToDelete) {
      const apiId = taskToDelete.recordatorioId ?? taskToDelete.idTodo ?? taskToDelete.id;
      try {
        await ReminderService.deleteReminder(apiId, userId);
        await loadReminderTasks();
      } catch (err) {
        console.error("Error al eliminar recordatorio en servidor:", err);
      }
    }

    closeDeleteModal();
    window.dispatchEvent(new CustomEvent("onboarding:todo-deleted"));
  }, [closeDeleteModal, loadReminderTasks, taskToDelete, userId]);

  return {
    tasks,
    filteredTasks,
    activeFilters,
    setActiveFilters,
    isFilterModalOpen,
    setIsFilterModalOpen,
    taskToEdit,
    isEditModalOpen,
    taskToDelete,
    isDeleteModalOpen,
    taskToDuplicate,
    isDuplicateModalOpen,
    reloadTasks: loadReminderTasks,
    toggleTask,
    requestDelete,
    requestEdit,
    requestDuplicate,
    closeEditModal,
    closeDeleteModal,
    closeDuplicateModal,
    saveEdit,
    saveDuplicate,
    confirmDelete,
    bulk,
  };
}

export default useReminderTasks;
