import "./styles/App.css";
import {useState, useEffect} from "react";
import {useCallback} from "react";
import ApiFetcher from "./components/ApiFetcher";
import IdInput from "./components/IdInput";
import Header from "./components/01-Header";
import ControlBar from "./components/02-ControlBar";
import Calendar from "./components/03-Calendar";
import {deleteActivity} from "./services/personalActivitiesService";
import ToDoList from "./components/04-ToDoList";
import {PopUpClasses} from "./components/PopUpClasses";
import {getAllActivities} from "./services/personalActivitiesService";
// Prueba de test CI/CD
// Paleta de colores
//otro test
const colorPalette = [
	"#FF6B6B",
	"#4ECDC4",
	"#45B7D1",
	"#96CEB4",
	"#FFEAA7",
	"#DFE6E9",
	"#74B9FF",
	"#A29BFE",
	"#FD79A8",
	"#FDCB6E",
	"#6C5CE7",
	"#00B894",
	"#FF7675",
	"#55EFC4",
	"#81ECEC",
	"#FAB1A0",
	"#E17055",
	"#00CEC9"
];

// Función para asignar color consistente basado en nombre de materia
function getColorForSubject(subjectName) {
	let hash = 0;
	for (let i = 0; i < subjectName.length; i++) {
		hash = subjectName.charCodeAt(i) + ((hash << 5) - hash);
	}
	return colorPalette[Math.abs(hash) % colorPalette.length];
} 

function normalizeApiData(apiData) {
	const dayMap = {
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
<<<<<<< Updated upstream
		etiqueta: item.Tag,
=======
		etiqueta: item.tag, // Para mostrar el tipo de clase (Teoría, Práctica, etc.) 
>>>>>>> Stashed changes
		// Datos para PopUp
		campus: item.Campus,
		credits: item.Credits?.Float64 || 0,
		academicPeriod: item.academicPeriod,
		tag: item.Tag,
		// Color asignado por materia
		color: getColorForSubject(item.subject_name),
		// Datos originales
		apiData: item
	}));
}

function App() {
	const [viewMode, setViewMode] = useState("Semanal");
	const [classEvents, setClassEvents] = useState([]);
	const [personalEvents, setPersonalEvents] = useState([]);
	const [showClassPopup, setShowClassPopup] = useState(false);
	const [selectedClass, setSelectedClass] = useState(null);
	const [userId, setUserId] = useState("");
	const [submittedId, setSubmittedId] = useState("");

	// Cargar actividades personales al montar
	useEffect(() => {
		const personalActivities = getAllActivities();
		setPersonalEvents(personalActivities);
	}, []);

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

	const handleClosePopup = () => {
		setShowClassPopup(false);
		setSelectedClass(null);
	};

	const handleActivitySaved = () => {
		// Recargar actividades personales del localStorage
		const personalActivities = getAllActivities();
		setPersonalEvents(personalActivities);
	};

	const handleDeletePersonal = id => {
		deleteActivity(id);
		const personalActivities = getAllActivities();
		setPersonalEvents(personalActivities);
	};

	return (
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
					<ApiFetcher onDataLoaded={handleDataLoaded} userId={submittedId} />
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
	);
}

export default App;
