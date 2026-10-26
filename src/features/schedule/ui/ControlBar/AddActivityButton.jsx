import { useRef } from "react";
import "./AddActivityButton.css";
import { useAddActivity } from "../../model/useAddActivity";
import AddActivityModal from "./AddActivityModal";

function AddActivityButton({ userId, idCourse, onActivityAdd }) {
  const triggerRef = useRef(null);
  const titleInputRef = useRef(null);

  const activity = useAddActivity({ userId, idCourse, onActivityAdd });

  return (
    <>
      <button
        ref={triggerRef}
        className="addButton"
        onClick={activity.openModal}
        type="button"
        data-onboarding-id="add-activity-button"
        title="Agregar actividad"
        aria-label="Agregar actividad"
      >
        Agregar actividad
      </button>

      <AddActivityModal
        isOpen={activity.isOpen}
        formData={activity.formData}
        error={activity.error}
        loading={activity.loading}
        onChange={activity.handleChange}
        onClose={activity.closeModal}
        onSave={activity.handleSave}
        titleInputRef={titleInputRef}
        restoreFocusRef={triggerRef}
      />
    </>
  );
}

export default AddActivityButton;
