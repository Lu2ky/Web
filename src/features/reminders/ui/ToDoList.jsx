import { useEffect, useState } from "react";
import "./ToDoList.css";
import ToDoListTagFetcher from "../api/ToDoListTagFetcher";
import TaskAddModal from "./TaskAddModal";
import TaskEditModal from "./TaskEditModal";
import ToDoFilterModal from "./ToDoFilterModal";
import TodoListHeader from "./TodoListHeader";
import TodoTaskList from "./TodoTaskList";
import MessageConfirmation from "../../../shared/ui/MessageConfirmation";
import { useReminderTasks } from "../model/useReminderTasks";
import { GlassSurface, GlassButton } from "@/shared/ui/glass";

function ToDoList({ userId = "" }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);

  const {
    filteredTasks,
    activeFilters,
    setActiveFilters,
    isFilterModalOpen,
    setIsFilterModalOpen,
    taskToEdit,
    isEditModalOpen,
    isDeleteModalOpen,
    taskToDuplicate,
    isDuplicateModalOpen,
    reloadTasks,
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
  } = useReminderTasks(userId);

  useEffect(() => {
    const handleOpenTodoDrawer = () => setIsDrawerOpen(true);
    const handleCloseTodoDrawer = () => setIsDrawerOpen(false);

    window.addEventListener("onboarding:open-todo-drawer", handleOpenTodoDrawer);
    window.addEventListener("onboarding:close-todo-drawer", handleCloseTodoDrawer);
    return () => {
      window.removeEventListener("onboarding:open-todo-drawer", handleOpenTodoDrawer);
      window.removeEventListener("onboarding:close-todo-drawer", handleCloseTodoDrawer);
    };
  }, []);

  const hasActiveFilters =
    activeFilters.status !== "all" ||
    activeFilters.priority !== "all" ||
    activeFilters.tag.trim() !== "";

  return (
    <>
      <GlassButton
        variant="primary"
        size="sm"
        className="todo-drawer-toggle"
        onClick={() => setIsDrawerOpen(true)}
        title={isDrawerOpen ? "Cerrar lista de tareas" : "Abrir lista de tareas"}
        aria-label={isDrawerOpen ? "Cerrar lista de tareas" : "Abrir lista de tareas"}
        style={{ display: isDrawerOpen ? "none" : undefined }}
      >
        TO-DO
      </GlassButton>

      {isDrawerOpen && <div className="todo-overlay" onClick={() => setIsDrawerOpen(false)} />}

      <GlassSurface weight="card" corner="xl" shadow="lg" border className={`todolist-panel${isDrawerOpen ? " open" : ""}`} data-testid="todo-panel">
        <ToDoListTagFetcher userId={userId} onDataLoaded={setAvailableTags} />

        <TodoListHeader
          selectionMode={bulk.selectionMode}
          onToggleSelection={bulk.toggleSelectionMode}
          onOpenFilter={() => setIsFilterModalOpen(true)}
          userId={userId}
          onSaved={reloadTasks}
          availableTags={availableTags}
          selectedCount={bulk.selectedTaskIds.size}
          totalCount={filteredTasks.length}
          onSelectAll={bulk.toggleAllTasks}
          onOpenBulkDelete={() => bulk.setIsBulkDeleteModalOpen(true)}
        />

        <div className="todolist-section-label">
          TASKS <span className="todolist-task-count">({filteredTasks.length})</span>
          {hasActiveFilters && <span className="todolist-active-filter-chip">Filtrado</span>}
        </div>

        <TodoTaskList
          tasks={filteredTasks}
          userId={userId}
          selectionMode={bulk.selectionMode}
          selectedTaskIds={bulk.selectedTaskIds}
          onToggle={toggleTask}
          onEdit={requestEdit}
          onDelete={requestDelete}
          onDuplicate={requestDuplicate}
          onSelection={bulk.toggleTaskSelection}
        />

        <TaskAddModal
          isOpen={isDuplicateModalOpen}
          onClose={closeDuplicateModal}
          onSave={saveDuplicate}
          task={taskToDuplicate}
          title={taskToDuplicate ? "Duplicar Tarea" : "Nueva Tarea"}
          userId={userId}
          availableTags={availableTags}
          onboardingId="todo-duplicate-modal"
        />

        <TaskEditModal
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          onSave={saveEdit}
          task={taskToEdit}
          title={taskToEdit ? "Editar Tarea" : "Nueva Tarea"}
          userId={userId}
          availableTags={availableTags}
        />

        <MessageConfirmation
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          onConfirm={confirmDelete}
          title="Eliminar Tarea"
          description="¿Estás seguro de que deseas eliminar esta tarea? Esta acción no se puede deshacer."
        />

        <MessageConfirmation
          isOpen={bulk.isBulkDeleteModalOpen}
          onClose={bulk.closeBulkDeleteModal}
          onConfirm={bulk.handleBulkDelete}
          title="Eliminar Tareas"
          description={`¿Estás seguro de que deseas eliminar ${bulk.selectedTaskIds.size} tarea${
            bulk.selectedTaskIds.size !== 1 ? "s" : ""
          }? Esta acción no se puede deshacer.`}
        />

        <ToDoFilterModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          onApply={setActiveFilters}
          initialFilters={activeFilters}
          availableTags={availableTags}
        />
      </GlassSurface>
    </>
  );
}

export default ToDoList;