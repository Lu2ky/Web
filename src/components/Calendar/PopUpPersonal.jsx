import { useState, useEffect } from "react";
import ModalBase from "../Templates/Modal";
import "../../styles/PopUpClasses.css";
import EditActivityModal from "./EditActivityModal";

export const PopUpPersonal = ({
  isOpen = false,
  onClose = () => { },
  personalData = {},
  onUpdate = () => {},
  onDelete = () => {},
  userId = null,
}) => {
  const [is_open, set_is_open] = useState(isOpen);


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

  const handleDeleteClick = () => {
    const activityId =
      personalData?.id ??
      data?.id ??
      personalData?.id_course ??
      data?.id_course ??
      personalData?.apiData?.id_course ??
      personalData?.apiData?.N_idcourse ??
      personalData?.apiData?.N_idCourse;

    if (activityId) {
      onDelete(activityId);
      handle_close();
    } else {
      console.error("No hay ID disponible para eliminar.", personalData);
    }
  };

  if (!is_open) {
    return null;
  }

  return (
    <>
      <ModalBase isOpen={is_open} onClose={handle_close} title={"Detalle de Actividad Personal"} showFooter={false}>
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
            <button
              onClick={handleDeleteClick}
              title="Eliminar actividad"
              aria-label="Eliminar actividad"
              type="button"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ff6b6b',
                fontSize: '20px',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >

              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M3 6H21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M8 6V4.5C8 3.67157 8.67157 3 9.5 3H14.5C15.3284 3 16 3.67157 16 4.5V6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M6.5 6L7.2 19.2C7.255 20.239 8.113 21 9.153 21H14.847C15.887 21 16.745 20.239 16.8 19.2L17.5 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10 11V17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M14 11V17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
          <div className="subject-meta">
            <span className="subject-date">{data.tag}</span>
          </div>
        </div>

        {/* Contenido */}
        {data.description && (
          <div className="info-section">
            <h3 className="section-title">Descripción</h3>
            <p className="description-text">{data.description}</p>
          </div>
        )}

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
      </ModalBase>

      <EditActivityModal
        isOpen={isEditOpen}
        onClose={handleCloseEdit}
        userId={
          userId ||
          data?.apiData?.id_user ||
          data?.apiData?.ID_USER ||
          data?.apiData?.idUsuario ||
          data?.apiData?.N_idUsuario
        }
        activity={data}
        onUpdated={handleUpdated}
      />
    </>
  );
};
