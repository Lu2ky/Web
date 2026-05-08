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
        <Header userId={userId} />
      </div>

      <main className="adminViewMain">
        <div className="adminViewContent">
          <div className="adminViewGrid">
            <section className="adminPanel adminPanel--surface" aria-labelledby="admin-import-title">
              <div className="adminPanelHeader">
                <h2 id="admin-import-title">Importar horarios</h2>
                <p>Sube el archivo oficial de planeacion academica en formato .xlsx.</p>
              </div>

              <ModalArchivo label="Subir Archivo" accept=".xlsx" onFiles={handleFiles} />

              <DropArea
                title="Cargar archivo de horarios (.xlsx)"
                subtitle="Arrastra el archivo oficial de planeacion academica para actualizar el sistema global."
                accept=".xlsx"
                onFiles={handleFiles}
                fileName={fileName}
              />

              {statusMessage ? (
                <p className={`adminView__message adminView__message--${statusMessage.tone}`}>
                  {statusMessage.text}
                </p>
              ) : null}
            </section>

            <section className="adminPanel" aria-label="Gestion de periodos academicos">
              <div className="adminPanelStack">
                <AddAcademicPeriodCard userId={userId} onCreated={handlePeriodCreated} />
                <AcademicPeriodListCard userId={userId} refreshToken={periodRefreshToken} />
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminView;