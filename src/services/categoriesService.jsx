// categoriesService.jsx
let cachedCategories = null;

export async function getCategories() {
    if (cachedCategories) {
        return cachedCategories;
    }

    const data = [
        "Todo",
        "Matemática",
        "Física",
        "Programación",
        "Química",
        "Historia",
        "Personal"
    ];

    cachedCategories = data;
    return data;
}
