import { useState, useEffect } from "react";
import { CommentButton } from "./CommentButton";
import "../../styles/PopUpClasses.css";
import EditActivityModal from "./EditActivityModal";

export const PopUpPersonal = ({
  isOpen = false,
  onClose = () => { },
  personalData = {},
  onUpdate = () => {}
}) => {
  const [is_open, set_is_open] = useState(isOpen);
  const [comments, set_comments] = useState([]);


  // Sincronizar el estado interno con el prop externo
  useEffect(() => {
    set_is_open(isOpen);
  }, [isOpen]);

  // Datos por defecto si no se proporcionan
  const data = {
    name: personalData?.name || "Actividad Personal",
    description: personalData?.description || "",
    tag: personalData?.tag || "Personal",
    start_time: personalData?.start_time || "00:00",
    end_time: personalData?.end_time || "00:00",
    day: personalData?.day || "Lunes",
    date_start: personalData?.date_start || "",
    date_end: personalData?.date_end || "",
    ...personalData,
  };

  const handle_close = () => {
    set_is_open(false);
    onClose();
  };

  const handle_add_comment = (comment_text) => {
    const new_comment = {
      id: Date.now(),
      text: comment_text,
      timestamp: new Date().toLocaleString(),
    };
    set_comments([new_comment, ...comments]);
  };

  const handle_delete_comment = (comment_id) => {
    set_comments(comments.filter((comment) => comment.id !== comment_id));
  };

  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleOpenEdit = () => {
    setIsEditOpen(true);
  };

  const handleCloseEdit = () => {
    setIsEditOpen(false);
  };

  const handleUpdated = (updatedActivity) => {
    // Propagar al padre
    onUpdate(updatedActivity);
    // Cerrar modales
    handleCloseEdit();
    handle_close();
  };

  if (!is_open) {
    return null;
  }

  // no cargamos comentarios desde el servidor para actividades personales

  if (!is_open) {
    return null;
  }

  return (
    <div className="popup-overlay" onClick={handle_close}>
      <div className="popup-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="popup-header">
          <h2>Detalle de Actividad Personal</h2>
        </div>

        {/* Contenido */}
        <div className="popup-content">
          {/* Título y etiqueta */}
          <div className="subject-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 className="subject-name">{data.name}</h1>
              <button
                onClick={handleOpenEdit}
                title="Editar"
                aria-label="Editar"
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M7 42H41"
                    stroke="#333333"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M11 26.7199V34H18.3172L39 13.3081L31.6919 6L11 26.7199Z"
                    stroke="#333333"
                    strokeWidth="4"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            <div className="subject-meta">
              <span className="subject-date">{data.tag}</span>
            </div>
          </div>

          {/* Descripción */}
          {data.description && (
            <div className="info-section">
              <h3 className="section-title">Descripción</h3>
              <p className="description-text">{data.description}</p>
            </div>
          )}

          {/* Información General */}
          <div className="info-section">
            <h3 className="section-title">Información General</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-icon">📅</span>
                <div className="info-text">
                  <p className="info-label">Día</p>
                  <p className="info-value">{data.day}</p>
                </div>
              </div>
              <div className="info-item">
                <span className="info-icon">🕐</span>
                <div className="info-text">
                  <p className="info-label">Hora</p>
                  <p className="info-value">
                    {data.start_time} - {data.end_time}
                  </p>
                </div>
              </div>
              {data.date_start && (
                <div className="info-item">
                  <span className="info-icon">📌</span>
                  <div className="info-text">
                    <p className="info-label">Vigencia</p>
                    <p className="info-value">
                      {new Date(data.date_start).toLocaleDateString()} 
                      {data.date_end ? ` - ${new Date(data.date_end).toLocaleDateString()}` : ""}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

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
      <EditActivityModal
        isOpen={isEditOpen}
        onClose={handleCloseEdit}
        userId={data?.apiData?.id_user || data?.apiData?.ID_USER}
        activity={data}
        onUpdated={handleUpdated}
      />

    </div>
  );
};
