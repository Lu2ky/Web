// categoriesService.jsx
let cachedCategories = null;

export async function getCategories() {
    if (cachedCategories) {
        return cachedCategories;
    }

    const data = [
        "Teoría", 
        "Pastoral", 
        "Deportiva", 
        "Centro de lenguas",
        "Personal", 
        "Cultural", 
        "Laboratorio"
    ];

    cachedCategories = data;
    return data;
}
