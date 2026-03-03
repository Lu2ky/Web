import WeekView from "./WeekView";
import DayView from "./DayView";

// se recibe la vista seleccionada, los eventos de clase y personales
// Tambien el onClicks que si se le da a una clase, se muestra la info
function Calendar({ viewMode, events = [], personalEvents = [], onClassClick = () => { }, onDeletePersonal = () => { }, onPersonalClick = () => { }, tagColorMap = {}, getContrastColor = () => "#000000" }) {
    const isDayView = viewMode === "Diario";

    // Se devuelve según la vista seleccionada, pasando los eventos, los eventos personales
    return (
        <div className="Calendar">
            {isDayView ? (
                <DayView
                    events={events}
                    personalEvents={personalEvents}
                    onClassClick={onClassClick}
                    onDeletePersonal={onDeletePersonal}
                    onPersonalClick={onPersonalClick}
                    tagColorMap={tagColorMap}
                    getContrastColor={getContrastColor}
                />
            ) : (
                <WeekView
                    events={events}
                    personalEvents={personalEvents}
                    onClassClick={onClassClick}
                    onDeletePersonal={onDeletePersonal}
                    onPersonalClick={onPersonalClick}
                    tagColorMap={tagColorMap}
                    getContrastColor={getContrastColor}
                />
            )}
        </div>
    );
}
export default Calendar;