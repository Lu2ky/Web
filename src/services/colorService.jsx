// ============================================================================
// Servicio de Gestión de Colores y Paletas
// ============================================================================
// Gestiona operaciones relacionadas con paletas de colores de temas.
// Proporciona funciones para:
// - Obtener la paleta de colores guardada del usuario (POST)
// - Guardar/actualizar la paleta de colores del usuario (POST)
// ============================================================================

const GET_COLORS_ENDPOINT = import.meta.env.VITE_API_URL_COLORS;
const SAVE_COLORS_ENDPOINT = import.meta.env.VITE_API_SAVE_COLORS;

const normalizeUserId = (userId) => {
    const numericId = Number(userId);
    return Number.isNaN(numericId) ? userId : numericId;
};

const buildEndpointCandidates = (endpoint) => {
    const normalized = String(endpoint || "").trim();
    if (!normalized) return [];
    return normalized.endsWith("/")
        ? [normalized, normalized.slice(0, -1)]
        : [normalized, `${normalized}/`];
};


export async function getColorPalette(userId) {
    if (!userId) {
        console.warn("getColorPalette: userId is required");
        return null;
    }

    if (!GET_COLORS_ENDPOINT) {
        console.warn("VITE_API_URL_COLORS not configured");
        return null;
    }

    try {
        // envio de userId
        const payload = {
            userId: normalizeUserId(userId),
        };
        const tokenLocalStore = localStorage.getItem("token") || "";
        const token = `Bearer ${tokenLocalStore}`;

        const endpoints = buildEndpointCandidates(GET_COLORS_ENDPOINT);
        let response = null;

        for (const endpoint of endpoints) {
            response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token,
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) break;
        }

        if (!response || !response.ok) {
            console.error(`getColorPalette failed: ${response?.status}`);
            return null;
        }

        const data = await response.json();

        // El servidor puede retornar { success: boolean, data: {...} } o directamente la paleta
        if (data.success && data.data) {
            return data.data;
        }

        return data;
    } catch (error) {
        console.error("Error fetching color palette:", error);
        return null;
    }
}

export async function saveColorPalette(userId, paletteName) {
    if (!userId || !paletteName) {
        console.warn("saveColorPalette: userId and paletteName are required");
        return null;
    }

    if (!SAVE_COLORS_ENDPOINT) {
        console.warn("VITE_API_SAVE_COLORS not configured");
        return null;
    }

    try {
        const payload = {
            userId: normalizeUserId(userId),
            palette: paletteName,
        };
        const tokenLocalStore = localStorage.getItem("token") || "";
        const token = `Bearer ${tokenLocalStore}`;

        const endpoints = buildEndpointCandidates(SAVE_COLORS_ENDPOINT);
        let response = null;

        for (const endpoint of endpoints) {
            response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token,
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) break;
        }

        if (!response || !response.ok) {
            console.error(`saveColorPalette failed: ${response?.status}`);
            const errorText = response ? await response.text() : "";
            console.error("Error response:", errorText);
            return null;
        }

        const data = await response.json();

        return data;
    } catch (error) {
        console.error("Error saving color palette:", error);
        return null;
    }
}
