import React, { useState } from 'react';
import * as XLSX from 'xlsx';

const readFileAsArrayBuffer = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target?.result);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsArrayBuffer(file);
  });

export const parseExcelFile = async (file) => {
  if (!file) {
    throw new Error('No se recibió ningún archivo para procesar.');
  }

  const buffer = await readFileAsArrayBuffer(file);
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error('El archivo no contiene hojas.');
  }

  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet, { header: 1 });
};

const excelParce = () => {
  const [jsonData, setJsonData] = useState(null);
  const [error, setError] = useState(null);
  const [savedName, setSavedName] = useState(null);

  const downloadJson = (data, filename = 'outputs/output.json') => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    setSavedName(filename);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setError(null);
    setJsonData(null);
    setSavedName(null);

    parseExcelFile(file)
      .then((data) => {
        setJsonData(data);
        downloadJson(data);
      })
      .catch((err) => {
        console.error('No se pudo procesar el archivo', err);
        setError(err?.message || 'No se pudo procesar el archivo. Verifica que sea un Excel válido.');
      });
  };

  return (
    <div>
      <h2>Importar Archivo Excel en React</h2>
      <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {savedName && <p style={{ color: 'green' }}>JSON guardado como {savedName} (descarga local).</p>}

      {jsonData && (
        <div>
          <h3>Datos Parseados (JSON):</h3>
          <pre>{JSON.stringify(jsonData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default excelParce;
