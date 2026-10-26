/**
 * Eventos globales que marcan acciones completadas del onboarding.
 *
 * Las features no conocen el contexto: emiten `window` events con estos
 * nombres y el provider los traduce a flags de progreso.
 */

export const ONBOARDING_EVENT_ACTIONS = {
  "onboarding:account-dropdown-opened": "dropdownOpened",
  "onboarding:preferences-email-typed": "emailTyped",
  "onboarding:preferences-email-saved": "emailSaved",
  "onboarding:preferences-email-edit-opened": "emailEditOpened",
  "onboarding:preferences-opened": "preferencesOpened",
  "onboarding:profile-opened": "profileOpened",
  "onboarding:password-changed": "passwordChanged",
  "onboarding:notifications-opened": "notificationsOpened",
  "onboarding:todo-add-opened": "todoAddOpened",
  "onboarding:todo-add-saved": "todoAddSaved",
  "onboarding:todo-edit-saved": "todoEditSaved",
  "onboarding:todo-duplicate-saved": "todoDuplicateSaved",
  "onboarding:todo-deleted": "todoDeleted",
  "onboarding:todo-filter-opened": "todoFilterOpened",
  "onboarding:todo-filter-applied": "todoFilterApplied",
  "onboarding:todo-card-edit-clicked": "todoCardEditClicked",
  "onboarding:todo-card-duplicate-clicked": "todoCardDuplicateClicked",
  "onboarding:todo-card-delete-clicked": "todoCardDeleteClicked",
  "onboarding:calendar-clicked": "calendarClicked",
  "onboarding:view-changed": "viewChanged",
  "onboarding:academic-period-opened": "academicPeriodOpened",
  "onboarding:academic-period-selected": "academicPeriodSelected",
  "onboarding:theme-selector-opened": "themeSelectorOpened",
  "onboarding:theme-selected": "themeSelected",
  "onboarding:add-activity-opened": "addActivityOpened",
  "onboarding:add-activity-saved": "addActivitySaved",
  "onboarding:calendar-filter-opened": "calendarFilterOpened",
  "onboarding:calendar-filter-option-selected": "calendarFilterOptionSelected",
  "onboarding:official-card-opened": "officialCardOpened",
  "onboarding:official-comment-opened": "officialCommentOpened",
  "onboarding:official-comment-saved": "officialCommentSaved",
};

export default ONBOARDING_EVENT_ACTIONS;
