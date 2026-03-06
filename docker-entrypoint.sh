#!/bin/sh
# ===========================================================
# docker-entrypoint.sh
# Genera /app/dist/env-config.js en runtime a partir de las
# variables de entorno inyectadas por docker-compose env_file.
#
# Solo necesita API_ADDR y API_PORT; construye todas las URLs.
# ===========================================================

set -e

API_URL="http://${API_ADDR:-localhost}:${API_PORT:-28523}"

cat > /app/dist/env-config.js <<EOF
// Auto-generated at container startup – DO NOT EDIT
window.__ENV__ = {
  // Autenticación
  VITE_API_URL_LDAP:                    "${API_URL}/api/auth/validate-user",
  VITE_API_CREATE_USER:                 "${API_URL}/api/auth/create-user",

  // Calendario – Horarios oficiales
  VITE_API_URL_OFICIAL_SCHEDULE:        "${API_URL}/api/official-schedule/",
  VITE_API_URL_COURSE_TYPES:            "${API_URL}/api/course-types/",

  // Calendario – Horarios personales
  VITE_API_URL_PERSONAL_SCHEDULE:       "${API_URL}/api/personal-schedule/",
  VITE_API_ADD_PERSONAL_ACTIVITY:       "${API_URL}/api/add-personal-activity/",
  VITE_API_UPDATE_PERSONAL_ACTIVITY:    "${API_URL}/api/update-personal-activity/",
  VITE_API_DELETE_PERSONAL_ACTIVITY:    "${API_URL}/api/remove-personal-activity/",

  // Comentarios
  VITE_API_URL_COMMENTS:                "${API_URL}/api/get-personal-comments/",
  VITE_API_ADD_COMMENT:                 "${API_URL}/api/add-comment/",
  VITE_API_UPDATE_COMMENT:              "${API_URL}/api/update-comment/",
  VITE_API_DELETE_COMMENT:              "${API_URL}/api/remove-comment/",

  // Etiquetas (Tags)
  VITE_API_URL_TAGS_USER:               "${API_URL}/api/tags-by-user/",
  VITE_API_URL_TAGS_REMINDER:           "${API_URL}/api/tags-by-user-and-reminder/",
  VITE_API_DELETE_TAGS_REMINDER:        "${API_URL}/api/delete-tags/",

  // Recordatorios
  VITE_API_URL_REMINDERS_USER:          "${API_URL}/api/reminders-by-user/",
  VITE_API_ADD_REMINDER:                "${API_URL}/api/add-reminder/",
  VITE_API_DELETE_REMINDER:             "${API_URL}/api/remove-reminder/",
  VITE_API_UPDATE_REMINDER:             "${API_URL}/api/update-name-reminder/",
  VITE_API_UPDATE_DESCRIPTION_REMINDER: "${API_URL}/api/update-desc-reminder/",
  VITE_API_UPDATE_DATE_REMINDER:        "${API_URL}/api/update-date-reminder/",
  VITE_API_UPDATE_PRIORITY_REMINDER:    "${API_URL}/api/update-priority-reminder/",
  VITE_API_UPDATE_STATE_REMINDER:       "${API_URL}/api/update-state-reminder/",
  VITE_API_UPDATE_TAGS_REMINDER:        "${API_URL}/api/update-tags-reminder/",

  // Notificaciones
  VITE_API_URL_NOTIFICATIONS:           "${API_URL}/api/notifications/",
  VITE_API_ADD_NOTIFICATION:            "${API_URL}/api/add-notification/",
  VITE_API_ADD_EMAIL:                   "${API_URL}/api/add-email/",

  // Usuario
  VITE_API_GET_USER_DATA:               "${API_URL}/api/user/data/"
};
EOF

echo "✅ env-config.js generated  →  API_ADDR=${API_ADDR:-localhost}  API_PORT=${API_PORT:-28523}"

# Hand off to the actual server process
exec "$@"
