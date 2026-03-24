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
// Componentes secundarios
import { PopUpClasses } from "./components/Calendar/PopUpClasses";
import { PopUpPersonal } from "./components/Calendar/PopUpPersonal";
import { THEME_OPTIONS } from "./components/ControlBar/ThemeOptions";
// Servicios para interactuar con la API 
// Calendario
// Horario oficial 
import OficialFetcher from "./services/OficialFetcher";
import { getCategories } from "./services/categoriesService";

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
	return apiData.map((item, index) => ({
		id: `materiaOficial-${item.nrc}-${index}`,
		subject_name: item.subject_name,
		professor_name: item.professor_name,
		classroom: item.classroom,
		NRC: item.NRC,
		start_time: item.times[0].slice(0, 5), // recortar segundos
		end_time: item.times[1].slice(0, 5),
		day: dayMap[item.times[2]] || "Lunes",
		etiqueta: item.tag, // Para mostrar el tipo de clase (Teoría, Práctica, etc.) en el calendario
		// Datos para PopUp
		campus: item.campus,
		credits: item.Credits?.Float64 || 0,
		//tagColour: item.tagColour, // Para asignar color según el tipo de clase (Teoría, Práctica, etc.)
		// Datos originales
		apiData: item
	}));
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



	const handleDataLoaded = useCallback((data) => {
		console.log("Datos recibidos en App:", data);
		if (!Array.isArray(data)) {
			console.error("La API no devolvió un array:", data);
			return;
		}
		const normalized = normalizeApiData(data);
		console.log("Datos normalizados:", normalized);
		setClassEvents(normalized);
	}, []);

	// Manejador para datos personales que vienen del PersonalFetcher (ya normalizados)
	const handlePersonalDataLoaded = useCallback((data) => {
		console.log("Datos personales recibidos del API en App:", data);

		if (!Array.isArray(data)) {
			console.error("Los datos personales de la API no son un array:", data);
			setPersonalEvents([]);
			return;
		}

		// Normalizar datos del API
		const normalizedApiData = normalizePersonalEvents(data);
		console.log("Datos personales normalizados:", normalizedApiData);
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

	//Callback que recibe el ThemeSelector cuando se cambia el tema, actualiza el estado del tema
	const handleThemeChange = newThemeId => {
		setThemeId(newThemeId);
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

	//Calcular materias filtradas 
	const filteredClassesEvents = selectedTag === "Todos" ?
		classEvents :
		classEvents.filter(event => event.etiqueta === selectedTag);
	const filteredPersonalEvents =
		selectedTag === "Todos" || selectedTag === "Personal" ?
			personalEvents :
			[];
	return (

		<div className="App">
			<Header userId={userId} />
			<div className="mainContent">
				<div className="ToDoSection">
					<ToDoList userId={userId} />
				</div>
				<div className="CalendarSection">
					<OficialFetcher
						userId={userId}
						onDataLoaded={handleDataLoaded}
					/>

					<PersonalFetcher
						userId={userId}
						onDataLoaded={handlePersonalDataLoaded}
					/>

					<Calendar
						viewMode={viewMode}
						events={filteredClassesEvents}
						personalEvents={filteredPersonalEvents}

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
						userId={userId}
						onActivityAdd={handleActivityAdd}
						onThemeChange={handleThemeChange}
						selectedTag={selectedTag}
						setSelectedTag={setSelectedTag}

					/>
				</div>
			</div>
		</div>
	);
}

export default App;

