import { getUserData } from "./userService";

const COMPLETE_ONBOARDING_ENDPOINT = import.meta.env.VITE_API_COMPLETE_ONBOARDING;
const ONBOARDING_STATUS_ENDPOINT = import.meta.env.VITE_API_ONBOARDING_STATUS;

const resolveBackendUserId = async (rawUserId) => {
	const safeUserId = String(rawUserId || "").trim();
	if (!safeUserId) return "";

	try {
		const userData = await getUserData(safeUserId);
		const user = Array.isArray(userData) ? userData[0] : userData;
		const resolvedId = user?.idUsuario ?? user?.id ?? user?.N_idUsuario;
		if (resolvedId !== undefined && resolvedId !== null && String(resolvedId).trim() !== "") {
			return String(resolvedId).trim();
		}
	} catch {
		// Fallback to incoming userId when user data lookup fails.
	}

	return safeUserId;
};

export async function getOnboardingCompletionStatus(userId) {
	const safeUserId = String(userId || "").trim();
	if (!safeUserId) return null;
	const backendUserId = await resolveBackendUserId(safeUserId);

	if (!ONBOARDING_STATUS_ENDPOINT) {
		return null;
	}

	const token = String(localStorage.getItem("token") || "").trim();
	const headers = {
		"Content-Type": "application/json"
	};

	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	const payload = { userId: backendUserId };

	try {
		const response = await fetch(ONBOARDING_STATUS_ENDPOINT, {
			method: "POST",
			headers,
			body: JSON.stringify(payload)
		});

		if (!response.ok) {
			return null;
		}

		const contentType = response.headers.get("content-type") || "";
		const body = contentType.includes("application/json") ? await response.json() : null;
		return body?.status ?? null;
	} catch {
		return null;
	}

	return null;
}

export async function saveOnboardingStatus(userId, status) {
	const safeUserId = String(userId || "").trim();
	if (!safeUserId) {
		return { success: false, message: "userId es requerido" };
	}
	const backendUserId = await resolveBackendUserId(safeUserId);

	const normalizedStatus = Number(status) === 1 || status === true ? "1" : "0";

	if (!COMPLETE_ONBOARDING_ENDPOINT) {
		return { success: false, message: "endpoint no configurado" };
	}

	const token = String(localStorage.getItem("token") || "").trim();
	const headers = {
		"Content-Type": "application/json"
	};

	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	const payload = {
		userId: backendUserId,
		status: normalizedStatus
	};

	try {
		const response = await fetch(COMPLETE_ONBOARDING_ENDPOINT, {
			method: "POST",
			headers,
			body: JSON.stringify(payload)
		});

		const contentType = response.headers.get("content-type") || "";
		const body = contentType.includes("application/json") ? await response.json() : await response.text();

		if (!response.ok) {
			const message = typeof body === "string" ? body : (body?.message || `HTTP ${response.status}`);
			return { success: false, message };
		}

		return typeof body === "string" ? { success: true, message: body } : body;
	} catch (error) {
		return { success: false, message: error?.message || "Error inesperado" };
	}
}

export async function saveOnboardingCompletion(userId) {
	return saveOnboardingStatus(userId, true);
}

export async function resetOnboardingCompletion(userId) {
	return saveOnboardingStatus(userId, false);
}