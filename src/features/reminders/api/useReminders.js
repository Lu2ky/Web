/**
 * Hooks de lectura de recordatorios.
 *
 * Las mutaciones (alta, edición, borrado) siguen en `reminderService`, que
 * traduce el contrato de Go. Aquí solo se cachean las listas.
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys, queryOptions } from '../../../shared/api/apiClient';

export function useReminders(userId) {
  return useQuery({
    ...queryOptions.list(
      queryKeys.reminders.list(userId),
      `/reminders/users/${userId}`,
      Boolean(userId)
    ),
  });
}

export function useReminderTags(userId) {
  return useQuery({
    ...queryOptions.list(
      queryKeys.reminders.tags(userId),
      `/reminders/users/${userId}/tags`,
      Boolean(userId)
    ),
  });
}
