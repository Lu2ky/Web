import "./StudentPage.css";

import Header from "../../app/layout/Header";
import ToDoList from "../../features/reminders/ui/ToDoList";
import OnboardingOverlay from "../../features/onboarding/ui/OnboardingOverlay";
import StudentCalendarSection from "../../features/schedule/ui/StudentCalendarSection";
import { hasAnyRole, ROLE_ADMIN, getSessionNumericUserId } from "../../shared/session/authSession";

/**
 * Página del estudiante: compone layout, recordatorios y calendario.
 *
 * La lógica de horario vive en `features/schedule`; aquí no hay llamadas a la
 * API ni normalización de datos.
 */
function StudentPage() {
	const numericUserId = getSessionNumericUserId();
	const isAdminUser = hasAnyRole([ROLE_ADMIN]);

	return (
		<div className="App">
			{!isAdminUser && <OnboardingOverlay />}
			<div data-onboarding-id="header">
				<Header userId={numericUserId} />
			</div>
			<div className="mainContent">
				<div className="ToDoSection" data-onboarding-id="todo">
					<ToDoList userId={numericUserId} />
				</div>
				<div className="CalendarSection" data-onboarding-id="calendar">
					<StudentCalendarSection numericUserId={numericUserId} />
				</div>
			</div>
		</div>
	);
}

export default StudentPage;
