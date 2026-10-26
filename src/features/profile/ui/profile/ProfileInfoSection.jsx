export default function ProfileInfoSection({ userData }) {
  return (
    <section className="profile-section">
      <h3 className="profile-section-title">Información del Perfil</h3>

      <div className="info-group">
        <label className="info-label">Nombre</label>
        <div className="info-value">
          {userData?.nombre ||
            userData?.name ||
            userData?.fullName ||
            userData?.nombreCompleto ||
            "No disponible"}
        </div>
      </div>

      <div className="info-group">
        <label className="info-label">Semestre</label>
        <div className="info-value">
          {userData?.semestreActual ||
            userData?.semestre ||
            userData?.semester ||
            userData?.nivel ||
            userData?.level ||
            "No disponible"}
        </div>
      </div>

      <div className="info-group">
        <label className="info-label">Programa Académico</label>
        <div className="info-value">
          {userData?.programa ||
            userData?.program ||
            userData?.carrera ||
            userData?.career ||
            userData?.programaAcademico ||
            userData?.academicProgram ||
            "No disponible"}
        </div>
      </div>
    </section>
  );
}
