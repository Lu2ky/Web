import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
	getOnboardingCompletionStatus,
	resetOnboardingCompletion,
	saveOnboardingCompletion
} from "../services/onboardingService";

const ONBOARDING_STORAGE_PREFIX = "onboarding_visited:";
const ONBOARDING_VERSION = 1;

const ONBOARDING_STEPS = [
	{
		id: "open-account-dropdown",
		title: "Abre tu cuenta",
		description:
			"Haz clic en el avatar de la esquina superior derecha para abrir el menú de cuenta y continuar.",
		targetSelector: "[data-onboarding-id='account-dropdown']",
		requiredAction: "dropdownOpened",
		requirementText: "Abre el menú de cuenta desde el avatar.",
		autoAdvance: true,
		allowOpenUi: ["dropdown-account"]
	},
	{
		id: "open-preferences",
		title: "Abre Preferencias",
		description:
			"En el menú de cuenta, selecciona la opción Preferencias para configurar tus datos personales.",
		targetSelector: "[data-onboarding-id='open-preferences-button']",
		requiredAction: "preferencesOpened",
		requirementText: "Haz clic en el botón Preferencias del menú.",
		autoAdvance: true,
		allowOpenUi: ["dropdown-account", "modal-preferences"]
	},
	{
		id: "open-email-edit",
		title: "Activa edición de correo",
		description:
			"Dentro de Preferencias, pulsa el icono de editar en Correo Electrónico para comenzar la configuración.",
		targetSelector: "[data-onboarding-id='preferences-email-edit-button']",
		requiredAction: "emailEditOpened",
		requirementText: "Haz clic en el botón editar correo.",
		autoAdvance: true,
		allowOpenUi: ["modal-preferences"]
	},
	{
		id: "type-email-preferences",
		title: "Edita tu correo",
		description:
			"Escribe un correo válido en el campo para preparar el cambio antes de guardarlo.",
		targetSelector: "[data-onboarding-id='preferences-email-input']",
		requiredAction: "emailTyped",
		requirementText: "Escribe un correo válido en el campo de correo.",
		autoAdvance: true,
		allowOpenUi: ["modal-preferences"]
	},
	{
		id: "edit-email-preferences",
		title: "Guarda tu correo",
		description:
			"Después de editar el correo, pulsa Guardar para confirmar el cambio y continuar con la guía.",
		targetSelector: "[data-onboarding-id='preferences-email-save-button']",
		requiredAction: "emailSaved",
		requirementText: "Haz clic en guardar correo.",
		autoAdvance: true,
		allowOpenUi: ["modal-preferences"]
	},
	{
		id: "notifications",
		title: "Revisa notificaciones",
		description:
			"Haz clic en la campana para revisar avisos pendientes y mantener tus tareas al día.",
		targetSelector: "[data-onboarding-id='notification-bell']",
		requiredAction: "notificationsOpened",
		requirementText: "Abre la campana de notificaciones.",
		autoAdvance: true,
		allowOpenUi: ["dropdown-notifications"]
	},
	{
		id: "notifications-dropdown",
		title: "Contenido de notificaciones",
		description:
			"Este desplegable te muestra avisos recientes; aquí puedes revisar pendientes y su detalle rápidamente.",
		targetSelector: "[data-onboarding-id='notification-dropdown']",
		allowOpenUi: ["dropdown-notifications"]
	},
	{
		id: "todo-overview",
		title: "¿Qué es tu To-Do List?",
		description:
			"La To-Do List es tu panel de seguimiento diario: sirve para crear tareas, marcar progreso, priorizar pendientes y no olvidar entregas importantes.",
		targetSelector: "[data-onboarding-id='todo']"
	},
	{
		id: "todo-add-reminder",
		title: "Crear recordatorio",
		description:
			"Empieza creando un recordatorio desde el botón de agregar tarea.",
		targetSelector: "[data-onboarding-id='todo-add-button']",
		requiredAction: "todoAddOpened",
		requirementText: "Haz clic en agregar tarea.",
		autoAdvance: true,
		allowOpenUi: ["modal-todo-add"]
	},
	{
		id: "todo-add-reminder-modal",
		title: "Modal de nuevo recordatorio",
		description:
			"En este modal defines nombre, fecha, hora, etiquetas y prioridad del recordatorio.",
		targetSelector: "[data-onboarding-id='todo-add-modal']",
		requiredAction: "todoAddSaved",
		requirementText: "Crea y guarda el recordatorio en el modal.",
		autoAdvance: true,
		allowOpenUi: ["modal-todo-add"],
		panelPosition: "top-right"
	},
	{
		id: "todo-filter",
		title: "Explora filtros de tareas",
		description:
			"Usa el botón de filtro del To-Do para encontrar tareas por estado, prioridad o etiqueta.",
		targetSelector: "[data-onboarding-id='todo-filter-button']",
		requiredAction: "todoFilterOpened",
		requirementText: "Haz clic en el botón de filtro del To-Do List.",
		autoAdvance: true,
		allowOpenUi: ["modal-todo-filter"]
	},
	{
		id: "todo-filter-modal",
		title: "Configura filtros en el modal",
		description:
			"Desde este modal filtras por estado, prioridad o etiqueta para enfocarte en las tareas más importantes.",
		targetSelector: "[data-onboarding-id='todo-filter-modal']",
		requiredAction: "todoFilterApplied",
		requirementText: "Haz clic en Aplicar dentro del modal de filtros.",
		autoAdvance: true,
		allowOpenUi: ["modal-todo-filter"],
		panelPosition: "top-right"
	},
	{
		id: "todo-card-edit",
		title: "Editar recordatorio",
		description:
			"Usa el botón de editar en una card para actualizar la información del recordatorio.",
		targetSelector: "[data-onboarding-id='todo-card-edit-button']",
		requiredAction: "todoCardEditClicked",
		requirementText: "Haz clic en editar de una card.",
		autoAdvance: true,
		allowOpenUi: ["modal-todo-edit"]
	},
	{
		id: "todo-edit-modal",
		title: "Modal de edición",
		description:
			"Aquí puedes ajustar nombre, fecha límite, prioridad y etiquetas del recordatorio.",
		targetSelector: "[data-onboarding-id='todo-edit-modal']",
		requiredAction: "todoEditSaved",
		requirementText: "Guarda los cambios en el recordatorio.",
		autoAdvance: true,
		allowOpenUi: ["modal-todo-edit"],
		panelPosition: "top-right"
	},
	{
		id: "todo-card-duplicate",
		title: "Duplicar recordatorio",
		description:
			"El botón duplicar te permite crear una copia rápida de una tarea existente.",
		targetSelector: "[data-onboarding-id='todo-card-duplicate-button']",
		requiredAction: "todoCardDuplicateClicked",
		requirementText: "Haz clic en duplicar de una card.",
		autoAdvance: true,
		allowOpenUi: ["modal-todo-duplicate"]
	},
	{
		id: "todo-duplicate-modal",
		title: "Modal de duplicado",
		description:
			"Este modal reutiliza los datos del recordatorio para crear uno nuevo más rápido.",
		targetSelector: "[data-onboarding-id='todo-duplicate-modal']",
		requiredAction: "todoDuplicateSaved",
		requirementText: "Guarda el recordatorio duplicado.",
		autoAdvance: true,
		allowOpenUi: ["modal-todo-duplicate"],
		panelPosition: "top-right"
	},
	{
		id: "todo-card-delete",
		title: "Eliminar recordatorio",
		description:
			"El botón eliminar abre una confirmación para evitar borrados accidentales.",
		targetSelector: "[data-onboarding-id='todo-card-delete-button']",
		requiredAction: "todoCardDeleteClicked",
		requirementText: "Haz clic en eliminar de una card.",
		autoAdvance: true,
		allowOpenUi: ["modal-todo-delete"]
	},
	{
		id: "todo-delete-modal",
		title: "Modal de confirmación",
		description:
			"Aquí confirmas si deseas eliminar el recordatorio de forma permanente.",
		targetSelector: "[data-onboarding-id='todo-delete-modal']",
		requiredAction: "todoDeleted",
		requirementText: "Confirma la eliminación del recordatorio.",
		autoAdvance: true,
		allowOpenUi: ["modal-todo-delete"],
		panelPosition: "top-right"
	},
	{
		id: "calendar-explore",
		title: "Explora el calendario",
		description:
			"Haz clic sobre el calendario para revisar clases y actividades del día o de la semana.",
		targetSelector: "[data-onboarding-id='calendar-grid']",
		requiredAction: "calendarClicked",
		requirementText: "Haz clic en cualquier zona del calendario.",
		autoAdvance: true
	},
	{
		id: "official-card-open",
		title: "Abre una card oficial",
		description:
			"Haz clic en una card de clase oficial para ver su detalle completo.",
		targetSelector: "[data-onboarding-id='official-class-card']",
		requiredAction: "officialCardOpened",
		requirementText: "Haz clic en una card oficial del calendario.",
		autoAdvance: true,
		allowOpenUi: ["modal-official-card"]
	},
	{
		id: "official-card-modal",
		title: "Modal de detalle oficial",
		description:
			"Este modal muestra información de la asignatura: docente, NRC, créditos, campus y horario programado.",
		targetSelector: "[data-onboarding-id='official-card-modal']",
		allowOpenUi: ["modal-official-card"],
		panelPosition: "top-right"
	},
	{
		id: "official-comments-button",
		title: "Botón de comentarios",
		description:
			"Usa Agregar Comentario para registrar observaciones o notas rápidas de la clase.",
		targetSelector: "[data-onboarding-id='official-comment-button']",
		requiredAction: "officialCommentOpened",
		requirementText: "Haz clic en Agregar Comentario.",
		autoAdvance: true,
		allowOpenUi: ["modal-official-card", "dropdown-official-comment"],
		panelPosition: "top-right"
	},
	{
		id: "official-comments-modal",
		title: "Modal de comentario",
		description:
			"Aquí puedes escribir y guardar comentarios para documentar seguimiento de la materia.",
		targetSelector: "[data-onboarding-id='official-comment-modal']",
		requiredAction: "officialCommentSaved",
		requirementText: "Guarda el comentario en la materia.",
		autoAdvance: true,
		allowOpenUi: ["modal-official-card", "dropdown-official-comment"],
		panelPosition: "top-right"
	},
	{
		id: "change-view",
		title: "Cambia la vista",
		description:
			"Alterna entre vista Semanal y Diario para analizar tu horario con distinto nivel de detalle.",
		targetSelector: "[data-onboarding-id='view-toggle']",
		requiredAction: "viewChanged",
		requirementText: "Haz clic en Semanal o Diario para cambiar la vista.",
		autoAdvance: true
	},
	{
		id: "academic-period-button",
		title: "Períodos académicos",
		description:
			"Abre el selector de períodos para filtrar el horario por semestre o período disponible.",
		targetSelector: "[data-onboarding-id='academic-period-button']",
		requiredAction: "academicPeriodOpened",
		requirementText: "Haz clic en el botón de períodos académicos.",
		autoAdvance: true,
		allowOpenUi: ["dropdown-academic-period"],
		panelPosition: "top-right"
	},
	{
		id: "academic-period-dropdown",
		title: "Dropdown de períodos",
		description:
			"Selecciona un período para ver solo clases y actividades del rango académico elegido.",
		targetSelector: "[data-onboarding-id='academic-period-menu']",
		requiredAction: "academicPeriodSelected",
		requirementText: "Selecciona un período en el dropdown.",
		autoAdvance: true,
		allowOpenUi: ["dropdown-academic-period"],
		panelPosition: "top-right"
	},
	{
		id: "add-activity",
		title: "Agrega actividad personal",
		description:
			"Pulsa Agregar actividad para crear eventos personales y mezclarlos con tus clases.",
		targetSelector: "[data-onboarding-id='add-activity-button']",
		requiredAction: "addActivityOpened",
		requirementText: "Haz clic en Agregar actividad.",
		autoAdvance: true,
		panelPosition: "top-right",
		allowOpenUi: ["modal-add-activity"]
	},
	{
		id: "add-activity-modal",
		title: "Completa datos de la actividad",
		description:
			"En este modal defines título, horario y rango de fechas para registrar actividades personales.",
		targetSelector: "[data-onboarding-id='add-activity-modal']",
		requiredAction: "addActivityTitleTyped",
		requirementText: "Escribe un título en el modal de actividad.",
		autoAdvance: true,
		panelPosition: "top-right",
		allowOpenUi: ["modal-add-activity"]
	},
	{
		id: "calendar-filter",
		title: "Filtra actividades",
		description:
			"Usa el filtro de la barra de control para enfocar solo etiquetas o categorías específicas.",
		targetSelector: "[data-onboarding-id='calendar-filter-button']",
		requiredAction: "calendarFilterOpened",
		requirementText: "Haz clic en el botón Filtrar de la barra de control.",
		autoAdvance: true,
		panelPosition: "top-right",
		allowOpenUi: ["dropdown-calendar-filter"]
	},
	{
		id: "calendar-filter-dropdown",
		title: "Opciones de filtrado",
		description:
			"En este desplegable eliges categoría para enfocar el calendario por tipo de actividad.",
		targetSelector: "[data-onboarding-id='calendar-filter-menu']",
		requiredAction: "calendarFilterOptionSelected",
		requirementText: "Selecciona una opción dentro del filtro de actividades.",
		autoAdvance: true,
		panelPosition: "top-right",
		allowOpenUi: ["dropdown-calendar-filter"]
	},
	{
		id: "theme-selector",
		title: "Abre el selector de temas",
		description:
			"Usa el botón de paleta para personalizar colores y mejorar tu lectura del horario.",
		targetSelector: "[data-onboarding-id='theme-selector-button']",
		requiredAction: "themeSelectorOpened",
		requirementText: "Haz clic en el botón de temas.",
		autoAdvance: true,
		allowOpenUi: ["modal-theme-selector"],
		panelPosition: "top-right"
	},
	{
		id: "theme-modal",
		title: "Selecciona un tema",
		description:
			"Dentro del modal de temas elige una paleta para cambiar el estilo visual de tus etiquetas.",
		targetSelector: "[data-onboarding-id='theme-selector-modal']",
		requiredAction: "themeSelected",
		requirementText: "Selecciona un tema en el modal.",
		autoAdvance: true,
		allowOpenUi: ["modal-theme-selector"],
		panelPosition: "top-right"
	},
	{
		id: "finish-tour",
		title: "Resumen rápido",
		description:
			"Ya exploraste las funciones principales: cuenta y preferencias, tareas, calendario, cambio de vista, agregar actividad y filtros.",
		targetSelector: "[data-onboarding-id='controlbar']"
	}
];

const OnboardingContext = createContext(null);

const getStorageKey = (userId) => `${ONBOARDING_STORAGE_PREFIX}${String(userId || "").trim()}`;

const readOnboardingState = (userId) => {
	if (!userId) return null;

	try {
		const rawValue = localStorage.getItem(getStorageKey(userId));
		if (!rawValue) return null;

		const parsed = JSON.parse(rawValue);
		if (!parsed || typeof parsed !== "object") return null;

		return parsed;
	} catch {
		return null;
	}
};

const writeOnboardingState = (userId, value) => {
	if (!userId) return;
	localStorage.setItem(getStorageKey(userId), JSON.stringify(value));
};

const clearOnboardingState = (userId) => {
	if (!userId) return;
	localStorage.removeItem(getStorageKey(userId));
};

const getInitialCompletedActions = () => ({
	dropdownOpened: false,
	preferencesOpened: false,
	emailEditOpened: false,
	emailTyped: false,
	emailSaved: false,
	notificationsOpened: false,
	todoAddOpened: false,
	todoAddSaved: false,
	todoEditSaved: false,
	todoDuplicateSaved: false,
	todoDeleted: false,
	todoFilterOpened: false,
	todoFilterApplied: false,
	todoCardEditClicked: false,
	todoCardDuplicateClicked: false,
	todoCardDeleteClicked: false,
	calendarClicked: false,
	viewChanged: false,
	academicPeriodOpened: false,
	academicPeriodSelected: false,
	themeSelectorOpened: false,
	themeSelected: false,
	addActivityOpened: false,
	addActivityTitleTyped: false,
	calendarFilterOpened: false,
	calendarFilterOptionSelected: false,
	officialCardOpened: false,
	officialCommentOpened: false,
	officialCommentSaved: false
});

export function OnboardingProvider({ children, userId }) {
	const [isLoading, setIsLoading] = useState(true);
	const [isOpen, setIsOpen] = useState(false);
	const [currentStep, setCurrentStep] = useState(0);
	const [completedActions, setCompletedActions] = useState(getInitialCompletedActions);
	const [validationMessage, setValidationMessage] = useState("");
	const preventAutoAdvanceOnceRef = useRef(false);

	const steps = ONBOARDING_STEPS;
	const totalSteps = steps.length;

	useEffect(() => {
		let isDisposed = false;

		const initializeOnboarding = async () => {
		const trimmedUserId = String(userId || "").trim();
		if (!trimmedUserId) {
			setIsOpen(false);
			setCurrentStep(0);
			setIsLoading(false);
			return;
		}

		setIsLoading(true);

		const savedState = readOnboardingState(trimmedUserId);
		let isCompleted = savedState?.completed === true && savedState?.version === ONBOARDING_VERSION;
		const remoteStatus = await getOnboardingCompletionStatus(trimmedUserId);
		const remoteCompleted = remoteStatus === true || Number(remoteStatus) === 1;
		const hasRemoteStatus = remoteStatus !== null && remoteStatus !== undefined;
		if (hasRemoteStatus) {
			isCompleted = remoteCompleted;
			if (remoteCompleted) {
				writeOnboardingState(trimmedUserId, {
					completed: true,
					version: ONBOARDING_VERSION,
					completedAt: Date.now()
				});
			}
		}

		if (isDisposed) return;

		setCurrentStep(0);
		setCompletedActions(getInitialCompletedActions());
		setValidationMessage("");
		setIsOpen(!isCompleted);
		setIsLoading(false);
		};

		void initializeOnboarding();

		return () => {
			isDisposed = true;
		};
	}, [userId]);

	useEffect(() => {
		const handleDropdownOpened = () => {
			setCompletedActions((prev) => ({ ...prev, dropdownOpened: true }));
			setValidationMessage("");
		};

		const handleEmailSaved = () => {
			setCompletedActions((prev) => ({ ...prev, emailSaved: true }));
			setValidationMessage("");
		};

		const handleEmailTyped = () => {
			setCompletedActions((prev) => ({ ...prev, emailTyped: true }));
			setValidationMessage("");
		};

		const handleEmailEditOpened = () => {
			setCompletedActions((prev) => ({ ...prev, emailEditOpened: true }));
			setValidationMessage("");
		};

		const handleNotificationsOpened = () => {
			setCompletedActions((prev) => ({ ...prev, notificationsOpened: true }));
			setValidationMessage("");
		};

		const handleTodoAddOpened = () => {
			setCompletedActions((prev) => ({ ...prev, todoAddOpened: true }));
			setValidationMessage("");
		};

		const handleTodoAddSaved = () => {
			setCompletedActions((prev) => ({ ...prev, todoAddSaved: true }));
			setValidationMessage("");
		};

		const handleTodoEditSaved = () => {
			setCompletedActions((prev) => ({ ...prev, todoEditSaved: true }));
			setValidationMessage("");
		};

		const handleTodoDuplicateSaved = () => {
			setCompletedActions((prev) => ({ ...prev, todoDuplicateSaved: true }));
			setValidationMessage("");
		};

		const handleTodoDeleted = () => {
			setCompletedActions((prev) => ({ ...prev, todoDeleted: true }));
			setValidationMessage("");
		};

		const handlePreferencesOpened = () => {
			setCompletedActions((prev) => ({ ...prev, preferencesOpened: true }));
			setValidationMessage("");
		};

		const handleTodoFilterOpened = () => {
			setCompletedActions((prev) => ({ ...prev, todoFilterOpened: true }));
			setValidationMessage("");
		};

		const handleTodoFilterApplied = () => {
			setCompletedActions((prev) => ({ ...prev, todoFilterApplied: true }));
			setValidationMessage("");
		};

		const handleTodoCardEditClicked = () => {
			setCompletedActions((prev) => ({ ...prev, todoCardEditClicked: true }));
			setValidationMessage("");
		};

		const handleTodoCardDuplicateClicked = () => {
			setCompletedActions((prev) => ({ ...prev, todoCardDuplicateClicked: true }));
			setValidationMessage("");
		};

		const handleTodoCardDeleteClicked = () => {
			setCompletedActions((prev) => ({ ...prev, todoCardDeleteClicked: true }));
			setValidationMessage("");
		};

		const handleCalendarClicked = () => {
			setCompletedActions((prev) => ({ ...prev, calendarClicked: true }));
			setValidationMessage("");
		};

		const handleViewChanged = () => {
			setCompletedActions((prev) => ({ ...prev, viewChanged: true }));
			setValidationMessage("");
		};

		const handleAcademicPeriodOpened = () => {
			setCompletedActions((prev) => ({ ...prev, academicPeriodOpened: true }));
			setValidationMessage("");
		};

		const handleAcademicPeriodSelected = () => {
			setCompletedActions((prev) => ({ ...prev, academicPeriodSelected: true }));
			setValidationMessage("");
		};

		const handleThemeSelectorOpened = () => {
			setCompletedActions((prev) => ({ ...prev, themeSelectorOpened: true }));
			setValidationMessage("");
		};

		const handleThemeSelected = () => {
			setCompletedActions((prev) => ({ ...prev, themeSelected: true }));
			setValidationMessage("");
		};

		const handleAddActivityOpened = () => {
			setCompletedActions((prev) => ({ ...prev, addActivityOpened: true }));
			setValidationMessage("");
		};

		const handleAddActivityTitleTyped = () => {
			setCompletedActions((prev) => ({ ...prev, addActivityTitleTyped: true }));
			setValidationMessage("");
		};

		const handleCalendarFilterOpened = () => {
			setCompletedActions((prev) => ({ ...prev, calendarFilterOpened: true }));
			setValidationMessage("");
		};

		const handleCalendarFilterOptionSelected = () => {
			setCompletedActions((prev) => ({ ...prev, calendarFilterOptionSelected: true }));
			setValidationMessage("");
		};

		const handleOfficialCardOpened = () => {
			setCompletedActions((prev) => ({ ...prev, officialCardOpened: true }));
			setValidationMessage("");
		};

		const handleOfficialCommentOpened = () => {
			setCompletedActions((prev) => ({ ...prev, officialCommentOpened: true }));
			setValidationMessage("");
		};

		const handleOfficialCommentSaved = () => {
			setCompletedActions((prev) => ({ ...prev, officialCommentSaved: true }));
			setValidationMessage("");
		};

		window.addEventListener("onboarding:account-dropdown-opened", handleDropdownOpened);
		window.addEventListener("onboarding:preferences-email-typed", handleEmailTyped);
		window.addEventListener("onboarding:preferences-email-saved", handleEmailSaved);
		window.addEventListener("onboarding:preferences-email-edit-opened", handleEmailEditOpened);
		window.addEventListener("onboarding:preferences-opened", handlePreferencesOpened);
		window.addEventListener("onboarding:notifications-opened", handleNotificationsOpened);
		window.addEventListener("onboarding:todo-add-opened", handleTodoAddOpened);
		window.addEventListener("onboarding:todo-add-saved", handleTodoAddSaved);
		window.addEventListener("onboarding:todo-edit-saved", handleTodoEditSaved);
		window.addEventListener("onboarding:todo-duplicate-saved", handleTodoDuplicateSaved);
		window.addEventListener("onboarding:todo-deleted", handleTodoDeleted);
		window.addEventListener("onboarding:todo-filter-opened", handleTodoFilterOpened);
		window.addEventListener("onboarding:todo-filter-applied", handleTodoFilterApplied);
		window.addEventListener("onboarding:todo-card-edit-clicked", handleTodoCardEditClicked);
		window.addEventListener("onboarding:todo-card-duplicate-clicked", handleTodoCardDuplicateClicked);
		window.addEventListener("onboarding:todo-card-delete-clicked", handleTodoCardDeleteClicked);
		window.addEventListener("onboarding:calendar-clicked", handleCalendarClicked);
		window.addEventListener("onboarding:view-changed", handleViewChanged);
		window.addEventListener("onboarding:academic-period-opened", handleAcademicPeriodOpened);
		window.addEventListener("onboarding:academic-period-selected", handleAcademicPeriodSelected);
		window.addEventListener("onboarding:theme-selector-opened", handleThemeSelectorOpened);
		window.addEventListener("onboarding:theme-selected", handleThemeSelected);
		window.addEventListener("onboarding:add-activity-opened", handleAddActivityOpened);
		window.addEventListener("onboarding:add-activity-title-typed", handleAddActivityTitleTyped);
		window.addEventListener("onboarding:calendar-filter-opened", handleCalendarFilterOpened);
		window.addEventListener("onboarding:calendar-filter-option-selected", handleCalendarFilterOptionSelected);
		window.addEventListener("onboarding:official-card-opened", handleOfficialCardOpened);
		window.addEventListener("onboarding:official-comment-opened", handleOfficialCommentOpened);
		window.addEventListener("onboarding:official-comment-saved", handleOfficialCommentSaved);

		return () => {
			window.removeEventListener("onboarding:account-dropdown-opened", handleDropdownOpened);
			window.removeEventListener("onboarding:preferences-email-typed", handleEmailTyped);
			window.removeEventListener("onboarding:preferences-email-saved", handleEmailSaved);
			window.removeEventListener("onboarding:preferences-email-edit-opened", handleEmailEditOpened);
			window.removeEventListener("onboarding:preferences-opened", handlePreferencesOpened);
			window.removeEventListener("onboarding:notifications-opened", handleNotificationsOpened);
			window.removeEventListener("onboarding:todo-add-opened", handleTodoAddOpened);
			window.removeEventListener("onboarding:todo-add-saved", handleTodoAddSaved);
			window.removeEventListener("onboarding:todo-edit-saved", handleTodoEditSaved);
			window.removeEventListener("onboarding:todo-duplicate-saved", handleTodoDuplicateSaved);
			window.removeEventListener("onboarding:todo-deleted", handleTodoDeleted);
			window.removeEventListener("onboarding:todo-filter-opened", handleTodoFilterOpened);
			window.removeEventListener("onboarding:todo-filter-applied", handleTodoFilterApplied);
			window.removeEventListener("onboarding:todo-card-edit-clicked", handleTodoCardEditClicked);
			window.removeEventListener("onboarding:todo-card-duplicate-clicked", handleTodoCardDuplicateClicked);
			window.removeEventListener("onboarding:todo-card-delete-clicked", handleTodoCardDeleteClicked);
			window.removeEventListener("onboarding:calendar-clicked", handleCalendarClicked);
			window.removeEventListener("onboarding:view-changed", handleViewChanged);
			window.removeEventListener("onboarding:academic-period-opened", handleAcademicPeriodOpened);
			window.removeEventListener("onboarding:academic-period-selected", handleAcademicPeriodSelected);
			window.removeEventListener("onboarding:theme-selector-opened", handleThemeSelectorOpened);
			window.removeEventListener("onboarding:theme-selected", handleThemeSelected);
			window.removeEventListener("onboarding:add-activity-opened", handleAddActivityOpened);
			window.removeEventListener("onboarding:add-activity-title-typed", handleAddActivityTitleTyped);
			window.removeEventListener("onboarding:calendar-filter-opened", handleCalendarFilterOpened);
			window.removeEventListener("onboarding:calendar-filter-option-selected", handleCalendarFilterOptionSelected);
			window.removeEventListener("onboarding:official-card-opened", handleOfficialCardOpened);
			window.removeEventListener("onboarding:official-comment-opened", handleOfficialCommentOpened);
			window.removeEventListener("onboarding:official-comment-saved", handleOfficialCommentSaved);
		};
	}, []);

	const currentStepData = steps[currentStep] ?? null;
	const allowOpenUi = currentStepData?.allowOpenUi ?? [];
	const requiredAction = currentStepData?.requiredAction;
	const canContinue = !requiredAction || Boolean(completedActions[requiredAction]);

	useEffect(() => {
		if (!isOpen) return;

		window.dispatchEvent(
			new CustomEvent("onboarding:close-unrelated-ui", {
				detail: { allowOpenUi }
			})
		);
	}, [isOpen, currentStep, allowOpenUi]);

	const complete = useCallback(() => {
		const trimmedUserId = String(userId || "").trim();
		if (!trimmedUserId) {
			setIsOpen(false);
			return;
		}

		writeOnboardingState(trimmedUserId, {
			completed: true,
			version: ONBOARDING_VERSION,
			completedAt: Date.now()
		});
		setIsOpen(false);

		void (async () => {
			await saveOnboardingCompletion(trimmedUserId);
			const refreshedRemoteStatus = await getOnboardingCompletionStatus(trimmedUserId);
			const hasRemoteStatus = refreshedRemoteStatus !== null && refreshedRemoteStatus !== undefined;

			if (!hasRemoteStatus) {
				return;
			}

			const refreshedRemoteCompleted =
				refreshedRemoteStatus === true || Number(refreshedRemoteStatus) === 1;

			if (refreshedRemoteCompleted) {
				writeOnboardingState(trimmedUserId, {
					completed: true,
					version: ONBOARDING_VERSION,
					completedAt: Date.now()
				});
				setIsOpen(false);
				return;
			}

			clearOnboardingState(trimmedUserId);
			setCurrentStep(0);
			setCompletedActions(getInitialCompletedActions());
			setValidationMessage("");
			setIsOpen(true);
		})();
	}, [userId]);

	const nextStep = useCallback(() => {
		preventAutoAdvanceOnceRef.current = false;

		if (!canContinue) {
			setValidationMessage(currentStepData?.requirementText || "Completa la acción indicada para continuar.");
			return;
		}

		setValidationMessage("");
		setCurrentStep((prev) => {
			if (prev >= totalSteps - 1) {
				complete();
				return prev;
			}
			return prev + 1;
		});
	}, [canContinue, complete, currentStepData, totalSteps]);

	useEffect(() => {
		if (!isOpen || !currentStepData?.autoAdvance || !requiredAction || !canContinue) {
			return;
		}

		if (preventAutoAdvanceOnceRef.current) {
			preventAutoAdvanceOnceRef.current = false;
			return;
		}

		const timerId = setTimeout(() => {
			setValidationMessage("");
			setCurrentStep((prev) => {
				if (prev >= totalSteps - 1) {
					complete();
					return prev;
				}
				return prev + 1;
			});
		}, 450);

		return () => clearTimeout(timerId);
	}, [isOpen, currentStepData, requiredAction, canContinue, totalSteps, complete]);

	const prevStep = useCallback(() => {
		setValidationMessage("");
		preventAutoAdvanceOnceRef.current = true;
		setCurrentStep((prev) => Math.max(0, prev - 1));
	}, []);

	const skip = useCallback(() => {
		complete();
	}, [complete]);

	const reset = useCallback(() => {
		const trimmedUserId = String(userId || "").trim();
		setValidationMessage("");
		setCurrentStep(0);
		setCompletedActions(getInitialCompletedActions());

		if (!trimmedUserId) {
			setIsOpen(true);
			return;
		}

		clearOnboardingState(trimmedUserId);
		setIsOpen(true);
		void resetOnboardingCompletion(trimmedUserId);
	}, [userId]);

	const value = useMemo(
		() => ({
			isLoading,
			isOpen,
			steps,
			totalSteps,
			currentStep,
			canContinue,
			validationMessage,
			nextStep,
			prevStep,
			skip,
			complete,
			reset
		}),
		[
			isLoading,
			isOpen,
			steps,
			totalSteps,
			currentStep,
			canContinue,
			validationMessage,
			nextStep,
			prevStep,
			skip,
			complete,
			reset
		]
	);

	return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboardingContext() {
	const context = useContext(OnboardingContext);
	if (!context) {
		throw new Error("useOnboardingContext debe usarse dentro de OnboardingProvider");
	}
	return context;
}
