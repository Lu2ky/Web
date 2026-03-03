const GET_USER_DATA_ENDPOINT = import.meta.env.VITE_API_GET_USER_DATA;
const UPDATE_USER_EMAIL_ENDPOINT = import.meta.env.VITE_API_UPDATE_USER_EMAIL;
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

    if (!UPDATE_USER_EMAIL_ENDPOINT) {
        console.warn("VITE_API_UPDATE_USER_EMAIL not configured");
        return null;
    }

    try {
        const res = await fetch(UPDATE_USER_EMAIL_ENDPOINT, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userId: userId,
                email: newEmail
            }),
        });

        if (!res.ok) {
            console.error(`updateUserEmail failed: ${res.status}`);
            return null;
        }

        const json = await res.json();
        return json;
    } catch (error) {
        console.error("Error updating user email:", error);
        return null;
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

export default { getUserData, updateUserEmail, changePassword };
