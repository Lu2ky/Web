import { useEffect, useState } from "react";
import LoadingModal from "./LoadingModal";
import { getUserData } from "./userService";

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

const normalizedDayNameMap = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  miércoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
  sábado: "Sábado",
  domingo: "Domingo"
};

function unwrapApiScalar(value) {
  if (value == null) return value;
  if (typeof value !== "object") return value;

  if (value.Valid === false) return null;

  if (value.Int64 != null) return value.Int64;
  if (value.Float64 != null) return value.Float64;
  if (value.String != null) return value.String;
  if (value.Bool != null) return value.Bool;

  if (value.value != null) return value.value;
  if (value.id != null) return value.id;

  return value;
}

function normalizeDayValue(rawDay, fallbackDate) {
  const unwrappedDay = unwrapApiScalar(rawDay);
  const unwrappedFallbackDate = unwrapApiScalar(fallbackDate);

  if (unwrappedDay == null || unwrappedDay === "") {
    if (unwrappedFallbackDate) {
      const parsed = new Date(unwrappedFallbackDate);
      if (!Number.isNaN(parsed.getTime())) {
        const jsDay = parsed.getDay();
        const mondayBasedDay = jsDay === 0 ? 7 : jsDay;
        return dayMap[mondayBasedDay] || "";
      }
    }
    return "";
  }

  if (typeof unwrappedDay === "number") {
    return dayMap[unwrappedDay] || "";
  }

  const trimmed = String(unwrappedDay).trim();
  const asNumber = Number(trimmed);
  if (!Number.isNaN(asNumber) && Number.isFinite(asNumber)) {
    return dayMap[asNumber] || "";
  }

  const lowered = trimmed.toLowerCase();
  return normalizedDayNameMap[lowered] || "";
}

// Normaliza y formatea tiempo para mostrar en vistas (HH:MM)
// Extrae hora:minutos desde múltiples formatos posibles
function normalizeTimeForView(value) {
  const rawValue = unwrapApiScalar(value);
  if (rawValue == null || rawValue === "") return "";

  const raw = String(rawValue).trim();

  const strictTime = raw.match(/^(\d{2})[:\-](\d{2})(?:[:\-](\d{2}))?$/);
  const embeddedTime = raw.match(/(?:^|[ T])(\d{2})[:\-](\d{2})(?:[:\-](\d{2}))?(?:$|\b)/);
  const match = strictTime || embeddedTime;
  if (!match) {
    const parsedDate = new Date(raw);
    if (!Number.isNaN(parsedDate.getTime())) {
      const hours = String(parsedDate.getHours()).padStart(2, "0");
      const minutes = String(parsedDate.getMinutes()).padStart(2, "0");
      return `${hours}:${minutes}`;
    }
    return "";
  }

  const [, hours, minutes] = match;
  const hourNumber = Number(hours);
  const minuteNumber = Number(minutes);

  if (
    Number.isNaN(hourNumber) ||
    Number.isNaN(minuteNumber) ||
    hourNumber < 0 ||
    hourNumber > 23 ||
    minuteNumber < 0 ||
    minuteNumber > 59
  ) {
    return "";
  }

  return `${hours}:${minutes}`;
}

// Formatea fecha/hora hacia formato compatible con API (YYYY-MM-DD HH:MM:SS)
function formatApiDateTime(value) {
  const pad = (number) => String(number).padStart(2, "0");

  if (typeof value === "string") {
    const match = value.trim().match(
      /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2})[:-](\d{2})[:-](\d{2}))?$/
    );

    if (match) {
      const [, year, month, day, hour = "00", minute = "00", second = "00"] = match;
      return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    }
  }

  const parsedDate = value ? new Date(value) : new Date();
  const finalDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

  return `${finalDate.getFullYear()}-${pad(finalDate.getMonth() + 1)}-${pad(finalDate.getDate())} ${pad(finalDate.getHours())}:${pad(finalDate.getMinutes())}:${pad(finalDate.getSeconds())}`;
}

/**
 * Formatea tiempo para API: asegura que sea HH:MM:SS con dos puntos
 */
function formatTimeWithColons(time) {
  if (!time) return "";
  
  let formatted = String(time);
  
  // Si viene como "HH-MM", convertir a "HH:MM"
  if (formatted.includes("-")) {
    formatted = formatted.replace(/-/g, ":");
  }
  
  // Si es "HH:MM", agregar :00 para segundos
  const parts = formatted.split(":");
  if (parts.length === 2) {
    formatted = `${parts[0]}:${parts[1]}:00`;
  }
  // Si ya tiene segundos, devolverlo como está
  else if (parts.length === 3) {
    formatted = `${parts[0]}:${parts[1]}:${parts[2]}`;
  }
  
  return formatted;
}

async function resolveIdUsuario(userId) {
  const userData = await getUserData(userId);
  console.log("userData completa:", userData);
  
  const rawUser = Array.isArray(userData) ? userData[0] : userData;
  const idUsuario = rawUser?.idUsuario ?? rawUser?.N_idUsuario;

  console.log("idUsuario resuelto:", idUsuario);
  console.log("Propiedades disponibles en rawUser:", Object.keys(rawUser || {}));

  if (!idUsuario) {
    throw new Error("No se pudo resolver idUsuario desde userService");
  }

  return idUsuario;
}

// Normaliza datos de actividades personales desde la API
// Convierte múltiples variantes de campos API al formato estándar interno
// Importante: maneja divergencias en nombres de propiedades entre endpoints
function normalizePersonalData(apiData) {
  if (!Array.isArray(apiData)) {
    console.error("Datos de actividades personales no son un array:", apiData);
    return [];
  }

  return apiData.map((item) => {
    const startTimeRaw =
      item.start_hour ??
      item.start_time ??
      item.startHour ??
      item.StartHour ??
      item.times?.[0];
    const endTimeRaw =
      item.end_hour ??
      item.end_time ??
      item.endHour ??
      item.EndHour ??
      item.times?.[1];
    const rawDateStart = item.date_start ?? item.dateStart ?? item.Dt_Start ?? item.dt_start;
    const rawDateEnd = item.date_end ?? item.dateEnd ?? item.Dt_End ?? item.dt_end;
    const startTime = normalizeTimeForView(startTimeRaw);
    const endTime = normalizeTimeForView(endTimeRaw);
    const normalizedDay = normalizeDayValue(
      item.day ?? item.Day ?? item.day_number ?? item.week_day ?? item.weekday ?? item.times?.[2],
      rawDateStart
    );
    const normalizedId = unwrapApiScalar(
      item.id_course ??
      item.id ??
      item.N_idcourse ??
      item.N_idCourse ??
      item.id_personal_schedule ??
      item.N_idPersonalSchedule ??
      item.IdPersonalSchedule
    );
    const normalizedName = unwrapApiScalar(
      item.subject_name ?? item.activity_name ?? item.activity ?? item.Activity ?? item.name
    );
    const normalizedDescription = unwrapApiScalar(item.description ?? item.Description);
    const normalizedTag = unwrapApiScalar(item.tag ?? item.Tag) || "Personal";
    const dateStart = unwrapApiScalar(rawDateStart);
    const dateEnd = unwrapApiScalar(rawDateEnd);

    return {
      id: normalizedId,
      name: normalizedName,
      description: normalizedDescription || "",
      tag: normalizedTag,
      start_time: startTime,
      end_time: endTime,
      day: normalizedDay,
      // Campos adicionales para compatibilidad
      subject_name: normalizedName,
      activity_name: normalizedName,
      location: "",
      classroom: "",
      date_start: dateStart,
      date_end: dateEnd,
      apiData: item
    };
  });
}

// ============================================================================
// Componente PersonalFetcher
// ============================================================================
// Carga el horario personal/actividades del usuario desde la API.
// Normaliza datos a formato estándar y notifica al padre mediante una función.
// Muestra LoadingModal durante la carga. No renderiza elemento visual.
//
// Propiedades:
//   - onDataLoaded: Función que recibe datos normalizados
//   - userId: ID del usuario para obtener su horario personal
//   - academicPeriod: { id, nombre } del período académico a filtrar, null = todos
// ============================================================================

function PersonalFetcher({ onDataLoaded, userId, academicPeriod }) {
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
      
      // Construir URL con parámetros: userId y opcionalmente periodId
      let url = `${baseUrl}${userId}`;
      if (academicPeriod && academicPeriod.id) {
        url += `?academicPeriod=${encodeURIComponent(academicPeriod.id)}`;
      }
      
      console.log("Fetching personal schedule:", url);
      try {
        const response = await fetch(url);
        
        // Verificar si la respuesta fue exitosa
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error HTTP ${response.status} al cargar datos personales:`, errorText);
          setApiData([]);
          if (onDataLoaded) {
            onDataLoaded([]);
          }
          return;
        }
        
        let json;
        try {
          json = await response.json();
        } catch (parseError) {
          console.error("Error al parsear JSON de respuesta:", parseError);
          console.error("Respuesta recibida:", await response.text());
          setApiData([]);
          if (onDataLoaded) {
            onDataLoaded([]);
          }
          return;
        }
        
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
        console.log(`URL solicitada: ${url}`);
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
  }, [onDataLoaded, userId, academicPeriod]); // Re-fetch si cambia el período, ID o onDataLoaded

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
    const idUsuario = await resolveIdUsuario(userId);
    
    console.log("Formato de fechas:");
    console.log("  - dateStart entrada:", activityData.dateStart);
    console.log("  - dateStart formateada:", formattedDateStart);
    console.log("  - dateEnd entrada:", activityData.dateEnd);
    console.log("  - dateEnd formateada:", formattedDateEnd);
    console.log("Formato de horas:");
    console.log("  - startHour entrada:", activityData.startHour);
    console.log("  - startHour formateada:", formatTimeWithColons(activityData.startHour));
    console.log("  - endHour entrada:", activityData.endHour);
    console.log("  - endHour formateada:", formatTimeWithColons(activityData.endHour));
    console.log("Día:", activityData.day, "->", dayMap[activityData.day]);

    // Preparar los datos en el formato que espera la API
    const payload = {
      id_user: idUsuario,
      id_academic_per: 1,
      subject_name: activityData.title,
      description: activityData.description || "",
      date_start: formattedDateStart,
      date_end: formattedDateEnd,
      start_hour: formatTimeWithColons(activityData.startHour),
      end_hour: formatTimeWithColons(activityData.endHour),
      day: dayMap[activityData.day] || 1
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
      // Leer el body una sola vez: solo puede leerse una vez por respuesta
      const bodyText = await response.text();
      let errorDetails = bodyText;
      
      try {
        // Intentar parsear como JSON para mejores detalles de error
        const errorData = JSON.parse(bodyText);
        errorDetails = JSON.stringify(errorData);
      } catch (parseError) {
        // Si no es JSON, usar el texto crudo (por ejemplo, una página HTML de error)
        errorDetails = bodyText || `HTTP ${response.status}`;
      }
      
      console.error("❌ Error " + response.status + " - Detalles completos:", errorDetails);
      console.error("❌ Payload enviado:", JSON.stringify(payload, null, 2));
      throw new Error(`Error en la API: ${response.status} ${response.statusText} - ${errorDetails}`);
    }

    // Parsear la respuesta exitosa
    const bodyText = await response.text();
    let data;
    try {
      data = JSON.parse(bodyText);
    } catch (parseError) {
      console.error("Error al parsear respuesta JSON:", parseError);
      console.error("Respuesta recibida:", bodyText);
      throw new Error(`Error al parsear respuesta: ${parseError.message}`);
    }
    // respuesta recibida (log emoji removed)
    
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

    // Logs de depuración de deletePersonalActivity removidos

    const payload = {
      IdPersonalSchedule: activityId
    };

    // Log de payload removido

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const bodyText = await response.text();
      let errorDetails = bodyText;
      
      try {
        const errorData = JSON.parse(bodyText);
        errorDetails = JSON.stringify(errorData);
      } catch (parseError) {
        errorDetails = bodyText || `HTTP ${response.status}`;
      }
      
      console.error("❌ Error de eliminación " + response.status + ":", errorDetails);
      throw new Error(`Error en la API: ${response.status} ${response.statusText} - ${errorDetails}`);
    }

    // Parsear la respuesta exitosa
    const bodyText = await response.text();
    let data;
    try {
      data = JSON.parse(bodyText);
    } catch (parseError) {
      console.error("Error al parsear respuesta JSON:", parseError);
      console.error("Respuesta recibida:", bodyText);
      throw new Error(`Error al parsear respuesta: ${parseError.message}`);
    }
    
    return data;
  } catch (error) {
    console.error("❌ Error al eliminar actividad personal:", error);
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
    const idUsuario = await resolveIdUsuario(userId);

    // Construir payload idéntico a addPersonalActivity, solo cambiar activityData por updates
    const payload = {
      id_user: idUsuario,
      id_course: activityId,
      subject_name: updates.title,
      description: updates.description || "",
      date_start: formattedDateStart,
      date_end: formattedDateEnd,
      start_hour: formatTimeWithColons(updates.startHour),
      end_hour: formatTimeWithColons(updates.endHour),
      day: dayMap[updates.day] || 1
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
      const bodyText = await response.text();
      let errorDetails = bodyText;
      
      try {
        const errorData = JSON.parse(bodyText);
        errorDetails = JSON.stringify(errorData);
      } catch (parseError) {
        errorDetails = bodyText || `HTTP ${response.status}`;
      }
      
      console.error("❌ Error al actualizar " + response.status + ":", errorDetails);
      throw new Error(`Error en la API: ${response.status} ${response.statusText} - ${errorDetails}`);
    }

    // Parsear la respuesta exitosa
    const bodyText = await response.text();
    let data;
    try {
      data = JSON.parse(bodyText);
    } catch (parseError) {
      console.error("Error al parsear respuesta JSON:", parseError);
      console.error("Respuesta recibida:", bodyText);
      throw new Error(`Error al parsear respuesta: ${parseError.message}`);
    }
    console.log("Actividad actualizada:", data);
    
    return data;
  } catch (error) {
    console.error("Error al actualizar actividad personal:", error);
    throw error;
  }
};

export default PersonalFetcher;

