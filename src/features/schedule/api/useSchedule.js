/**
 * Hooks de datos del horario (TanStack Query).
 *
 * Solo se exponen los hooks que la UI usa hoy. Las mutaciones de recordatorios
 * y notificaciones viven en el servicio plano correspondiente.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, queryKeys, queryOptions } from '../../../shared/api/apiClient';
import {
  mapOfficialScheduleList,
  mapPersonalScheduleList,
} from './scheduleMappers';

export function useOfficialSchedule(userId, academicPeriodId) {
  return useQuery({
    ...queryOptions.list(
      queryKeys.schedules.official(userId, academicPeriodId),
      `/schedules/official/users/${userId}`,
      Boolean(userId)
    ),
    // `api-go` devuelve el modelo de BD; la UI consume el modelo del calendario.
    select: mapOfficialScheduleList,
  });
}

export function usePersonalSchedule(userId, academicPeriodId) {
  return useQuery({
    ...queryOptions.list(
      queryKeys.schedules.personal(userId, academicPeriodId),
      `/schedules/personal/users/${userId}`,
      Boolean(userId)
    ),
    select: mapPersonalScheduleList,
  });
}

function useInvalidatePersonalSchedule() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['schedules', 'personal'] });
}

export function useAddPersonalActivity() {
  const invalidate = useInvalidatePersonalSchedule();
  return useMutation({
    mutationFn: (payload) => apiClient.post('/schedules/personal', payload),
    onSuccess: invalidate,
  });
}

export function useUpdatePersonalActivity() {
  const invalidate = useInvalidatePersonalSchedule();
  return useMutation({
    mutationFn: (payload) => apiClient.post('/schedules/personal/update', payload),
    onSuccess: invalidate,
  });
}

export function useDeletePersonalActivity() {
  const invalidate = useInvalidatePersonalSchedule();
  return useMutation({
    mutationFn: (payload) => apiClient.post('/schedules/personal/delete-or-recover', payload),
    onSuccess: invalidate,
  });
}
