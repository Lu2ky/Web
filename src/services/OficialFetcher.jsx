import { useEffect, useState } from "react";
import LoadingModal from "./LoadingModal";

// ============================================================================
// Componente OficialFetcher
// ============================================================================
// Carga el horario oficial de un usuario desde la API en background.
// Filtra por período académico si se especifica.
// Usa LoadingModal mientras se cargan los datos, luego notifica al padre
// mediante la función onDataLoaded sin renderizar elemento visual.
//
// Propiedades:
//   - onDataLoaded: Función que recibe los datos cargados
//   - userId: ID del usuario para obtener su horario oficial
//   - academicPeriod: { id, nombre } del período académico a filtrar, null = todos
// ============================================================================
function OficialFetcher({ onDataLoaded, userId, academicPeriod }) {
  const [loading, setLoading] = useState(true); // Indica si la API está cargando
  const [apiData, setApiData] = useState([]); // Almacena los datos de la API

  useEffect(() => {
    // Cargar datos cuando llegan datos
    if (!userId) {
      setLoading(false); // Detener carga si no hay ID
      setApiData([]); // Limpiar datos
      if (onDataLoaded) {
        onDataLoaded([]); // Notificar que no hay datos
      }
      return;
    }
    
    const baseUrl = import.meta.env.VITE_API_URL_OFICIAL_SCHEDULE; // URL base de la API

    const fetchData = async () => {
      // Función asincrona para cargar datos
      setLoading(true); // Activar estado de carga
      try {
        // Construir URL con parámetros: userId y opcionalmente periodId
        let url = `${baseUrl}${userId}`;
        if (academicPeriod && academicPeriod.id) {
          url += `?academicPeriod=${encodeURIComponent(academicPeriod.id)}`;
        }
        
        console.log("Fetching official schedule:", url);
        // Cabecera Authorization.
        const tokenLocalStore = localStorage.getItem("token") || "";
        const token = `Bearer ${tokenLocalStore}`;

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Authorization": token,
          },
        });

        const json = await response.json(); // Convierte respuesta en un json
        if (!json || json.length === 0) {
          // Si no tiene datos:
          console.log("No hay datos"); // Mostrar mensaje en consola
          setApiData([]); // Limpiar datos
          if (onDataLoaded) {
            // Notifica al padre que no hay datos
            onDataLoaded([]);
          }
        } else {
          console.log("Datos cargados:", json); // Mostrar datos en consola
          setApiData(json); // Si hay datos se almacenan en el estado
          if (onDataLoaded) {
            onDataLoaded(json); // Enviar datos al padre
          }
        }
      } catch (error) {
        //Manejo de errores
        console.error("Error al cargar datos:", error); // Mostrar error en consola
        setApiData([]); // Limpiar datos en caso de error
        if (onDataLoaded) {
          // Notificar al padre que no hay datos
          onDataLoaded([]);
        }
      } finally {
        setLoading(false); // Desactivar estado de carga al acabar la petición
      }
    };

    fetchData(); //Llama a fechData para iniciar la carga de datos
  }, [onDataLoaded, userId, academicPeriod]); // Re-fetch si cambia el período, ID o onDataLoaded

  if (loading) {
    //Mientras se cargan los datos, muestra un mensaje de carga
    return (
      <LoadingModal
        isOpen={loading}
        title="Cargando horario oficial"
      />
    );
  }

  return null; // Porque no renderiza, solo envia datos al padre(App.jsx)
}

export default OficialFetcher;
