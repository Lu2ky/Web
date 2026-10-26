// ============================================================================
// Servicio de Onboarding
// ============================================================================
// Contrato real de `apps/api-go` (rutas públicas):
//   POST /onboarding      { userId, status }  -> { status, message }
//   POST /onboarding/get  { userId }          -> { userId, status } | 401
// `Onboarding.userId` es string en el backend.
// ============================================================================

import { apiClient } from "../../../shared/api/apiClient";
import { getSessionNumericUserId } from "../../../shared/session/authSession";
import { getUserData } from "../../../shared/api/userService";

/**
 * Resuelve el identificador que usa Redis para el onboarding. El backend
 * guarda `onboarding:<userId>`, así que se prioriza el id numérico de la
 * sesión y, si no existe, se consulta `GET /users/:id`.
 */
const resolveBackendUserId = async (rawUserId) => {
	const safeUserId = String(rawUserId || "").trim();
	if (!safeUserId) return "";

	const numeric = Number(safeUserId);
	if (Number.isInteger(numeric) && numeric > 0) return String(numeric);

	const fromSession = Number(getSessionNumericUserId());
	if (Number.isInteger(fromSession) && fromSession > 0) return String(fromSession);

	try {
		const userData = await getUserData(safeUserId);
		const user = Array.isArray(userData) ? userData[0] : userData;
		const resolvedId = user?.idUsuario ?? user?.id ?? user?.N_idUsuario;
		if (resolvedId !== undefined && resolvedId !== null && String(resolvedId).trim() !== "") {
			return String(resolvedId).trim();
		}
	} catch {
		// Si no se puede resolver, se usa el valor recibido.
	}

	return safeUserId;
};

export async function getOnboardingCompletionStatus(userId) {
	const backendUserId = await resolveBackendUserId(userId);
	if (!backendUserId) return null;

	try {
		const body = await apiClient.post("/onboarding/get", { userId: backendUserId });
		return body?.status ?? null;
	} catch (error) {
		// 401 = el usuario todavía no completó el onboarding (clave ausente en Redis).
		if (error?.status !== 401) {
			console.warn("No se pudo consultar el onboarding:", error?.message || error);
		}
		return null;
	}
}

export async function saveOnboardingStatus(userId, status) {
	const backendUserId = await resolveBackendUserId(userId);
	if (!backendUserId) {
		return { success: false, message: "userId es requerido" };
	}

	const normalizedStatus = Number(status) === 1 || status === true ? "1" : "0";

	try {
		const body = await apiClient.post("/onboarding", {
			userId: backendUserId,
			status: normalizedStatus,
		});

		return {
			success: true,
			message: body?.message || "Onboarding actualizado correctamente",
			status: body?.status ?? normalizedStatus,
		};
	} catch (error) {
		return {
			success: false,
			message: error?.message || "Error inesperado al guardar el onboarding",
		};
	}
}

export async function saveOnboardingCompletion(userId) {
	return saveOnboardingStatus(userId, true);
}

export async function resetOnboardingCompletion(userId) {
	return saveOnboardingStatus(userId, false);
}
