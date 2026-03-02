import { useEffect, useState } from "react";
import LoadingModal from "./loadingModal";
//Prueba local runner
// Componente para cargar datos de la API y pasarlos al padre
// onDataLoaded es una función que se llama con los datos cargados,
// userId es el ID del usuario para cargar su horario
//TEST CI/CD DEPLOY TEST, ANOTHER
function PersonalFetcher({ onDataLoaded, userId }) {
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
    
    const baseUrl = import.meta.env.VITE_API_URL_PERSONAL_SCHEDULE; // URL base de la API

    const fetchData = async () => {
      // Función asincrona para cargar datos
      setLoading(true); // Activar estado de carga
      try {
        const response = await fetch(
          // Hace la peticipin a la API con el ID del usuario
          `${baseUrl}${userId}`
        );
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
        console.log(`${baseUrl}${userId}`);
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
  }, [onDataLoaded, userId]); // en caso de que cambie el ID o onDataLoaded

  if (loading) {
    //Mientras se cargan los datos, muestra un mensaje de carga
    return (
      <LoadingModal
        isOpen={loading}
        title="Cargando horario personal"
      />
    );
  }

  return null; // Porque no renderiza, solo envia datos al padre(App.jsx)
}

export default PersonalFetcher;
