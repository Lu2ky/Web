// categoriesService.jsx
let cachedCategories = null;

export async function getCategories() {
    if (cachedCategories) {
        return cachedCategories;
    }

    const data = [
        "Teoría", 
        "Laboratorio",
        "Cultural",
        "Deportiva", 
        "Centro de lenguas",
        "Pastoral", 
        "Personal"
    ];

    cachedCategories = data;
    return data;
}
