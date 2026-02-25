// servicio para guardar y recuperar actividades personales en localStorage

const STORAGE_KEY = "personalActivities";

export function saveActivity(formData) {
  const activities = getAllActivities();
  
  const newActivity = {
    id: `personalActivity-${Date.now()}`,
    subject_name: formData.title,
    activity_name: formData.title,
    professor_name: formData.description || "Personal",
    classroom: formData.location || "Personal",
    location: formData.location || "Personal",
    start_time: formData.startHour,
    end_time: formData.endHour,
    day: formData.day,
    tag: "Personal",
    credits: 0,
    campus: "Personal",
    academicPeriod: "Personal",
    nrc: null,
  };
  
  activities.push(newActivity);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
  
  return newActivity;
}

export function getAllActivities() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error parsing personal activities:", error);
    return [];
  }
}

export function deleteActivity(id) {
  const activities = getAllActivities();
  const filtered = activities.filter(a => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function clearAllActivities() {
  localStorage.removeItem(STORAGE_KEY);
}
