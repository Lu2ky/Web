import React, { useEffect, useRef } from "react";
import "../../styles/DayView.css";
import { BlockClasses } from "./BlockClasses";
import { BlockPersonal } from "./BlockPersonal";

const parseLocalDate = (value) => {
    if (!value) return null;
    const datePart = String(value).split("T")[0];
    const [year, month, day] = datePart.split("-").map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
};

const isDateWithinRange = (targetDate, startDateRaw, endDateRaw) => {
    const startDate = parseLocalDate(startDateRaw);
    const endDate = parseLocalDate(endDateRaw);

    if (!startDate || !endDate) return true;

    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return target >= startDate && target <= endDate;
};

function DayView({ events = [], personalEvents = [], dayOffset = 0, setDayOffset = () => {}, selectedDate, onClassClick = () => {}, onDeletePersonal = () => {}, onPersonalClick = () => {}, tagColorMap = {}, getContrastColor = () => "#000000"}) {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const MINUTES_IN_HOUR = 60;
    const [hourPx, setHourPx] = useState(0);
    const bodyRef = useRef(null);

    // Días de la semana
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

    // Obtener día actual + offset
    const getSelectedDay = () => {
        const targetDate = selectedDate ? new Date(selectedDate) : new Date();
        return days[targetDate.getDay()];
    };

    const selectedDay = getSelectedDay();

    // Obtener fecha formateada
    const getFormattedDate = () => {
        const targetDate = selectedDate ? new Date(selectedDate) : new Date();
        return targetDate.toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    };

    useEffect(() => {
        const measure = () => {
            const cell = bodyRef.current?.querySelector(".dayCell-day");
            if (cell) setHourPx(cell.getBoundingClientRect().height);
        };
        measure();
        window.addEventListener("resize", measure);
        return () => window.removeEventListener("resize", measure);
    }, []);

    const timeToMinutes = (time) => {
        const [h, m] = time.split(":").map(Number);
        return h * 60 + m;
    };

    const formatHour = (hour) => {
        const period = hour < 12 ? "AM" : "PM";
        const displayHour = hour % 12 || 12;
        return `${displayHour}:00 ${period}`;
    };

    // Detectar solapamientos y distribuir horizontalmente
    const getEventDimensions = (event, eventsList) => {
        if (eventsList.length <= 1) return { width: 100, left: 0 };
        
        const sorted = [...eventsList].sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
        const groups = [];
        const eventToGroup = {};
        
        sorted.forEach(e => {
            const startMin = timeToMinutes(e.start_time);
            const endMin = timeToMinutes(e.end_time);
            let placed = false;
            
            for (let i = 0; i < groups.length; i++) {
                const hasConflict = groups[i].some(g => {
                    const gStart = timeToMinutes(g.start_time);
                    const gEnd = timeToMinutes(g.end_time);
                    return (startMin < gEnd && endMin > gStart);
                });
                
                if (!hasConflict) {
                    groups[i].push(e);
                    eventToGroup[e.id] = i;
                    placed = true;
                    break;
                }
            }
            
            if (!placed) {
                groups.push([e]);
                eventToGroup[e.id] = groups.length - 1;
            }
        });
    
        const groupIndex = eventToGroup[event.id] || 0;
        const width = 100 / groups.length;
        const left = (groupIndex * width);
        
        return { width, left };
    };

    // Filtrar eventos solo del día seleccionado
    const dayEvents = [
        ...events.filter((event) => event.day === selectedDay),
        ...personalEvents.filter((event) => {
            if (event.day !== selectedDay) return false;
            return isDateWithinRange(selectedDate || new Date(), event.date_start, event.date_end);
        }),
    ];

    return (
        <div className="dayViewContainer">
            {/* Selector de día */}
            <div className="daySelector">
                <button 
                    className="daySelectorArrow"
                    onClick={() => setDayOffset(dayOffset - 1)}
                    title="Día anterior"
                    aria-label="Día anterior"
                    type="button"
                >
                    ←
                </button>
                <div className="daySelectorText">
                    <p className="daySelectorDate">{getFormattedDate()}</p>
                </div>
                <button 
                    className="daySelectorArrow"
                    onClick={() => setDayOffset(dayOffset + 1)}
                    title="Día siguiente"
                    aria-label="Día siguiente"
                    type="button"
                >
                    →
                </button>
            </div>
            <div className="calendarHeader">
                <div className="hoursColumnHeader">Horas</div>
                <div className="activitiesColumnHeader">Actividades</div>
            </div>
            <div className="calendarBody" ref={bodyRef}>
                {/* Capa de eventos posicionados absolutamente */}
                <div className="eventsLayer-day">
                    {dayEvents.map((event) => {
                        const startMinutes = timeToMinutes(event.start_time);
                        const endMinutes = timeToMinutes(event.end_time);
                        const pxPerMinute = hourPx ? hourPx / MINUTES_IN_HOUR : 0;
                        const top = startMinutes * pxPerMinute;
                        const height = (endMinutes - startMinutes) * pxPerMinute;
                        const { width, left } = getEventDimensions(event, dayEvents);
                        const isClass = events.some((e) => e.id === event.id);

                        const commonProps = {
                            style: {
                                position: "absolute",
                                top: `${top}px`,
                                height: `${height}px`,
                                left: `calc(5rem + ${left}%)`,
                                width: `${width}%`,
                            },
                            start_time: event.start_time,
                            end_time: event.end_time,
                        };

                        return isClass ? (
                            <BlockClasses
                                key={event.id}
                                {...commonProps}
                                subject_name={event.subject_name}
                                professor_name={event.professor_name || "No disponible"}
                                classroom={event.classroom || "No disponible"}
                                nrc={event.nrc}
                                tag={event.etiqueta}
                                onClick={() => onClassClick(event)}
                                background_color={tagColorMap[event.etiqueta] || "#a2bbd8"}
                                text_color={getContrastColor(tagColorMap[event.etiqueta])}
                            />
                        ) : (
                            <BlockPersonal
                                key={event.id}
                                {...commonProps}
                                id={event.id}
                                name={event.name || event.activity_name}
                                description={event.description}
                                tag={event.tag}
                                onClick={() => onPersonalClick(event)}
                                onDelete={() => onDeletePersonal(event.id)}
                                background_color={tagColorMap["Personal"] || "#a59090"}
                                text_color={getContrastColor(tagColorMap["Personal"])}
                            />
                        );
                    })}
                </div>

                {/* Filas de horas como fondo */}
                {hours.map((hour) => (
                    <div key={hour} className="hourRow">
                        <div className="hourCell">
                            {formatHour(hour)}
                        </div>
                        <div className="dayCell-day"></div>
                    </div>
                ))}
            </div>
        </div>
    );
}
export default DayView; 