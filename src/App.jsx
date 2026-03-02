
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
// Componentes secundarios
import { PopUpClasses } from "./components/Calendar/PopUpClasses";
import { THEME_OPTIONS } from "./components/ControlBar/ThemeOptions";
// Servicios para interactuar con la API 
import OficialFetcher from "./services/OficialFetcher";
import { getCategories } from "./services/categoriesService";
import { deleteActivity } from "./services/personalActivitiesService";
import { getAllActivities } from "./services/personalActivitiesService";

const dayByIndex = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const toHHMM = (value) => {
	if (typeof value !== "string") return "";
	return value.length >= 5 ? value.slice(0, 5) : value;
};

const getDayFromDateString = (value) => {
	if (typeof value !== "string" || value.trim() === "") return "";
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return "";
	return dayByIndex[parsed.getDay()] || "";
};

const normalizePersonalEvent = (event, index) => {
	const times = Array.isArray(event?.times) ? event.times : [];
	const hasTimesWithId = times.length >= 5;
	const hasTimesBasic = times.length >= 2;

	const startFromTimes = hasTimesWithId ? times[1] : hasTimesBasic ? times[0] : "";
	const endFromTimes = hasTimesWithId ? times[2] : hasTimesBasic ? times[1] : "";

	const dayFromTimesDate = hasTimesWithId ? getDayFromDateString(times[3]) : "";
	const dayFromTimesIndex = !hasTimesWithId && typeof times[2] === "number"
		? ({ 1: "Lunes", 2: "Martes", 3: "Miércoles", 4: "Jueves", 5: "Viernes", 6: "Sábado", 7: "Domingo" }[times[2]] || "")
		: "";

	return {
		id: event?.id ?? `personalActivity-${index}`,
		subject_name: event?.subject_name || event?.activity_name || event?.name || "Actividad personal",
		activity_name: event?.activity_name || event?.name || event?.subject_name || "Actividad personal",
		professor_name: event?.professor_name || "Personal",
		classroom: event?.classroom || event?.location || event?.tag || "Personal",
		location: event?.location || event?.classroom || "Personal",
		start_time: toHHMM(event?.start_time || event?.startHour || startFromTimes),
		end_time: toHHMM(event?.end_time || event?.endHour || endFromTimes),
		day: event?.day || dayFromTimesDate || dayFromTimesIndex || "Lunes",
		tag: event?.tag || "Personal",
	};
};

const normalizePersonalEvents = (eventsList) => {
	if (!Array.isArray(eventsList)) return [];
	return eventsList
		.map((event, index) => normalizePersonalEvent(event, index))
		.filter((event) => event.start_time && event.end_time && event.day);
};


// Funciones para normalizar datos 

//Normalizar Horario oficial
function normalizeApiData(apiData) {

	if (!Array.isArray(apiData)) {
		console.error(" Datos de la API no son un array:", apiData);
		return [];
	}
	const dayMap = {
		// de número a día de la semana
		1: "Lunes",
		2: "Martes",
		3: "Miércoles",
		4: "Jueves",
		5: "Viernes",
		6: "Sábado",
		7: "Domingo"
	};

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
	const [themeId, setThemeId] = useState("default"); // ID del tema seleccionado, se pasa al ThemeSelector y se usa para cargar el mapa de colores de etiquetas
	const [tagColorMap, setTagColorMap] = useState({}); // Mapa de colores para etiquetas, se carga desde las categorías obtenidas de la API
	const [selectedTag, setSelectedTag] = useState("Todos"); // Etiqueta seleccionada para filtrar actividades en el calendario

	// Cargar actividades personales desde localStorage al iniciar la app
	useEffect(() => {
		const personalActivities = normalizePersonalEvents(getAllActivities());
		setPersonalEvents(personalActivities);
	}, []);

	// Los datos de la API se cargan a través del componente ApiFetcher, que llama a handleDataLoaded cuando los datos están listos
	{/*const handleDataLoaded = useCallback(data => {
		console.log("Datos recibidos en App.jsx", data) // Verificar la estructura de los datos recibidos (Quitar)
		const normalized = normalizeApiData(data);
		setClassEvents(normalized);
	}, []);*/}

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


	const handleClassClick = event => {
		// Buscar todas las sesiones de esta clase (mismo NRC)
		const allSessions = classEvents.filter(e => e.NRC === event.NRC);

		// Crear el objeto classData para PopUpClasses
		const classData = {
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
			}))
		};

		setSelectedClass(classData);
		setShowClassPopup(true);
	};
	// Cierra el popup de detalles de clase y limpia la clase seleccionada
	const handleClosePopup = () => {
		setShowClassPopup(false);
		setSelectedClass(null);
	};

	const handleActivitySaved = () => {
		// Recargar actividades personales despues de guardar una nueva actividad
		const personalActivities = normalizePersonalEvents(getAllActivities());
		setPersonalEvents(personalActivities);
	};
	// Elimina actividad personal, recarga la lista de actividades personales para actualizar la vista
	const handleDeletePersonal = id => {
		deleteActivity(id);
		const personalActivities = normalizePersonalEvents(getAllActivities());
		setPersonalEvents(personalActivities);
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
		classEvents.filter(event => event.tag === selectedTag);
	const filteredPersonalEvents =
		selectedTag === "Todos" || selectedTag === "Personal" ?
			personalEvents :
			[];
	console.log(userId)

	return (

		<div className="App">
			<Header />
			<div className="mainContent">
				<div className="ToDoSection">
					<ToDoList userId={userId} />
				</div>
				<div className="CalendarSection">
					<OficialFetcher
						userId={userId}
						onDataLoaded={handleDataLoaded}
					/>

					<Calendar
						viewMode={viewMode}
						events={filteredClassesEvents}
						personalEvents={filteredPersonalEvents}
						onClassClick={handleClassClick}
						onDeletePersonal={handleDeletePersonal}
						tagColorMap={tagColorMap}
						getContrastColor={getContrastColor}
					/>
					{/* Popup para detalles de clases  */}
					<PopUpClasses
						isOpen={showClassPopup}
						onClose={handleClosePopup}
						classData={selectedClass}
					/>
					<ControlBar
						viewMode={viewMode}
						setViewMode={setViewMode}
						weekOffset={weekOffset}
						setWeekOffset={setWeekOffset}
						onActivitySaved={handleActivitySaved}
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

