/** Pasos y estado inicial del onboarding. */

export const ONBOARDING_STEPS = [
	{
		id: "open-account-dropdown",
		title: "Abre tu cuenta",
		description:
			"Haz clic en el avatar de la esquina superior derecha para abrir el menú de cuenta y continuar.",
		targetSelector: "[data-onboarding-id='avatar-button']",
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
		id: "open-password-change",
		title: "Abre tu perfil",
		description:
			"Haz clic en el avatar y luego selecciona Mi Perfil para actualizar tu contraseña y asegurar tu cuenta.",
		targetSelector: "[data-onboarding-id='avatar-button']",
		requiredAction: "profileOpened",
		requirementText: "Abre el dropdown de cuenta y haz clic en Mi Perfil.",
		autoAdvance: true,
		allowOpenUi: ["dropdown-account", "modal-account"]
	},
	{
		id: "change-password-modal",
		title: "Cambia tu contraseña",
		description:
			"En este modal puedes actualizar tu contraseña. Ingresa tu contraseña actual, luego la nueva contraseña con los requisitos indicados.",
		targetSelector: "[data-onboarding-id='password-change-section']",
		requiredAction: "passwordChanged",
		requirementText: "Cambia tu contraseña completando el formulario.",
		autoAdvance: true,
		allowOpenUi: ["modal-account"]
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
		targetSelector: "[data-onboarding-id='todo']",
		panelPosition: "top"
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
		allowOpenUi: ["modal-todo-add"],
		panelPosition: "top"
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
		allowOpenUi: ["modal-todo-filter"],
		panelPosition: "top"
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
		allowOpenUi: ["modal-todo-edit"],
		panelPosition: "top"
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
		allowOpenUi: ["modal-todo-duplicate"],
		panelPosition: "top"
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
		allowOpenUi: ["modal-todo-delete"],
		panelPosition: "top"
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
		autoAdvance: true,
		panelPosition: "top-right"
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
		requiredAction: "addActivitySaved",
		requirementText: "Guarda la actividad haciendo clic en el botón Guardar.",
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

/** Acciones que el usuario debe completar durante el recorrido. */
export const getInitialCompletedActions = () => ({
	dropdownOpened: false,
	preferencesOpened: false,
	emailEditOpened: false,
	emailTyped: false,
	emailSaved: false,
	profileOpened: false,
	passwordChanged: false,
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
