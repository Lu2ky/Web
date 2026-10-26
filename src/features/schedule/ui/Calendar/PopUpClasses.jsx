import ModalBase from "../../../../shared/ui/Modal";
import "../PopUpClasses.css";
import { useClassComments } from "../../model/useClassComments";
import ClassDetailsSummary from "./ClassDetailsSummary";
import ClassCommentsSection from "./ClassCommentsSection";

export const PopUpClasses = ({
  isOpen = false,
  onClose = () => {},
  classData = {},
  userId = null,
}) => {
  const comments = useClassComments({ isOpen, classData, userId, onClose });

  // Datos por defecto si no se proporcionan.
  const data = {
    subject_name: classData?.subject_name || "Asignatura",
    date_range: classData?.date_range || "Ene XX - (Fecha)",
    instructor_name: classData?.instructor_name || "Docente",
    nrc: classData?.nrc || "00000",
    credits: classData?.credits || "0",
    campus: classData?.campus || "Campus",
    schedule: classData?.schedule || [],
    ...classData,
  };

  if (!comments.is_open) return null;

  return (
    <ModalBase
      isOpen={comments.is_open}
      onClose={comments.handle_close}
      title={"Detalle de Asignatura"}
      showFooter={false}
    >
      <ClassDetailsSummary data={data} />

      <ClassCommentsSection
        comments={comments.comments}
        editingId={comments.editingId}
        editText={comments.editText}
        onEditTextChange={comments.setEditText}
        savingCommentId={comments.savingCommentId}
        deletingCommentId={comments.deletingCommentId}
        isCommentsBusy={comments.isCommentsBusy}
        onAddComment={comments.handle_add_comment}
        onDeleteComment={comments.handle_delete_comment}
        onStartEdit={comments.handle_start_edit}
        onSaveEdit={comments.handle_save_edit}
        onCancelEdit={comments.handle_cancel_edit}
      />

      <div className="popup-footer">
        <button
          className="close-button"
          onClick={comments.handle_close}
          title="Cerrar ventana de detalle"
          aria-label="Cerrar"
        >
          Cerrar Detalle
        </button>
      </div>
    </ModalBase>
  );
};

export default PopUpClasses;
