import { useEffect } from "react";

function normalizeTag(tag, index) {
    if (typeof tag === "string") {
        return { id: `tag-${index}`, label: tag };
    }

    if (tag?.label) {
        return {
            id: tag.id || `tag-${index}`,
            label: tag.label,
            type: tag.type || "custom"
        };
    }

    if (tag?.name) {
        return {
            id: tag.id || `tag-${index}`,
            label: tag.name,
            type: tag.type || "custom"
        };
    }

    return null;
}

function ToDoListTagFetcher({ onDataLoaded }) {
    useEffect(() => {
        const fetchTags = async () => {
            try {
                const response = await fetch("http://209.25.140.25:9242/api/get-remainders");
                const json = await response.json();
                const rawData = Array.isArray(json?.data)
                    ? json.data
                    : Array.isArray(json)
                    ? json
                    : [];
                const normalizedTags = rawData.map(normalizeTag).filter(Boolean);

                if (onDataLoaded) {
                    onDataLoaded(normalizedTags);
                }
            } catch (error) {
                console.error("Error al cargar tags del To-Do:", error);
                if (onDataLoaded) {
                    onDataLoaded([]);
                }
            }
        };

        fetchTags();
    }, [onDataLoaded]);

    return null;
}

export default ToDoListTagFetcher;
