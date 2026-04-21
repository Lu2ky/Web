import { useState, useCallback } from "react";
import Header from "./components/Header/Header";
import DropArea from "./components/Account/JSX ViewAdmin/DropArea";
import ModalArchivo from "./components/Account/JSX ViewAdmin/ModalArchivo";
import AddAcademicPeriodCard from "./components/Account/JSX ViewAdmin/AddAcademicPeriodCard";
import { getAuthSession } from "./services/authSession";
import AcademicPeriodListCard from "./components/Account/JSX ViewAdmin/AcademicPeriodListCard";
import { parseExcelFile } from "./components/Account/JSX ViewAdmin/exelParce";
import { importSchedule } from "./services/importScheduleService";
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

    try {
      const parsed = await parseExcelFile(first);

      setImportStatus('enviando');
      await importSchedule(parsed);
      setImportStatus('ok');
    } catch (error) {
      console.error('Error al procesar archivo:', error);
      if (importStatus === 'enviando') {
        setImportStatus('error');
      } else {
        setParseError(error?.message || 'No se pudo procesar el archivo.');
      }
    }
  }, []);

  const handlePeriodCreated = useCallback(() => {
    setPeriodRefreshToken((value) => value + 1);
  }, []);

  return (
    <div className="adminViewContainer">
      <div className="adminView__header">
        <Header />
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
                subtitle="Arrastra el archivo oficial de planeación académica para actualizar el sistema global."
                accept=".xlsx"
                onFiles={handleFiles}
                fileName={fileName}
              />

              {parseError ? <p style={{ color: 'red' }}>{parseError}</p> : null}
              {importStatus === 'enviando' && <p style={{ color: '#888' }}>Enviando horario...</p>}
              {importStatus === 'ok' && <p style={{ color: 'green' }}>Horario importado correctamente.</p>}
              {importStatus === 'error' && <p style={{ color: 'red' }}>Error al enviar el horario a la API.</p>}
            </div>

            <div className="card adminPanel--period">
              <AddAcademicPeriodCard userId={userId} onCreated={handlePeriodCreated} />
              <AcademicPeriodListCard userId={userId} refreshToken={periodRefreshToken} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminView;