import "./styles/App.css";
import {useState, useEffect} from "react";
import {useCallback} from "react";
import ApiFetcher from "./services/OficialFetcher";
import IdInput from "./components/LogIn/IdInput";
import Header from "./components/Navegation/Header";
import ControlBar from "./components/ControlBar/ControlBar";
import Calendar from "./components/Calendar/Calendar";
import {deleteActivity} from "./services/personalActivitiesService";
import ToDoList from "./components/TodoList/ToDoList";
import {PopUpClasses} from "./components/Calendar/PopUpClasses";
import {getAllActivities} from "./services/personalActivitiesService";
// Prueba de test CI/CD
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
		etiqueta: item.tag, // Para mostrar el tipo de clase (Teoría, Práctica, etc.) en el calendario
		// Datos para PopUp
		campus: item.Campus,
		credits: item.Credits?.Float64 || 0,
		academicPeriod: item.academicPeriod,
		tagColour: item.tag, // Para asignar color según el tipo de clase (Teoría, Práctica, etc.)
		// Datos originales
		apiData: item
	}));
}

function App() {
	const [viewMode, setViewMode] = useState("Semanal"); // "Semanal" o "Diario"
	const [classEvents, setClassEvents] = useState([]); // Eventos de clases oficiales
	const [personalEvents, setPersonalEvents] = useState([]); // Eventos personales (actividades guardadas)
	const [showClassPopup, setShowClassPopup] = useState(false); // Para mostrar/ocultar el popup de detalles de clase
	const [selectedClass, setSelectedClass] = useState(null); // Datos de la clase seleccionada para el popup
	const [userId, setUserId] = useState(""); // ID ingresado por el usuario para cargar su horario
	const [submittedId, setSubmittedId] = useState(""); // ID que se ha enviado para cargar datos (se actualiza al enviar el formulario)

	// Cargar actividades personales desde localStorage al iniciar la app
	useEffect(() => {
		const personalActivities = getAllActivities();
		setPersonalEvents(personalActivities);
	}, []);
	// Los datos de la API se cargan a través del componente ApiFetcher, que llama a handleDataLoaded cuando los datos están listos
	const handleDataLoaded = useCallback(data => {
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
	// Elomona actividad personal, recarga la lista de actividades personales para actualizar la vista
	const handleDeletePersonal = id => {
		deleteActivity(id);
		const personalActivities = getAllActivities();
		setPersonalEvents(personalActivities);
	};

	return (
		<div className="container">
			<div className="Card">
				<div className="App">
					<Header />
					<IdInput
						userId={userId}
						setUserId={setUserId}
						onSubmit={setSubmittedId}
					/>
					<ControlBar
						viewMode={viewMode}
						setViewMode={setViewMode}
						onActivitySaved={handleActivitySaved}
					/>
					<div className="mainContent">
						<div className="ToDoSection">
							<ToDoList />
						</div>
						<div className="CalendarSection">
							<ApiFetcher
								onDataLoaded={handleDataLoaded}
								userId={submittedId}
							/>
							<Calendar
								viewMode={viewMode}
								events={classEvents}
								personalEvents={personalEvents}
								onClassClick={handleClassClick}
								onDeletePersonal={handleDeletePersonal}
							/>
						</div>
					</div>
					{/* Popup para detalles de clases */}
					<PopUpClasses
						isOpen={showClassPopup}
						onClose={handleClosePopup}
						classData={selectedClass}
					/>
				</div>
			</div>
		</div>
	);
}

export default App;
