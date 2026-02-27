import WeekView from "./WeekView";
import DayView from "./DayView";

// se recibe la vista seleccionada, los eventos de clase y personales
// Tambien el onClicks que si se le da a una clase, se muestra la info
function Calendar({ viewMode, events = [], personalEvents = [], onClassClick = () => {}, onDeletePersonal = () => {} }) {
    const isDayView = viewMode === "Diario";
    //Normalizacion de eventos
    const normalizedEvents = [
        ...events.map(e => ({...e, type: "class"})),
        ...personalEvents.map(e => ({...e, type: "personal"}))
    ];
    // Se devuelve según la vista seleccionada, pasando los eventos, los eventos personales
    return (
        <div className="calendarWrapper">
            <div className="calendarScrollArea">
                {isDayView ? (
                    <DayView 
                        events={normalizedEvents}
                        onClassClick={onClassClick} 
                        onDeletePersonal={onDeletePersonal}
                    />
                ) : (
                    <WeekView
                        events={normalizedEvents}
                        onClassClick={onClassClick}
                        onDeletePersonal={onDeletePersonal}
                    />
                
                )}
                <div className="controlBarSticky">
                    <contolBar/>
                </div>
            </div>
        </div>
    );
}

export default Calendar;


