const GET_USER_DATA_ENDPOINT = import.meta.env.VITE_API_GET_USER_DATA;
const CONFIG_NOTIFICATION_ENDPOINT = import.meta.env.VITE_API_UPDATE_USER_EMAIL || import.meta.env.VITE_API_UPDATE_REMINDER_ANTICIPATION;
const CHANGE_PASSWORD_ENDPOINT = import.meta.env.VITE_API_CHANGE_PASSWORD;

// Log endpoints for debugging
console.log("Config Notification Endpoint:", CONFIG_NOTIFICATION_ENDPOINT);

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

    if (!CONFIG_NOTIFICATION_ENDPOINT) {
        const message = "Falta configurar VITE_API_UPDATE_USER_EMAIL para guardar el correo del perfil";
        console.error(message);
        return { success: false, message };
    }

    // Fetch current user data to get tiempoMute and actual idUsuario from DB
    const currentData = await getUserData(userId);
    console.log("Current user data received:", currentData);
    
    const currentUser = Array.isArray(currentData) ? currentData[0] : currentData;
    console.log("Current user object:", currentUser);
    
    if (!currentUser) {
        console.error("No user data found for userId:", userId);
        return { success: false, message: "No se encontraron datos del usuario" };
    }
    
    // Use the actual idUsuario from the database, not the one passed as parameter
    const actualUserId = currentUser.idUsuario || currentUser.id || Number(userId);
    console.log("Using actualUserId from DB:", actualUserId);
    
    // Get tiempoMute - try multiple field names
    let currentTimeMute = currentUser?.antelacionNotis || 
                         currentUser?.tiempoMute || 
                         currentUser?.anticipationTime ||
                         "00:00:00";
    
    console.log("Current tiempoMute:", currentTimeMute);
    
    // Validate tiempoMute format (should be HH:MM:SS)
    if (typeof currentTimeMute !== 'string' || !currentTimeMute.includes(':')) {
        console.warn("tiempoMute format invalid, using default");
        currentTimeMute = "00:00:00";
    }

    const payload = {
        idUsuario: actualUserId,
        correo: newEmail.trim(),
        tiempoMute: currentTimeMute
    };

    try {
        console.log("Updating email with payload:", payload);
        console.log("Endpoint:", CONFIG_NOTIFICATION_ENDPOINT);
        
        const res = await fetch(CONFIG_NOTIFICATION_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        console.log("Response status:", res.status);
        const contentType = res.headers.get("content-type") || "";
        const body = contentType.includes("application/json") ? await res.json() : await res.text();
        console.log("Response body:", body);

        // Check if backend returned success: false in the body (even with status 200)
        if (typeof body === 'object' && body.success === false) {
            console.error("Backend returned success: false -", body.message);
            return { success: false, message: body.message || "El servidor rechazó la actualización" };
        }

        if (!res.ok) {
            const message = typeof body === "string" ? body : body?.message;
            console.error(`updateUserEmail HTTP ${res.status}:`, message);
            return { success: false, message: `HTTP ${res.status} - ${message}` };
        }

        return typeof body === "string" ? { success: true, message: body } : body;
    } catch (error) {
        console.error("Error updating user email:", error);
        return { success: false, message: error?.message || "No se pudo actualizar el correo" };
    }
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

    if (!CONFIG_NOTIFICATION_ENDPOINT) {
        const message = "Falta configurar VITE_API_UPDATE_REMINDER_ANTICIPATION para guardar el tiempo de anticipación";
        console.error(message);
        return { success: false, message };
    }

    // Convert minutes to TIME format (HH:MM:SS) as expected by backend
    const hours = Math.floor(validatedMinutes / 60);
    const mins = validatedMinutes % 60;
    const tiempoMute = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;

    // Fetch current user data to get correo and actual idUsuario from DB
    const currentData = await getUserData(userId);
    console.log("Current user data received:", currentData);
    
    const currentUser = Array.isArray(currentData) ? currentData[0] : currentData;
    console.log("Current user object:", currentUser);
    
    if (!currentUser) {
        console.error("No user data found for userId:", userId);
        return { success: false, message: "No se encontraron datos del usuario" };
    }
    
    // Use the actual idUsuario from the database, not the one passed as parameter
    const actualUserId = currentUser.idUsuario || currentUser.id || Number(userId);
    console.log("Using actualUserId from DB:", actualUserId);
    
    const currentEmail = (currentUser?.correo || currentUser?.email || "").trim();
    console.log("Current email:", currentEmail);

    const payload = {
        idUsuario: actualUserId,
        correo: currentEmail,
        tiempoMute: tiempoMute
    };

    try {
        console.log("Updating reminder anticipation with payload:", payload);
        console.log("Endpoint:", CONFIG_NOTIFICATION_ENDPOINT);
        
        const res = await fetch(CONFIG_NOTIFICATION_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        console.log("Response status:", res.status);
        const contentType = res.headers.get("content-type") || "";
        const body = contentType.includes("application/json") ? await res.json() : await res.text();
        console.log("Response body:", body);

        // Check if backend returned success: false in the body (even with status 200)
        if (typeof body === 'object' && body.success === false) {
            console.error("Backend returned success: false -", body.message);
            return { success: false, message: body.message || "El servidor rechazó la actualización" };
        }

        if (!res.ok) {
            const message = typeof body === "string" ? body : body?.message;
            console.error(`updateReminderAnticipation HTTP ${res.status}:`, message);
            return { success: false, message: `HTTP ${res.status} - ${message}` };
        }

        return typeof body === "string" ? { success: true, message: body } : body;
    } catch (error) {
        console.error("Error updating reminder anticipation:", error);
        return { success: false, message: error?.message || "No se pudo actualizar el tiempo de anticipación" };
    }
}

export default { getUserData, updateUserEmail, changePassword, updateReminderAnticipation };
