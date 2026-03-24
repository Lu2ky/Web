// Utilidad de servicio para varios endpoints relacionados con etiquetas

const TAGS_USER_URL = import.meta.env.VITE_API_URL_TAGS_USER;

const BASE_HOST = TAGS_USER_URL
    ? TAGS_USER_URL.replace(/\/tags-by-user\/??$/, "")
    : "";

const TAGS_USER_AND_COURSE_URL = `${BASE_HOST}/tags-by-user-and-course/`;
const TAGS_REMINDER_URL = import.meta.env.VITE_API_URL_TAGS_REMINDER;
const DELETE_TAGS_REMINDER_URL = import.meta.env.VITE_API_DELETE_TAGS_REMINDER;
const DELETE_TAG_URL = `${BASE_HOST}/delete-tag`;

function normalizeTag(tag) {
    if (typeof tag === "string") {
        return tag;
    }
    // El backend envía { id, nombre }
    if (tag?.nombre) {
        return tag.nombre;
    }
    if (tag?.label) {
        return tag.label;
    }
    if (tag?.name) {
        return tag.name;
    }
    return null;
}

export async function getTagsByUserAndCourse(userId, courseId) {
    if (!userId || !courseId) return [];
    const url = `${TAGS_USER_AND_COURSE_URL}${userId}/${courseId}`;
    const res = await fetch(url);
    if (!res.ok) {
        console.error("getTagsByUserAndCourse failed", res.status);
        return [];
    }
    const json = await res.json();
    const rawData = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
    return rawData.map(normalizeTag).filter(Boolean);
}

export async function deleteTag(tagId) {
    if (!tagId) return;
    // El backend espera body: { idTag: { IdTag: tagId } }
    const payload = { idTag: { IdTag: tagId } };
    const res = await fetch(DELETE_TAG_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`deleteTag failed: ${res.status} ${txt}`);
    }
    return res.json();
}

export async function getTagsByReminder(userId, reminderId) {
    if (!userId || !reminderId) return [];
    const url = `${TAGS_REMINDER_URL}${userId}/${reminderId}`;
    const res = await fetch(url);
    if (!res.ok) {
        console.error("getTagsByReminder failed", res.status);
        return [];
    }
    const json = await res.json();
    const rawData = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
    return rawData.map(normalizeTag).filter(Boolean);
}

export async function deleteTagsForReminder(reminderId) {
    if (!reminderId) return;
    // La convención del body depende del backend; se envía un objeto simple
    const payload = { N_idRecordatorio: reminderId };
    const res = await fetch(DELETE_TAGS_REMINDER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`deleteTagsForReminder failed: ${res.status} ${txt}`);
    }
    return res.json();
}

export async function getTagsByUser(userId) {
    if (!userId || !TAGS_USER_URL) return [];
    const res = await fetch(`${TAGS_USER_URL}${userId}`);
    if (!res.ok) {
        console.error("getTagsByUser failed", res.status);
        return [];
    }
    const json = await res.json();
    const rawData = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
    const normalized = rawData.map((tag, index) => {
        if (!tag) return null;
        if (typeof tag === "string") return { id: `tag-${index}`, label: tag, type: "custom" };
        if (tag?.label) return { id: tag.id || `tag-${index}`, label: tag.label, type: tag.type || "custom" };
        if (tag?.nombre) return { id: tag.id || `tag-${index}`, label: tag.nombre, type: tag.type || "custom" };
        if (tag?.name) return { id: tag.id || `tag-${index}`, label: tag.name, type: tag.type || "custom" };
        return null;
    }).filter(Boolean);
    // Quitar duplicados por id para evitar colisiones de key en React
    const seen = new Set();
    return normalized.filter(t => {
        if (seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
    });
}