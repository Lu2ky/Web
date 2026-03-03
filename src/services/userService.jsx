const GET_USER_DATA_ENDPOINT = import.meta.env.VITE_API_GET_USER_DATA;
const UPDATE_USER_EMAIL_ENDPOINTS = [
    import.meta.env.VITE_API_UPDATE_USER_EMAIL,
    import.meta.env.VITE_API_UPDATE_EMAIL,
].filter(Boolean);
const UPDATE_REMINDER_ANTICIPATION_ENDPOINT = import.meta.env.VITE_API_UPDATE_REMINDER_ANTICIPATION;
const CHANGE_PASSWORD_ENDPOINT = import.meta.env.VITE_API_CHANGE_PASSWORD;

/**
 * Get user data by user ID
 * @param {number|string} userId - ID of the user
 * @returns {Promise<object|null>} User data or null if not found
 */
export async function getUserData(userId) {
    if (!userId) {
        console.warn("getUserData: userId is required");
        return null;
    }

    if (!GET_USER_DATA_ENDPOINT) {
        console.warn("VITE_API_GET_USER_DATA not configured");
        return null;
    }

    try {
        const url = `${GET_USER_DATA_ENDPOINT}${userId}`;
        const res = await fetch(url);

        if (!res.ok) {
            console.error(`getUserData failed: ${res.status}`);
            return null;
        }

        const json = await res.json();
        
        // Backend returns { success: boolean, data: {...} }
        if (json.success && json.data) {
            return json.data;
        }

        return json.data || null;
    } catch (error) {
        console.error("Error fetching user data:", error);
        return null;
    }
}

/**
 * Update user email
 * @param {number|string} userId - ID of the user
 * @param {string} newEmail - New email address
 * @returns {Promise<object|null>} Update result or null
 */
export async function updateUserEmail(userId, newEmail) {
    if (!userId || !newEmail) {
        console.warn("updateUserEmail: userId and newEmail are required");
        return null;
    }

    if (!UPDATE_USER_EMAIL_ENDPOINTS.length) {
        const message = "Falta configurar VITE_API_UPDATE_USER_EMAIL (o VITE_API_UPDATE_EMAIL) para guardar el correo del perfil";
        console.warn(message);
        return { success: false, message };
    }

    const payloadVariants = [
        { idUsuario: userId, correo: newEmail },
        { userId: userId, email: newEmail },
        { idUsuario: userId, email: newEmail, correo: newEmail },
    ];

    const endpointAttempts = UPDATE_USER_EMAIL_ENDPOINTS.flatMap((endpoint) =>
        ["PUT", "POST"].map((method) => ({ endpoint, method }))
    );

    let lastError = null;

    const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

    const readPersistedEmail = async () => {
        const refreshed = await getUserData(userId);
        const normalized = Array.isArray(refreshed) ? refreshed[0] : refreshed;
        return normalizeEmail(normalized?.correo || normalized?.email);
    };

    for (const attempt of endpointAttempts) {
        for (const payload of payloadVariants) {
            try {
                const res = await fetch(attempt.endpoint, {
                    method: attempt.method,
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                });

                const contentType = res.headers.get("content-type") || "";
                const body = contentType.includes("application/json") ? await res.json() : await res.text();

                if (!res.ok) {
                    const message = typeof body === "string" ? body : body?.message;
                    lastError = `HTTP ${res.status}${message ? ` - ${message}` : ""}`;
                    continue;
                }

                const persistedEmail = await readPersistedEmail();
                if (persistedEmail === normalizeEmail(newEmail)) {
                    return typeof body === "string" ? { success: true, message: body } : body;
                }

                lastError = "La API respondió éxito pero el correo no quedó persistido en la base de datos";
            } catch (error) {
                lastError = error?.message || String(error);
            }
        }
    }

    console.error("Error updating user email:", lastError);
    return { success: false, message: lastError || "No se pudo actualizar el correo" };
}

/**
 * Change user password
 * @param {number|string} userId - ID of the user
 * @param {string} currentPassword - Current password for verification
 * @param {string} newPassword - New password
 * @returns {Promise<object|null>} Change result or null
 */
export async function changePassword(userId, currentPassword, newPassword) {
    if (!userId || !currentPassword || !newPassword) {
        console.warn("changePassword: userId, currentPassword and newPassword are required");
        return null;
    }

    if (!CHANGE_PASSWORD_ENDPOINT) {
        console.warn("VITE_API_CHANGE_PASSWORD not configured");
        return null;
    }

    try {
        const res = await fetch(CHANGE_PASSWORD_ENDPOINT, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userId: userId,
                currentPassword: currentPassword,
                newPassword: newPassword
            }),
        });

        if (!res.ok) {
            console.error(`changePassword failed: ${res.status}`);
            return null;
        }

        const json = await res.json();
        return json;
    } catch (error) {
        console.error("Error changing password:", error);
        return null;
    }
}

/**
 * Update reminder anticipation time for user preferences
 * @param {number|string} userId - ID of the user
 * @param {number} minutes - Minutes of anticipation (max 1440 = 24 hours)
 * @returns {Promise<object|null>} Update result or null
 */
export async function updateReminderAnticipation(userId, minutes) {
    if (!userId || minutes === undefined) {
        console.warn("updateReminderAnticipation: userId and minutes are required");
        return null;
    }

    // Validate max 24 hours (1440 minutes)
    const validatedMinutes = Math.min(Math.max(0, parseInt(minutes)), 1440);

    if (!UPDATE_REMINDER_ANTICIPATION_ENDPOINT) {
        const message = "Falta configurar VITE_API_UPDATE_REMINDER_ANTICIPATION para guardar el tiempo de anticipación";
        console.warn(message);
        return { success: false, message };
    }

    try {
        const res = await fetch(UPDATE_REMINDER_ANTICIPATION_ENDPOINT, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userId: userId,
                idUsuario: userId,
                anticipationMinutes: validatedMinutes,
                minutosAnticipacion: validatedMinutes
            }),
        });

        const contentType = res.headers.get("content-type") || "";
        const body = contentType.includes("application/json") ? await res.json() : await res.text();

        if (!res.ok) {
            const message = typeof body === "string" ? body : body?.message;
            const error = `HTTP ${res.status}${message ? ` - ${message}` : ""}`;
            console.error("Error updating reminder anticipation:", error);
            return { success: false, message: error };
        }

        return typeof body === "string" ? { success: true, message: body } : body;
    } catch (error) {
        const message = error?.message || String(error);
        console.error("Error updating reminder anticipation:", message);
        return { success: false, message };
    }
}

export default { getUserData, updateUserEmail, changePassword, updateReminderAnticipation };
