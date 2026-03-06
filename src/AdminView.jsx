import { useState, useCallback } from "react";
import Header from "./components/Navegation/Header";
import DropArea from "./components/Account/JSX ViewAdmin/DropArea";
import ModalArchivo from "./components/Account/JSX ViewAdmin/ModalArchivo";
import { parseExcelFile } from "./components/Account/JSX ViewAdmin/exelParce";
import "./AdminView.css";

function AdminView() {
  const [fileName, setFileName] = useState('');
  const [parsedJson, setParsedJson] = useState(null);
  const [parseError, setParseError] = useState('');

  const handleFiles = useCallback(async (files) => {
    if (!files?.length) return;
    const [first] = files;
    setFileName(first?.name || '');
    setParseError('');
    setParsedJson(null);

    try {
      const parsed = await parseExcelFile(first);
      setParsedJson(parsed);
      console.log('Archivo parseado:', parsed);
    } catch (error) {
      console.error('Error al parsear archivo:', error);
      setParseError(error?.message || 'No se pudo procesar el archivo.');
    }
  }, []);

  return (
    <div className="adminViewContainer">
      <div className="adminView__header">
        <Header />
      </div>
      <div className="adminView">

        <div className="adminView__overview">
          <div className="page">
            <div className="card">
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
              {parsedJson ? <pre>{JSON.stringify(parsedJson, null, 2)}</pre> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminView;