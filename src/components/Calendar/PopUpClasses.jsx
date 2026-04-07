import { useState, useEffect } from "react";
import { CommentButton } from "./CommentButton";
import fetchComments from "../../services/commentFetcher";
import addComment from "../../services/addComentService";
import updateComment from "../../services/updateComentService";
import deleteComment from "../../services/removeComentService";
import "../../styles/PopUpClasses.css";

export const PopUpClasses = ({
  isOpen = false,
  onClose = () => { },
  classData = {},
  userId = null,
}) => {
  const [is_open, set_is_open] = useState(isOpen);
  const [comments, set_comments] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [savingCommentId, setSavingCommentId] = useState(null);
  const [deletingCommentId, setDeletingCommentId] = useState(null);

  // Sincronizar el estado interno con el prop externo
  useEffect(() => {
    set_is_open(isOpen);
    if (isOpen) {
      window.dispatchEvent(new CustomEvent("onboarding:official-card-opened"));
    }
  }, [isOpen]);

  useEffect(() => {
    const handleCloseUnrelatedUi = (event) => {
      const allowOpenUi = Array.isArray(event?.detail?.allowOpenUi) ? event.detail.allowOpenUi : [];
      if (!allowOpenUi.includes("modal-official-card")) {
        set_is_open(false);
        onClose();
      }
    };

    window.addEventListener("onboarding:close-unrelated-ui", handleCloseUnrelatedUi);
    return () => window.removeEventListener("onboarding:close-unrelated-ui", handleCloseUnrelatedUi);
  }, [onClose]);

  // Limpiar comentarios al cambiar de asignatura o al abrir
  useEffect(() => {
    set_comments([]);
    setReloadKey((k) => k + 1);
  }, [classData?.id, classData?.nrc]);

  const commentCourseId = classData?.apiData?.N_idCurso
    ?? classData?.apiData?.id_course
    ?? classData?.apiData?.idCourse
    ?? classData?.apiData?.ID_CURSO
    ?? classData?.apiData?.id
    ?? classData?.id
    ?? classData?.nrc;

  const commentScheduleId = classData?.apiData?.N_idHorario
    ?? classData?.apiData?.id_horario
    ?? classData?.apiData?.id_schedule
    ?? classData?.apiData?.idSchedule
    ?? classData?.apiData?.ID_HORARIO
    ?? classData?.apiData?.schedule_id
    ?? classData?.scheduleId
    ?? null;

  const commentUserId = userId
    ?? classData?.apiData?.N_idUsuario
    ?? classData?.apiData?.id_user
    ?? classData?.apiData?.idUser
    ?? classData?.apiData?.ID_USUARIO
    ?? classData?.apiData?.ID_USER
    ?? null;

  useEffect(() => {
    const shouldFetch = is_open && commentUserId && (commentCourseId || commentScheduleId);
    if (!shouldFetch) {
      set_comments([]);
      return;
    }

    let isCancelled = false;

    const loadComments = async () => {
      try {
        const loaded = await fetchComments({
          userId: commentUserId,
          courseId: commentCourseId,
          scheduleId: commentScheduleId,
        });
        if (!isCancelled) {
          set_comments(loaded);
        }
      } catch (error) {
        console.error("Error al cargar comentarios:", error);
      }
    };

    loadComments();

    return () => {
      isCancelled = true;
    };
  }, [is_open, commentUserId, commentCourseId, commentScheduleId, reloadKey]);

  // Datos por defecto si no se proporcionan
  const data = {
    subject_name: classData?.subject_name || "Asignatura",
    date_range: classData?.date_range || "Ene XX - (Fecha)",
    instructor_name: classData?.instructor_name || "Docente",
    nrc: classData?.nrc || "00000",
    credits: classData?.credits || "0",
    campus: classData?.campus || "Campus",
    schedule: classData?.schedule || [], // Array de objetos con {day, start_time, end_time, classroom, type}
    ...classData,
  };

  const handle_close = () => {
    set_is_open(false);
    onClose();
  };

  const handle_add_comment = async (comment_text) => {
    const courseId = classData?.apiData?.N_idCurso
      ?? classData?.apiData?.id_course
      ?? classData?.apiData?.idCourse
      ?? classData?.apiData?.ID_CURSO
      ?? classData?.apiData?.id
      ?? classData?.id
      ?? classData?.nrc;
    const scheduleId = commentScheduleId ?? courseId;

    if (!courseId || !scheduleId) {
      throw new Error("Cannot add comment: missing courseId/scheduleId");
    }

    if (!commentUserId) {
      throw new Error("Cannot add comment: userId is missing");
    }

    const optimisticId = `temp-${Date.now()}`;
    const optimisticComment = {
      id: optimisticId,
      text: comment_text,
      timestamp: "Ahora",
    };

    setIsAddingComment(true);
    set_comments((prev) => [optimisticComment, ...prev]);

    try {
      const result = await addComment({
        scheduleId,
        userId: commentUserId,
        courseId,
        courseName: classData?.subject_name || "",
        comment: comment_text,
      });

      const wait = (ms) => new Promise((resolve) => {
        window.setTimeout(resolve, ms);
      });

      let found = false;
      let lastLoaded = [];

      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const loaded = await fetchComments({
            userId: commentUserId,
            courseId,
            scheduleId,
          });
          lastLoaded = loaded;

          const expected = String(comment_text).trim().toLowerCase();
          found = loaded.some((comment) => String(comment?.text ?? "").trim().toLowerCase() === expected);
          if (found) {
            set_comments(loaded);
          }
          if (found) break;
        } catch (reloadError) {
          console.error("Error recargando comentarios tras guardar:", reloadError);
        }

        await wait(300);
      }

      if (!found) {
        set_comments((prev) => {
          const withoutOptimistic = prev.filter((comment) => comment.id !== optimisticId);
          if (lastLoaded.length > 0) {
            return [optimisticComment, ...lastLoaded];
          }
          return withoutOptimistic;
        });
      }

      setReloadKey((k) => k + 1);

      return result;
    } catch (err) {
      set_comments((prev) => prev.filter((comment) => comment.id !== optimisticId));
      console.error("Error añadiendo comentario:", err);
      throw err;
    } finally {
      setIsAddingComment(false);
    }
  };

  const handle_delete_comment = async (comment_id) => {
    if (savingCommentId !== null || deletingCommentId !== null) return;

    const previousComments = comments;
    setDeletingCommentId(comment_id);
    set_comments((prev) => prev.filter((comment) => comment.id !== comment_id));

    try {
      await deleteComment(comment_id, commentCourseId);
      setReloadKey((k) => k + 1);
    } catch (err) {
      set_comments(previousComments);
      console.error("Error eliminando comentario:", err);
    } finally {
      setDeletingCommentId(null);
    }
  };

  const handle_start_edit = (comment) => {
    setEditingId(comment.id);
    setEditText(comment.text);
  };

  const handle_save_edit = async (comment_id) => {
    const trimmed = editText.trim();
    if (!trimmed) return;

    if (savingCommentId !== null || deletingCommentId !== null) return;

    const previousComments = comments;

    setSavingCommentId(comment_id);
    set_comments((prev) => prev.map((c) => (c.id === comment_id ? { ...c, text: trimmed } : c)));
    setEditingId(null);
    setEditText("");

    try {
      await updateComment(comment_id, trimmed, commentCourseId);
      setReloadKey((k) => k + 1);
    } catch (err) {
      set_comments(previousComments);
      console.error("Error actualizando comentario:", err);
    } finally {
      setSavingCommentId(null);
    }
  };

  const handle_cancel_edit = () => {
    setEditingId(null);
    setEditText("");
  };

  const isCommentsBusy = isAddingComment || savingCommentId !== null || deletingCommentId !== null;

  if (!is_open) {
    return null;
  }

  return (
    <>
      <div className="popup-overlay" onClick={handle_close}>
      <div className="popup-container" onClick={(e) => e.stopPropagation()} data-onboarding-id="official-card-modal">
        {/* Header */}
        <div className="popup-header">
          <h2>Detalle de Asignatura</h2>
        </div>

        {/* Contenido */}
        <div className="popup-content">
          {/* Título y código */}
          <div className="subject-header">
            <h1 className="subject-name">{data.subject_name}</h1>
            <div className="subject-meta">
              <span className="subject-date">{data.date_range}</span>
            </div>
          </div>

          {/* Información General */}
          <div className="info-section">
            <h3 className="section-title">Información General</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-icon">👤</span>
                <div className="info-text">
                  <p className="info-label">Instructor</p>
                  <p className="info-value">{data.instructor_name}</p>
                </div>
              </div>
              <div className="info-item">
                <span className="info-icon">#</span>
                <div className="info-text">
                  <p className="info-label">NRC</p>
                  <p className="info-value">{data.nrc}</p>
                </div>
              </div>
              <div className="info-item">
                <span className="info-icon">📚</span>
                <div className="info-text">
                  <p className="info-label">Créditos</p>
                  <p className="info-value">{data.credits}</p>
                </div>
              </div>
              <div className="info-item">
                <span className="info-icon">📍</span>
                <div className="info-text">
                  <p className="info-label">Campus</p>
                  <p className="info-value">{data.campus}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Horario Programado */}
          {data.schedule && data.schedule.length > 0 && (
            <div className="info-section">
              <h3 className="section-title">Horario Programado</h3>
              <div className="schedule-list">
                {data.schedule.map((item, index) => (
                  <div key={index} className="schedule-item">
                    <div className="schedule-day-badge">
                      <p className="schedule-day">{item.day || "Día"}</p>
                      {item.type && <span className="schedule-type">{item.type}</span>}
                    </div>
                    <div className="schedule-details">
                      <div className="schedule-detail">
                        <span className="detail-label">HORA</span>
                        <p className="detail-value">
                          {item.start_time || "00:00"} - {item.end_time || "00:00"}
                        </p>
                      </div>
                      <div className="schedule-detail">
                        <span className="detail-label">AULA</span>
                        <p className="detail-value">{item.classroom || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comentarios */}
          <div className="info-section">
            <h3 className="section-title">Comentarios y Observaciones</h3>
            <CommentButton
              on_add_comment={handle_add_comment}
              onboardingButtonId="official-comment-button"
              onboardingModalId="official-comment-modal"
              isDisabled={isCommentsBusy}
            />

            {comments.length > 0 && (
              <div className="comments-list">
                {comments.map((comment) => {
                  const isEditingThis = editingId === comment.id;
                  const isSavingThis = savingCommentId === comment.id;
                  const isDeletingThis = deletingCommentId === comment.id;

                  return (
                  <div key={comment.id} className="comment-item">
                    <div className="comment-header">
                      <span className="comment-timestamp">{comment.timestamp}</span>
                      <div className="comment-header-actions">
                        <button
                          className={`edit-comment-button${isSavingThis ? " is-loading" : ""}`}
                          onClick={() => handle_start_edit(comment)}
                          title="Editar comentario"
                          aria-label="Editar comentario"
                          type="button"
                          disabled={isCommentsBusy && !isEditingThis}
                        >
                          {isSavingThis ? "..." : "✎"}
                        </button>
                        <button
                          className={`delete-comment-button${isDeletingThis ? " is-loading" : ""}`}
                          onClick={() => handle_delete_comment(comment.id)}
                          title="Eliminar comentario"
                          aria-label="Eliminar comentario"
                          type="button"
                          disabled={isCommentsBusy && !isDeletingThis}
                        >
                          {isDeletingThis ? "..." : "✕"}
                        </button>
                      </div>
                    </div>
                    {editingId === comment.id ? (
                      <div className="comment-edit-area">
                        <textarea
                          className="add-comment-textarea"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={2}
                          disabled={savingCommentId === comment.id || deletingCommentId !== null}
                        />
                        <div className="add-comment-actions">
                          <button
                            className="add-comment-action-button save"
                            type="button"
                            onClick={() => handle_save_edit(comment.id)}
                            disabled={!editText.trim() || savingCommentId === comment.id || deletingCommentId !== null}
                            title="Guardar cambios del comentario"
                            aria-label="Guardar comentario"
                          >
                            {savingCommentId === comment.id ? "Guardando..." : "Guardar"}
                          </button>
                          <button
                            className="add-comment-action-button cancel"
                            type="button"
                            onClick={handle_cancel_edit}
                            disabled={savingCommentId === comment.id || deletingCommentId !== null}
                            title="Cancelar edición del comentario"
                            aria-label="Cancelar"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="comment-text">{comment.text}</p>
                    )}
                  </div>
                  );
                })}
              </div>
            )}

            {comments.length === 0 && (
              <p className="no-comments">Aun no hay comentarios para esta asignatura.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="popup-footer">
          <button 
            className="close-button" 
            onClick={handle_close}
            title="Cerrar ventana de detalle"
            aria-label="Cerrar"
          >
            Cerrar Detalle
          </button>
        </div>
      </div>
    </div>
    </>
  );
};
