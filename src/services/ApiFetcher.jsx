import React, { useEffect, useState } from "react";

function ApiFetcher({ onDataLoaded, userId }) {
  const [loading, setLoading] = useState(true);
  const [apiData, setApiData] = useState([]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setApiData([]); // Limpiar datos
      if (onDataLoaded) {
        onDataLoaded([]); // Notificar que no hay datos
      }
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `http://localhost:28522/api/official-schedule/${userId}`,
        );
        const json = await response.json();

        if (!json.data || json.data.length === 0) {
          console.log("No hay datos");
          setApiData([]);
          if (onDataLoaded) {
            onDataLoaded([]);
          }
        } else {
          setApiData(json.data);
          if (onDataLoaded) {
            onDataLoaded(json.data); // Enviar datos al padre
          }
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
        setApiData([]);
        if (onDataLoaded) {
          onDataLoaded([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [onDataLoaded, userId]);

  if (loading) {
    return <p>Cargando materias...</p>;
  }

  return null;
}

export default ApiFetcher;
