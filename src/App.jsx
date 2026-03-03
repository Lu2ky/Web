
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
// Calendario
// Horario oficial 
import OficialFetcher from "./services/OficialFetcher";
import { getCategories } from "./services/categoriesService";

// Actividades personales
import PersonalFetcher from "./services/PersonalFetcher";
//import { deleteActivity } from "./services/personalActivitiesService";
//import { getAllActivities } from "./services/personalActivitiesService";


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

// Normalizar actividades personales 

//Normaliza una actividad 
const normalizePersonalEvent = (apiDataPersonal) => {
	if (!Array.isArray(apiDataPersonal)) {
		console.error("Datos de actividad personal no son un array:", apiDataPersonal);
		return [];
	}

	return apiDataPersonal.map((item, index) => ({
		id: `actividadPersonal-${item.id}`,
		subject_name: item.subject_name,
		description: item.description,
		start_time: item.times[0].slice(0, 5), // recortar segundos
		end_time: item.times[1].slice(0, 5),
		day: dayMap[item.times[2]] || "Lunes",
		etiqueta: item.tag || "Personal",
		date_start: item.date_start,
		date_end: item.date_end,
		apiData: item 		// Datos originales
	}));
};

// HASTA AQUIII ESTA ARREGLADO

// Normaliza una lista de actividades personales 
const normalizePersonalEvents = (eventsList) => {
	if (!Array.isArray(eventsList)) return [];
	return eventsList
		.map((event, index) => normalizePersonalEvent(event, index))
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

