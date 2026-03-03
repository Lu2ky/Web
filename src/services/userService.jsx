const GET_USER_DATA_ENDPOINT = import.meta.env.VITE_API_GET_USER_DATA;

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

export default { getUserData };
