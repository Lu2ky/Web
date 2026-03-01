import "./styles/App.css";
import { useState, useEffect, use } from "react";
import { useCallback } from "react";
import ApiFetcher from "./services/OficialFetcher";
import IdInput from "./components/LogIn/IdInput";
import Header from "./components/Navegation/Header";
import ControlBar from "./components/ControlBar/ControlBar";
import Calendar from "./components/Calendar/Calendar";
import { deleteActivity } from "./services/personalActivitiesService";
import ToDoList from "./components/TodoList/ToDoList";
import { PopUpClasses } from "./components/Calendar/PopUpClasses";
import { getAllActivities } from "./services/personalActivitiesService";
import { THEME_OPTIONS } from "./components/ControlBar/ThemeOptions";
import { getCategories } from "./services/categoriesService";


// Transforma los datos de la API al formato que usa la app
function normalizeApiData(apiData) {
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
		id: `materiaOficial-${item.NRC}-${index}`,
		subject_name: item.subject_name,
		professor_name: item.professor_name,
		classroom: item.classroom,
		nrc: item.NRC,
		start_time: item.times[0].slice(0, 5),
		end_time: item.times[1].slice(0, 5),
		day: dayMap[item.times[2]] || "Lunes",
		etiqueta: item.Tag, // Para mostrar el tipo de clase (Teoría, Práctica, etc.) en el calendario
		// Datos para PopUp
		campus: item.Campus,
		credits: item.Credits?.Float64 || 0,
		tagColour: item.Tag, // Para asignar color según el tipo de clase (Teoría, Práctica, etc.)
		// Datos originales
		apiData: item
	}));
}

function App() {
	const getInitialView = () => {
		return window.innerWidth <= 425 ? "Diario" : "Semanal"; // Vista inicial basada en el ancho de la pantalla (mobile chiquito vs desktop)
	};
	const [viewMode, setViewMode] = useState(getInitialView()); // "Semanal" o "Diario"
	const [weekOffset, setWeekOffset] = useState(0); // Offset para semana (0 = semana actual), NO MOVER NI QUITAR O SE CAE TODO
	const [classEvents, setClassEvents] = useState([]); // Eventos de clases oficiales
	const [personalEvents, setPersonalEvents] = useState([]); // Eventos personales (actividades guardadas)
	const [showClassPopup, setShowClassPopup] = useState(false); // Para mostrar/ocultar el popup de detalles de clase
	const [selectedClass, setSelectedClass] = useState(null); // Datos de la clase seleccionada para el popup
	const [userId, setUserId] = useState(""); // ID ingresado por el usuario para cargar su horario
	const [submittedId, setSubmittedId] = useState(""); // ID que se ha enviado para cargar datos (se actualiza al enviar el formulario)
	const [themeId, setThemeId] = useState("default"); // ID del tema seleccionado, se pasa al ThemeSelector y se usa para cargar el mapa de colores de etiquetas
	const [tagColorMap, setTagColorMap] = useState({}); // Mapa de colores para etiquetas, se carga desde las categorías obtenidas de la API
	const [selectedTag, setSelectedTag] = useState("Todos"); // Etiqueta seleccionada para filtrar actividades en el calendario


	// Cargar actividades personales desde localStorage al iniciar la app
	useEffect(() => {
		const personalActivities = getAllActivities();
		setPersonalEvents(personalActivities);
	}, []);
	// Los datos de la API se cargan a través del componente ApiFetcher, que llama a handleDataLoaded cuando los datos están listos
	const handleDataLoaded = useCallback(data => {
		console.log("API:", data[0]); // Verificar la estructura de los datos recibidos (Quitar)
		const normalized = normalizeApiData(data);
		setClassEvents(normalized);
	}, []);

	const handleClassClick = event => {
		// Buscar todas las sesiones de esta clase (mismo NRC)
		const allSessions = classEvents.filter(e => e.nrc === event.nrc);

		// Crear el objeto classData para PopUpClasses
		const classData = {
			subject_name: event.subject_name,
			instructor_name: event.professor_name,
			nrc: event.nrc,
			credits: event.credits,
			campus: event.campus,
			code: event.nrc,
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
		const personalActivities = getAllActivities();
		setPersonalEvents(personalActivities);
	};
	// Elimina actividad personal, recarga la lista de actividades personales para actualizar la vista
	const handleDeletePersonal = id => {
		deleteActivity(id);
		const personalActivities = getAllActivities();
		setPersonalEvents(personalActivities);
	};

	useEffect(() => {
		getCategories().then((categories) => {
			const theme = THEME_OPTIONS.find((t) => t.id === themeId) || THEME_OPTIONS[0];
			const palette = theme?.colors || THEME_OPTIONS[0].colors;
			const map = {};
			categories.forEach((cat, index) => {
				map[cat] = palette[index % palette.length];
			});
			setTagColorMap(map);
		});
	}, [themeId]);

	//Callback que recibe el ThemeSelector cuando se cambia el tema, actualiza el estado del tema
	const handleThemeChange = (newThemeId) => {
		setThemeId(newThemeId);
	};

	//Obtener color por etiqueta
	const getTagColor = (tag) => {
		return tagColorMap[tag] || "#b1d4f0"; // Color por defecto si no se encuentra la etiqueta
	};
	//Obtener color de texto (blanco o negro) según el color de fondo para asegurar legibilidad
	const getContrastColor = (hex) => {
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

	return (
		<div className="App">
			<Header />
			<IdInput
				userId={userId}
				setUserId={setUserId}
				onSubmit={setSubmittedId}
			/>
			<div className="mainContent">
				<div className="ToDoSection">
					<ToDoList userId={submittedId} />
				</div>
				<div className="CalendarSection">
					<ApiFetcher onDataLoaded={handleDataLoaded} userId={submittedId} />

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
