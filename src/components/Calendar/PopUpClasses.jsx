import { useState, useEffect } from "react";
import { CommentButton } from "./CommentButton";
import CommentFetcher from "../../services/CommentFetcher";
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
  const [fetchKey, setFetchKey] = useState(0); // bump to re-fetch comments
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  // Normalizar comentarios que vienen del backend
  const normalizeComments = (raw) => {
    if (!Array.isArray(raw)) return [];
    return raw.map(c => ({
      id: c.N_idComentarios ?? c.id ?? c.ID ?? Date.now(),
      text: c.T_comentario ?? c.text ?? c.comentario ?? "",
      timestamp: c.Dt_fecha ?? c.timestamp ?? c.fecha ?? "",
    }));
  };

  // Sincronizar el estado interno con el prop externo
  useEffect(() => {
    set_is_open(isOpen);
  }, [isOpen]);

  // Limpiar comentarios al cambiar de asignatura o al abrir
  useEffect(() => {
    set_comments([]);
    setFetchKey(k => k + 1);
  }, [classData?.id, classData?.nrc]);

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
    const scheduleId = classData?.apiData?.N_idHorario
      ?? classData?.apiData?.id_schedule
      ?? classData?.apiData?.idSchedule
      ?? classData?.apiData?.ID_HORARIO
      ?? classData?.apiData?.schedule_id
      ?? classData?.scheduleId
      ?? courseId;

    if (!courseId || !scheduleId) {
      throw new Error("Cannot add comment: missing courseId/scheduleId");
    }

    if (!userId) {
      throw new Error("Cannot add comment: userId is missing");
    }

    try {
      const result = await addComment({
        scheduleId,
        userId,
        courseId,
        courseName: classData?.subject_name || "",
        comment: comment_text,
      });
      console.debug("addComment result:", result);
      // Re-fetch to get real IDs from backend
      setFetchKey(k => k + 1);
      return result;
    } catch (err) {
      console.error("Error añadiendo comentario:", err);
      throw err;
    }
  };

  const handle_delete_comment = async (comment_id) => {
    set_comments(prev => prev.filter((comment) => comment.id !== comment_id));
    try {
      await deleteComment(comment_id);
    } catch (err) {
      console.error("Error eliminando comentario:", err);
    }
  };

  const handle_start_edit = (comment) => {
    setEditingId(comment.id);
    setEditText(comment.text);
  };

  const handle_save_edit = async (comment_id) => {
    const trimmed = editText.trim();
    if (!trimmed) return;
    set_comments(prev => prev.map(c => c.id === comment_id ? { ...c, text: trimmed } : c));
    setEditingId(null);
    setEditText("");
    try {
      await updateComment(comment_id, trimmed);
    } catch (err) {
      console.error("Error actualizando comentario:", err);
    }
  };

  const handle_cancel_edit = () => {
    setEditingId(null);
    setEditText("");
  };

  if (!is_open) {
    return null;
  }

  // render fetcher sólo cuando el pop‑up está abierto y hay un id disponible
  const commentCourseId = classData?.apiData?.N_idCurso
    ?? classData?.apiData?.id_course
    ?? classData?.apiData?.idCourse
    ?? classData?.apiData?.ID_CURSO
    ?? classData?.apiData?.id
    ?? classData?.id
    ?? classData?.nrc;

  const shouldFetch = is_open && userId && commentCourseId;

  return (
    <>
      {shouldFetch && (
        <CommentFetcher
          key={fetchKey}
          userId={userId}
          courseId={commentCourseId}
          onDataLoaded={(raw) => set_comments(normalizeComments(raw))}
        />
      )}

      <div className="popup-overlay" onClick={handle_close}>
      <div className="popup-container" onClick={(e) => e.stopPropagation()}>
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
            <CommentButton on_add_comment={handle_add_comment} />

            {comments.length > 0 && (
              <div className="comments-list">
                {comments.map((comment) => (
                  <div key={comment.id} className="comment-item">
                    <div className="comment-header">
                      <span className="comment-timestamp">{comment.timestamp}</span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          className="delete-comment-button"
                          onClick={() => handle_start_edit(comment)}
                          title="Editar comentario"
                          aria-label="Editar comentario"
                          type="button"
                        >
                          ✎
                        </button>
                        <button
                          className="delete-comment-button"
                          onClick={() => handle_delete_comment(comment.id)}
                          title="Eliminar comentario"
                          aria-label="Eliminar comentario"
                          type="button"
                        >
                          ✕
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
                        />
                        <div className="add-comment-actions">
                          <button
                            className="add-comment-action-button save"
                            type="button"
                            onClick={() => handle_save_edit(comment.id)}
                            disabled={!editText.trim()}
                          >
                            Guardar
                          </button>
                          <button
                            className="add-comment-action-button cancel"
                            type="button"
                            onClick={handle_cancel_edit}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="comment-text">{comment.text}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="popup-footer">
          <button className="close-button" onClick={handle_close}>
            Cerrar Detalle
          </button>
        </div>
      </div>
    </div>
    </>
  );
};
