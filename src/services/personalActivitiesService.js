// servicio para guardar y recuperar actividades personales en localStorage

const STORAGE_KEY = "personalActivities";
const colorPalette = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
  "#DFE6E9", "#74B9FF", "#A29BFE", "#FD79A8", "#FDCB6E",
  "#6C5CE7", "#00B894", "#FF7675", "#55EFC4", "#81ECEC",
  "#FAB1A0", "#E17055", "#00CEC9",
];

function getColorForSubject(subjectName) {
  let hash = 0;
  for (let i = 0; i < subjectName.length; i++) {
    hash = subjectName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colorPalette[Math.abs(hash) % colorPalette.length];
}

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
    color: getColorForSubject(formData.title),
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
