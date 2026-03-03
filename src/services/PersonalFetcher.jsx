import { useEffect, useState } from "react";
import LoadingModal from "./loadingModal";

// Mapa para convertir números de día a nombres de días
const dayMap = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  7: "Domingo"
};

function formatApiDateTime(value) {
  const pad = (number) => String(number).padStart(2, "0");

  if (typeof value === "string") {
    const match = value.trim().match(
      /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2})[:-](\d{2})[:-](\d{2}))?$/
    );

    if (match) {
      const [, year, month, day, hour = "00", minute = "00", second = "00"] = match;
      return `${year}-${month}-${day} ${hour}-${minute}-${second}`;
    }
  }

  const parsedDate = value ? new Date(value) : new Date();
  const finalDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

  return `${finalDate.getFullYear()}-${pad(finalDate.getMonth() + 1)}-${pad(finalDate.getDate())} ${pad(finalDate.getHours())}-${pad(finalDate.getMinutes())}-${pad(finalDate.getSeconds())}`;
}

/**
 * Normaliza datos de actividades personales que vienen de la API
 * Convierte el formato API al formato esperado por el calendario
 */
function normalizePersonalData(apiData) {
  if (!Array.isArray(apiData)) {
    console.error("Datos de actividades personales no son un array:", apiData);
    return [];
  }

  return apiData.map((item) => {
    const [startTime, endTime, dayNumber] = item.times || [];
    
    return {
      id: item.id_course || item.id,
      name: item.subject_name,
      description: item.description || "",
      tag: item.tag || "Personal",
      start_time: startTime ? String(startTime).slice(0, 5) : "00:00",
      end_time: endTime ? String(endTime).slice(0, 5) : "00:00",
      day: dayMap[dayNumber] || "Lunes",
      // Campos adicionales para compatibilidad
      subject_name: item.subject_name,
      activity_name: item.subject_name,
      location: "",
      classroom: "",
      date_start: item.date_start,
      date_end: item.date_end,
      apiData: item
    };
  });
}

// Componente para cargar datos de la API y pasarlos al padre
// onDataLoaded es una función que se llama con los datos cargados normalizados,
// userId es el ID del usuario para cargar su horario
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
          // Hace la petición a la API con el ID del usuario
          `${baseUrl}${userId}`
        );
        const json = await response.json(); // Convierte respuesta en un json
        
        if (!json || json.length === 0) {
          // Si no tiene datos:
          console.log("No hay datos personales"); // Mostrar mensaje en consola
          setApiData([]); // Limpiar datos
          if (onDataLoaded) {
            // Notifica al padre que no hay datos
            onDataLoaded([]);
          }
        } else {
          console.log("Datos personales cargados:", json); // Mostrar datos en consola
          
          // Normalizar datos antes de almacenarlos
          const normalizedData = normalizePersonalData(json);
          console.log("Datos personales normalizados:", normalizedData);
          
          setApiData(normalizedData); // Almacenar datos normalizados
          if (onDataLoaded) {
            onDataLoaded(normalizedData); // Enviar datos normalizados al padre
          }
        }
      } catch (error) {
        //Manejo de errores
        console.log(`${baseUrl}${userId}`);
        console.error("Error al cargar datos personales:", error); // Mostrar error en consola
        setApiData([]); // Limpiar datos en caso de error
        if (onDataLoaded) {
          // Notificar al padre que no hay datos
          onDataLoaded([]);
        }
      } finally {
        setLoading(false); // Desactivar estado de carga al acabar la petición
      }
    };

    fetchData(); //Llama a fetchData para iniciar la carga de datos
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

/**
 * Agrega una nueva actividad personal
 * @param {string} userId - ID del usuario
 * @param {Object} activityData - Datos de la actividad
 * @returns {Promise<Object>} Respuesta de la API
 */
export const addPersonalActivity = async (userId, activityData) => {
  try {
    const baseUrl = import.meta.env.VITE_API_ADD_PERSONAL_ACTIVITY;
    
    // Obtener el día como número (1 = Lunes, 7 = Domingo)
    const dayMap = {
      "Lunes": 1,
      "Martes": 2,
      "Miércoles": 3,
      "Jueves": 4,
      "Viernes": 5,
      "Sábado": 6,
      "Domingo": 7
    };

    const formattedDateStart = formatApiDateTime(activityData.dateStart);
    const formattedDateEnd = formatApiDateTime(activityData.dateEnd);
    const activityId = activityData.id ?? activityData.id_course ?? -1;

    // Preparar los datos en el formato que espera la API
    const payload = {
      id_user: 7, // Reemplazar con userId cuando esté disponible
      id_academic_per: 1,
      subject_name: activityData.title,
      description: activityData.description || "",
      date_start: formattedDateStart,
      date_end: formattedDateEnd,
      start_hour: activityData.startHour,
      end_hour: activityData.endHour,
      day: dayMap[activityData.day] || 1,
      times: 
        [
          
        ]
      
    };

    console.log("Enviando actividad a la API:", payload);

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Error en la API: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Respuesta de la API:", data);
    
    return data;
  } catch (error) {
    console.error("Error al agregar actividad personal:", error);
    throw error;
  }
};

/**
 * Elimina una actividad personal
 * @param {string} userId - ID del usuario
 * @param {string|number} activityId - ID de la actividad
 * @returns {Promise<Object>} Respuesta de la API
 */
export const deletePersonalActivity = async (userId, activityId) => {
  try {
    const baseUrl = import.meta.env.VITE_API_DELETE_PERSONAL_ACTIVITY;

    const payload = {
      IdPersonalScheudle: activityId
    };

    console.log("Eliminando actividad:", payload);

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
          IdPersonalSchedule: activityId
    if (!response.ok) {
      throw new Error(`Error en la API: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Actividad eliminada:", data);
    
    return data;
  } catch (error) {
    console.error("Error al eliminar actividad personal:", error);
    throw error;
  }
};

/**
 * Actualiza una actividad personal
 * @param {string} userId - ID del usuario
 * @param {string|number} activityId - ID de la actividad
 * @param {Object} updates - Datos a actualizar
 * @returns {Promise<Object>} Respuesta de la API
 */
export const updatePersonalActivity = async (userId, activityId, updates) => {
  try {
    const baseUrl = import.meta.env.VITE_API_UPDATE_PERSONAL_ACTIVITY;

    const dayMap = {
      "Lunes": 1,
      "Martes": 2,
      "Miércoles": 3,
      "Jueves": 4,
      "Viernes": 5,
      "Sábado": 6,
      "Domingo": 7
    };

    const formattedDateStart = formatApiDateTime(updates.dateStart);
    const formattedDateEnd = formatApiDateTime(updates.dateEnd);

    const payload = {
      id_user: userId,
      id_academic_per: null,
      id_course: activityId,
      subject_name: updates.title,
      description: updates.description,
      date_start: formattedDateStart,
      date_end: formattedDateEnd,
      start_hour: updates.startHour,
      end_hour: updates.endHour,
      day: dayMap[updates.day] || 1,
      times: [
        [
          activityId,
          updates.startHour,
          updates.endHour,
          formattedDateStart,
          formattedDateEnd
        ]
      ]
    };

    console.log("Actualizando actividad:", payload);

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Error en la API: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Actividad actualizada:", data);
    
    return data;
  } catch (error) {
    console.error("Error al actualizar actividad personal:", error);
    throw error;
  }
};

export default PersonalFetcher;
