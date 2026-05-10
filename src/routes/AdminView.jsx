import { useState, useCallback } from "react";
import Header from "../components/Header/Header";
import DropArea from "../components/Account/JSX ViewAdmin/DropArea";
import ModalArchivo from "../components/Account/JSX ViewAdmin/ModalArchivo";
import AddAcademicPeriodCard from "../components/Account/JSX ViewAdmin/AddAcademicPeriodCard";
import { getAuthSession } from "../services/authSession";
import AcademicPeriodListCard from "../components/Account/JSX ViewAdmin/AcademicPeriodListCard";
import { parseExcelFile } from "../components/Account/JSX ViewAdmin/exelParce";
import { importSchedule } from "../services/importScheduleService";
import "./AdminView.css";

function AdminView() {
  const session = getAuthSession();
  const userId = session?.userId ?? null;

  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [periodRefreshToken, setPeriodRefreshToken] = useState(0);

  const handleFiles = useCallback(async (files) => {
    if (!files?.length) return;
    const [first] = files;
    setFileName(first?.name || '');
    setParseError('');
    setImportStatus('');

    let didStartImport = false;

    try {
      const parsed = await parseExcelFile(first);
      didStartImport = true;
      setImportStatus('enviando');
      await importSchedule(parsed);
      setImportStatus('ok');
    } catch (error) {
      console.error('Error al procesar archivo:', error);
      if (didStartImport) {
        setImportStatus('error');
      } else {
        setParseError(error?.message || 'No se pudo procesar el archivo.');
      }
    }
  }, []);

  const handlePeriodCreated = useCallback(() => {
    setPeriodRefreshToken((value) => value + 1);
  }, []);

  const statusMessage = parseError
    ? { tone: 'error', text: parseError }
    : importStatus === 'enviando'
      ? { tone: 'loading', text: 'Enviando horario...' }
      : importStatus === 'ok'
        ? { tone: 'success', text: 'Horario importado correctamente.' }
        : importStatus === 'error'
          ? { tone: 'error', text: 'Error al enviar el horario a la API.' }
          : null;

  return (
    <div className="adminViewContainer">
      <div className="adminView__header">
        <Header userId={userId} variant="admin" />
      </div>
      <div className="adminView">
        <div className="adminView__overview">
          <div className="page">
            <div className="card adminPanel--import">
              <ModalArchivo
                label="Subir Archivo"
                accept=".xlsx"
                onFiles={handleFiles}
              />

              <DropArea
                title="Cargar archivo de horarios (.xlsx)"
                subtitle="Arrastra el archivo oficial de planeacion academica para actualizar el sistema global."
                accept=".xlsx"
                onFiles={handleFiles}
                fileName={fileName}
              />

              {parseError ? <p className="adminPanel_status adminPanel_status--error">{parseError}</p> : null}
              {importStatus === 'enviando' && <p className="adminPanel_status adminPanel_status--loading">Enviando horario...</p>}
              {importStatus === 'ok' && <p className="adminPanel_status adminPanel_status--success">Horario importado correctamente.</p>}
              {importStatus === 'error' && <p className="adminPanel_status adminPanel_status--error">Error al enviar el horario a la API.</p>}

              <div className="adminPanel_downloadSection" aria-label="Descarga de plantilla">
                <p className="adminPanel_downloadText">
                  ¿No tienes el archivo listo? Descarga la plantilla oficial y completa la información antes de subirla.
                </p>
                <a
                  className="adminPanel_downloadLink"
                  href="/plantillaHorarios.xlsx"
                  download
                >
                  Descargar plantilla de horarios
                </a>
              </div>
            </div>

            <section className="adminPanel" aria-label="Gestion de periodos academicos">
              <div className="adminPanelStack">
                <AddAcademicPeriodCard userId={userId} onCreated={handlePeriodCreated} />
                <AcademicPeriodListCard userId={userId} refreshToken={periodRefreshToken} />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminView;