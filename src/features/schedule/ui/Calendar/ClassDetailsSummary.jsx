/** Cabecera, información general y horario del detalle de asignatura. */

export default function ClassDetailsSummary({ data }) {
  return (
    <>
      <div className="subject-header">
        <h1 className="subject-name">{data.subject_name}</h1>
        <div className="subject-meta">
          <span className="subject-date">{data.date_range}</span>
        </div>
      </div>

      <div className="info-section">
        <h3 className="section-title">Información General</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-icon" aria-hidden="true">👤</span>
            <div className="info-text">
              <p className="info-label">Instructor</p>
              <p className="info-value">{data.instructor_name}</p>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon" aria-hidden="true">#</span>
            <div className="info-text">
              <p className="info-label">NRC</p>
              <p className="info-value">{data.nrc}</p>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon" aria-hidden="true">📚</span>
            <div className="info-text">
              <p className="info-label">Créditos</p>
              <p className="info-value">{data.credits}</p>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon" aria-hidden="true">📍</span>
            <div className="info-text">
              <p className="info-label">Campus</p>
              <p className="info-value">{data.campus}</p>
            </div>
          </div>
        </div>
      </div>

      {data.schedule && data.schedule.length > 0 && (
        <div className="info-section">
          <h3 className="section-title">Horario Programado</h3>
          <div className="schedule-list">
            {data.schedule.map((item, index) => (
              <div key={`${item.day}-${item.start_time}-${index}`} className="schedule-item">
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
    </>
  );
}
