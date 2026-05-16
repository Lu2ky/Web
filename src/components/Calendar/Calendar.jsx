import { memo } from "react";
import WeekView from "./WeekView";
import DayView from "./DayView";

// se recibe la vista seleccionada, los eventos de clase y personales
// Tambien el onClicks que si se le da a una clase, se muestra la info
function Calendar({ viewMode, events = [], personalEvents = [], weekOffset = 0, setWeekOffset = () => {}, onClassClick = () => { }, onDeletePersonal = () => { }, onPersonalClick = () => { }, tagColorMap = {}, getContrastColor = () => "#000000" }) {
    const isDayView = viewMode === "Diario";

    const handleCalendarExplore = () => {
        window.dispatchEvent(new CustomEvent("onboarding:calendar-clicked"));
    };

    // Se devuelve según la vista seleccionada, pasando los eventos, los eventos personales
    return (
        <div className="Calendar" data-onboarding-id="calendar-grid" onClick={handleCalendarExplore}>
            {isDayView ? (
                <DayView
                    events={events}
                    personalEvents={personalEvents}
                    weekOffset={weekOffset}
                    setWeekOffset={setWeekOffset}
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
                    weekOffset={weekOffset}
                    setWeekOffset={setWeekOffset}
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
export default memo(Calendar);