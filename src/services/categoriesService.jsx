// categoriesService.jsx
let cachedCategories = null;

export async function getCategories() {
    if (cachedCategories) {
        return cachedCategories;
    }

    const data = [
        "Teoría", 
        "Laboratorio",
        "Personal",
        "Pastoral", 
        "Deportiva", 
        "Centro de lenguas",
        "Cultural"
    ];

    cachedCategories = data;
    return data;
}
