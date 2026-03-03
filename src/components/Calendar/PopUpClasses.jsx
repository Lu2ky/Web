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

  // cuando el popup se abre con una asignatura vaga, `CommentFetcher` rellenará los comentarios

  // Sincronizar el estado interno con el prop externo
  useEffect(() => {
    set_is_open(isOpen);
  }, [isOpen]);

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
    const new_comment = {
      id: Date.now(),
      text: comment_text,
      timestamp: new Date().toLocaleString(),
    };

    // optimistically add to UI
    set_comments([new_comment, ...comments]);

    try {
      // call backend
      await addComment({
        scheduleId: classData?.id,
        userId,
        courseId: classData?.id || classData?.nrc,
        courseName: classData?.subject_name || "",
        comment: comment_text,
      });
    } catch (err) {
      console.error("Error añadiendo comentario:", err);
    }
  };

  const handle_delete_comment = async (comment_id) => {
    set_comments(comments.filter((comment) => comment.id !== comment_id));
    try {
      await deleteComment(comment_id);
    } catch (err) {
      console.error("Error eliminando comentario:", err);
    }
  };

  if (!is_open) {
    return null;
  }

  // render fetcher sólo cuando el pop‑up está abierto y hay un id disponible
  const shouldFetch = is_open && userId && (classData?.id || classData?.nrc);

  return (
    <>
      {shouldFetch && (
        <CommentFetcher
          userId={userId}
          courseId={classData.id || classData.nrc}
          onDataLoaded={set_comments}
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
                    <p className="comment-text">{comment.text}</p>
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
