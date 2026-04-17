import "./styles/App.css";

// Hooks de react 
import { useState, useEffect, useCallback } from "react";
// Id de LogIn
import { useParams } from "react-router-dom";
// Componentes Primarios
import Header from "./components/Navegation/Header";
import ControlBar from "./components/ControlBar/ControlBar";
import Calendar from "./components/Calendar/Calendar";
import ToDoList from "./components/TodoList/ToDoList"; 
import MessageConfirmation from "./components/TodoList/MessageConfirmation";
import OnboardingOverlay from "./components/Onboarding/OnboardingOverlay";
// Componentes secundarios
import { PopUpClasses } from "./components/Calendar/PopUpClasses";
import { PopUpPersonal } from "./components/Calendar/PopUpPersonal";
import { THEME_OPTIONS } from "./components/ControlBar/ThemeOptions";
import { hasAnyRole, ROLE_ADMIN_UPB_PLANNER } from "./services/authSession";
// Servicios para interactuar con la API 
// Calendario
// Horario oficial 
import OficialFetcher from "./services/OficialFetcher";
import { getCategories } from "./services/categoriesService";
import { fetchAcademicPeriods } from "./services/academicPeriodsService";

// Actividades personales
import PersonalFetcher, { deletePersonalActivity } from "./services/PersonalFetcher";


// Funciones para normalizar datos de la API 

// de número a día de la semana
const dayMap = {
	1: "Lunes",
	2: "Martes",
	3: "Miércoles",
	4: "Jueves",
	5: "Viernes",
	6: "Sábado",
	7: "Domingo"
};

//Normalizar Horario oficial

function normalizeApiData(apiData) {

	if (!Array.isArray(apiData)) {
		console.error(" Datos de la API no son un array:", apiData);
		return [];
	}

	// Normaliza cada item del array de la API a un formato consistente para el calendario
	return apiData.map((item, index) => {
		// Extraer período académico de múltiples posibles claves
		const academicPeriod = item.academicPeriod 
			?? item.academic_period 
			?? item.periodoAcademico 
			?? item.periodo_academico
			?? item.period
			?? "Desconocido";
		
		return {
			id: `materiaOficial-${item.nrc}-${index}`,
			subject_name: item.subject_name,
			professor_name: item.professor_name,
			classroom: item.classroom,
			NRC: item.NRC,
			start_time: item.times[0].slice(0, 5), // recortar segundos
			end_time: item.times[1].slice(0, 5),
			day: dayMap[item.times[2]] || "Lunes",
			etiqueta: item.tag, // Para mostrar el tipo de clase (Teoría, Práctica, etc.) en el calendario
			academicPeriod: academicPeriod, // Período académico de la materia
			// Datos para PopUp
			campus: item.campus,
			credits: item.Credits?.Float64 || 0,
			//tagColour: item.tagColour, // Para asignar color según el tipo de clase (Teoría, Práctica, etc.)
			// Datos originales
			apiData: item
		};
	});
}

// Normalizar actividades personales con la info de la API

// Normaliza una actividad compatible con el formato de BlockPersonal
const normalizePersonalEvent = (item) => {
	// Los datos del API ya vienen normalizados del PersonalFetcher
	return item;
};

// Normaliza una lista de actividades personales 
const normalizePersonalEvents = (eventsList) => {
	if (!Array.isArray(eventsList)) return [];
	return eventsList
		.map((event) => normalizePersonalEvent(event))
		.filter((event) => event.start_time && event.end_time && event.day);
};

// ============================================================================
// Calcula el rango de fechas de la semana basado en weekOffset
// Devuelve { startDate, endDate } con objetos Date para comparación
// ============================================================================
const getWeekDateRange = (weekOffset = 0) => {
	const today = new Date();
	const currentDay = today.getDay(); // 0 = Domingo, 1 = Lunes, etc.
	const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
	const startOfWeek = new Date(today);
	startOfWeek.setDate(today.getDate() - daysFromMonday + (weekOffset * 7));
	startOfWeek.setHours(0, 0, 0, 0);
	
	const endOfWeek = new Date(startOfWeek);
	endOfWeek.setDate(startOfWeek.getDate() + 6);
	endOfWeek.setHours(23, 59, 59, 999);
	
	return { startDate: startOfWeek, endDate: endOfWeek };
};

// ============================================================================
// Verifica si una semana (por weekOffset) cae dentro del rango de un período académico
// ============================================================================
const isWeekInPeriod = (weekOffset, period) => {
	if (!period || (!period.start_date && !period.end_date)) {
		// Si el período no tiene fechas, considerarlo válido para todas las semanas
		return true;
	}

	const { startDate, endDate } = getWeekDateRange(weekOffset);
	
	// Convertir strings de fecha (YYYY-MM-DD) a Date objects
	const periodStart = period.start_date ? new Date(period.start_date) : null;
	const periodEnd = period.end_date ? new Date(period.end_date + "T23:59:59") : null;
	
	// Lógica de verificación
	const result = !(periodStart && endDate < periodStart) && !(periodEnd && startDate > periodEnd);
	
	// Si el período no tiene fechas válidas, considerarlo válido
	if (!periodStart && !periodEnd) return true;
	
	// Si la semana está completamente antes del inicio del período, no mostrar
	if (periodStart && endDate < periodStart) return false;
	
	// Si la semana está completamente después del fin del período, no mostrar
	if (periodEnd && startDate > periodEnd) return false;
	
	// Si la semana se superpone con el período, mostrar
	return true;
};

// ============================================================================
// Verifica si una actividad personal es vigente durante la semana especificada
// Compara date_start y date_end de la actividad con el rango de la semana
// ============================================================================
const isActiveLaterallyInWeek = (activity, weekOffset) => {
	if (!activity) return false;

	// Si no tiene fechas de vigencia, NO mostrar
	if (!activity.date_start && !activity.date_end) {
		return false;
	}

	const { startDate: weekStart, endDate: weekEnd } = getWeekDateRange(weekOffset);

	// Función auxiliar: extraer solo YYYY-MM-DD de strings que pueden incluir hora
	const extractDateOnly = (dateStr) => {
		if (!dateStr) return null;
		return String(dateStr).split(' ')[0].split('T')[0];
	};

	const dateStartStr = extractDateOnly(activity.date_start);
	const dateEndStr = extractDateOnly(activity.date_end);

	// Convertir strings de fecha (YYYY-MM-DD) a Date objects
	const activityStart = dateStartStr ? new Date(dateStartStr + "T00:00:00") : null;
	const activityEnd = dateEndStr ? new Date(dateEndStr + "T23:59:59") : null;

	// Si la actividad no tiene fechas válidas, NO mostrar
	if (!activityStart && !activityEnd) return false;

	// Si la actividad está completamente antes de la semana, no mostrar
	if (activityEnd && weekStart > activityEnd) {
		return false;
	}

	// Si la actividad está completamente después de la semana, no mostrar
	if (activityStart && weekEnd < activityStart) {
		return false;
	}

	// Si la actividad se superpone con la semana, mostrar
	return true;
};

const getInitialView = () => {
	return window.innerWidth <= 425 ? "Diario" : "Semanal"; // Vista inicial basada en el ancho de la pantalla (mobile chiquito vs desktop)
};
function App() {

	const { userId } = useParams(); // Obtener el ID del usuario desde la URL
	const [viewMode, setViewMode] = useState(getInitialView()); // "Semanal" o "Diario"
	const [weekOffset, setWeekOffset] = useState(0); // Offset para semana (0 = semana actual), NO MOVER NI QUITAR O SE CAE TODO
	const [classEvents, setClassEvents] = useState([]); // Eventos de clases oficiales
	const [personalEvents, setPersonalEvents] = useState([]); // Eventos personales (actividades guardadas)
	const [showClassPopup, setShowClassPopup] = useState(false); // Para mostrar/ocultar el popup de detalles de clase
	const [selectedClass, setSelectedClass] = useState(null); // Datos de la clase seleccionada para el popup
	const [showPersonalPopup, setShowPersonalPopup] = useState(false); // Para mostrar/ocultar el popup de detalles de actividad personal
	const [selectedPersonal, setSelectedPersonal] = useState(null); // Datos de la actividad personal seleccionada
	const [showDeletePersonalConfirm, setShowDeletePersonalConfirm] = useState(false); // Modal de confirmación para borrar actividad personal
	const [pendingDeletePersonalId, setPendingDeletePersonalId] = useState(null); // ID de la actividad pendiente de eliminación
	const [themeId, setThemeId] = useState("default"); // ID del tema seleccionado, se pasa al ThemeSelector y se usa para cargar el mapa de colores de etiquetas
	const [tagColorMap, setTagColorMap] = useState({}); // Mapa de colores para etiquetas, se carga desde las categorías obtenidas de la API
	const [selectedTag, setSelectedTag] = useState("Todos"); // Etiqueta seleccionada para filtrar actividades en el calendario
	const [selectedAcademicPeriod, setSelectedAcademicPeriod] = useState(null); // { id, nombre } del período académico seleccionado, null = "Todos"
	const [academicPeriods, setAcademicPeriods] = useState([]); // Array de períodos académicos con { id, nombre, start_date, end_date }
	const isAdminUser = hasAnyRole([ROLE_ADMIN_UPB_PLANNER]);

	// Log actual de sincronización de datos



	const handleDataLoaded = useCallback((data) => {
		if (!Array.isArray(data)) return;
		const normalized = normalizeApiData(data);
		setClassEvents(normalized);
	}, []);

	// Manejador para datos personales que vienen del PersonalFetcher (ya normalizados)
	const handlePersonalDataLoaded = useCallback((data) => {
		if (!Array.isArray(data)) {
			setPersonalEvents([]);
			return;
		}

		// Normalizar datos del API
		const normalizedApiData = normalizePersonalEvents(data);
		setPersonalEvents(normalizedApiData);
	}, []);

	const handleClassClick = event => {
		// Buscar todas las sesiones de esta clase (mismo NRC)
		const allSessions = classEvents.filter(e => e.NRC === event.NRC);
		const apiCourseId = event?.apiData?.N_idCurso
			?? event?.apiData?.id_course
			?? event?.apiData?.idCourse
			?? event?.apiData?.ID_CURSO
			?? event?.apiData?.id;
		const apiScheduleId = event?.apiData?.N_idHorario
			?? event?.apiData?.id_horario
			?? event?.apiData?.id_schedule
			?? event?.apiData?.idSchedule
			?? event?.apiData?.ID_HORARIO
			?? event?.apiData?.schedule_id;

		// Crear el objeto classData para PopUpClasses
		const classData = {
			id: apiCourseId ?? event.NRC,
			scheduleId: apiScheduleId,
			subject_name: event.subject_name,
			instructor_name: event.professor_name,
			nrc: event.NRC,
			credits: event.credits,
			campus: event.campus,
			code: event.NRC,
			date_range: event.academicPeriod || "2026 semestre 1",
			schedule: allSessions.map(session => ({
				day: session.day,
				start_time: session.start_time,
				end_time: session.end_time,
				classroom: session.classroom,
				type: session.tag
			})),
			apiData: event.apiData,
		};

		setSelectedClass(classData);
		setShowClassPopup(true);
	};
	// Cierra el popup de detalles de clase y limpia la clase seleccionada
	const handleClosePopup = () => {
		setShowClassPopup(false);
		setSelectedClass(null);
	};

	// Abre el popup de detalles de una actividad personal
	const handlePersonalClick = (event) => {
		setSelectedPersonal(event);
		setShowPersonalPopup(true);
	};

	// Cierra el popup de detalles de actividad personal
	const handleClosePersonalPopup = () => {
		setShowPersonalPopup(false);
		setSelectedPersonal(null);
	};

	// Solicita confirmación para eliminar una actividad personal
	const handleRequestDeletePersonal = (id) => {
		setPendingDeletePersonalId(id);
		setShowDeletePersonalConfirm(true);
	};

	// Cierra modal de confirmación de eliminación
	const handleCloseDeletePersonalConfirm = () => {
		setShowDeletePersonalConfirm(false);
		setPendingDeletePersonalId(null);
	};

	// Elimina una actividad personal (confirmado por modal)
	const handleConfirmDeletePersonal = async () => {
		const id = pendingDeletePersonalId;
		if (!id) {
			handleCloseDeletePersonalConfirm();
			return;
		}

		try {
			// Intentar eliminar desde la API
			await deletePersonalActivity(userId, id);
		} catch (error) {
			console.error("❌ Error al eliminar de la API:", error);
			// Continuar incluso si falla la API (eliminar del estado local)
		}

		// Actualizar el estado eliminando la actividad
		setPersonalEvents(prevEvents =>
			prevEvents.filter(event => event.id !== id)
		);
		handleClosePersonalPopup();
		handleCloseDeletePersonalConfirm();
	};

	// Agrega una nueva actividad personal creada desde AddActivityButton
	const handleActivityAdd = (newActivity) => {
		// Agregar la nueva actividad al estado
		setPersonalEvents(prevEvents => [
			...prevEvents,
			newActivity
		]);
	};

	// Actualiza una actividad personal después de editarla
	const handleActivityUpdate = (updatedActivity) => {
		setPersonalEvents(prevEvents => prevEvents.map(ev => ev.id === updatedActivity.id ? { ...ev, ...updatedActivity } : ev));
		if (selectedPersonal && selectedPersonal.id === updatedActivity.id) {
			setSelectedPersonal(updatedActivity);
		}
	};

	useEffect(() => {
		getCategories().then(categories => {
			const theme =
				THEME_OPTIONS.find(t => t.id === themeId) || THEME_OPTIONS[0];
			const palette = theme?.colors || THEME_OPTIONS[0].colors;
			const map = {};
			categories.forEach((cat, index) => {
				map[cat] = palette[index % palette.length];
			});
			setTagColorMap(map);
		});
	}, [themeId]);

	// Cargar períodos académicos con rangos de fechas al montar el componente
	useEffect(() => {
		const loadAcademicPeriods = async () => {
			try {
				const periods = await fetchAcademicPeriods();
				setAcademicPeriods(periods);
			} catch (error) {
				setAcademicPeriods([]);
			}
		};
		loadAcademicPeriods();
	}, []);

	// Función de retorno que recibe ThemeSelector al cambiar el tema y actualiza su estado
	const handleThemeChange = newThemeId => {
		setThemeId(newThemeId);
	};

	// Calcula el weekOffset basado en una fecha de inicio de período
	const calculateWeekOffsetForDate = (dateString) => {
		if (!dateString) return 0;

		try {
			const targetDate = new Date(dateString);
			const today = new Date();

			// Obtener el lunes de la semana del targetDate
			const targetDay = targetDate.getDay();
			const daysFromMonday = targetDay === 0 ? 6 : targetDay - 1;
			const targetMonday = new Date(targetDate);
			targetMonday.setDate(targetDate.getDate() - daysFromMonday);
			targetMonday.setHours(0, 0, 0, 0);

			// Obtener el lunes de la semana actual
			const currentDay = today.getDay();
			const currentDaysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
			const todayMonday = new Date(today);
			todayMonday.setDate(today.getDate() - currentDaysFromMonday);
			todayMonday.setHours(0, 0, 0, 0);

			// Calcular la diferencia en semanas
			const timeDiff = targetMonday - todayMonday;
			const weekOffset = Math.round(timeDiff / (7 * 24 * 60 * 60 * 1000));

			return weekOffset;
		} catch (error) {
			console.error("Error calculando weekOffset para fecha:", dateString, error);
			return 0;
		}
	};

	const handlePeriodChange = (periodObj) => {
		setSelectedAcademicPeriod(periodObj);

		// Si se selecciona un período específico con fecha de inicio, cambiar a esa semana
		if (periodObj && periodObj.start_date) {
			const weekOffset = calculateWeekOffsetForDate(periodObj.start_date);
			setWeekOffset(weekOffset);
		} else {
			// Si se selecciona "Todos", volver a la semana actual
			setWeekOffset(0);
		}
		// Los fetchers se re-ejecutarán automáticamente cuando cambien sus dependencias
	};

	//Obtener color por etiqueta
	const getTagColor = tag => {
		return tagColorMap[tag] || "#b1d4f0"; // Color por defecto si no se encuentra la etiqueta
	};
	//Obtener color de texto (blanco o negro) según el color de fondo para asegurar legibilidad
	const getContrastColor = hex => {
		if (!hex) return "#000000";
		const r = parseInt(hex.substr(1, 2), 16);
		const g = parseInt(hex.substr(3, 2), 16);
		const b = parseInt(hex.substr(5, 2), 16);
		const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
		return luminance > 0.5 ? "#000000" : "#FFFFFF";
	};

	//Calcular materias filtradas por PERÍODO, FECHA (weekOffset) y ETIQUETA
	const filteredClassesEvents = classEvents.filter(event => {
		// Filtro por período académico seleccionado
		const periodMatch = !selectedAcademicPeriod || event.academicPeriod === selectedAcademicPeriod.nombre;
		
		// Filtro por etiqueta
		const tagMatch = selectedTag === "Todos" || event.etiqueta === selectedTag;
		
		// Filtro por rango de fechas del período académico basado en weekOffset
		// Buscar el período académico que corresponde a esta materia
		const classPeriod = academicPeriods.find(p => p.nombre === event.academicPeriod);
		const dateInRange = isWeekInPeriod(weekOffset, classPeriod);
		
		return periodMatch && tagMatch && dateInRange;
	});


	const filteredPersonalEvents = personalEvents.filter(event => {
		// Filtro por etiqueta
		const tagMatch = selectedTag === "Todos" || selectedTag === "Personal";
		
		// Filtro por vigencia: la actividad debe superponerse con la semana actual
		const dateInRange = isActiveLaterallyInWeek(event, weekOffset);
		
		return tagMatch && dateInRange;
	});
	return (

		<div className="App">
			{!isAdminUser && <OnboardingOverlay />}
			<div data-onboarding-id="header">
				<Header userId={userId} />
			</div>
			<div className="mainContent">
				<div className="ToDoSection" data-onboarding-id="todo">
					<ToDoList userId={userId} />
				</div>
				<div className="CalendarSection" data-onboarding-id="calendar">
					<OficialFetcher
						userId={userId}
						onDataLoaded={handleDataLoaded}
						academicPeriod={selectedAcademicPeriod}
					/>

					<PersonalFetcher
						userId={userId}
						onDataLoaded={handlePersonalDataLoaded}
						academicPeriod={selectedAcademicPeriod}
					/>

					<Calendar
						viewMode={viewMode}
						events={filteredClassesEvents}
						personalEvents={filteredPersonalEvents}
						weekOffset={weekOffset}
						setWeekOffset={setWeekOffset}
						onClassClick={handleClassClick}
						onDeletePersonal={handleRequestDeletePersonal}
						onPersonalClick={handlePersonalClick}
						tagColorMap={tagColorMap}
						getContrastColor={getContrastColor}
					/>
					{/* Popup para detalles de clases  */}
					<PopUpClasses
						isOpen={showClassPopup}
						onClose={handleClosePopup}
						classData={selectedClass}
						userId={userId}
					/>
					{/* Popup para detalles de actividades personales */}
					<PopUpPersonal
						isOpen={showPersonalPopup}
						onClose={handleClosePersonalPopup}
						personalData={selectedPersonal}
						onUpdate={handleActivityUpdate}
						onDelete={handleRequestDeletePersonal}
						userId={userId}
					/>
					<MessageConfirmation
						isOpen={showDeletePersonalConfirm}
						onClose={handleCloseDeletePersonalConfirm}
						onConfirm={handleConfirmDeletePersonal}
						title="¿Eliminar actividad personal?"
						description="Esta acción no se puede deshacer. La actividad se eliminará de tu horario."
						confirmText="Sí, eliminar"
						cancelText="Cancelar"
					/>
					<ControlBar
						viewMode={viewMode}
						setViewMode={setViewMode}
						userId={userId}					idCourse={selectedAcademicPeriod?.id || null}						onActivityAdd={handleActivityAdd}
						onThemeChange={handleThemeChange}
						onPeriodChange={handlePeriodChange}
						selectedTag={selectedTag}
						setSelectedTag={setSelectedTag}
						weekOffset={weekOffset}
						setWeekOffset={setWeekOffset}
					/>
				</div>
			</div>
		</div>
	);
}

export default App;

