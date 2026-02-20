import React, { useEffect, useRef, useState } from "react";
import "../styles/DayView.css";
import { BlockClasses } from "./03.3-BlockClasses";
import { BlockPersonal } from "./03.4-BlockPersonal";

function DayView({ events = [], personalEvents = [], onClassClick = () => {}, onDeletePersonal = () => {} }) {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const MINUTES_IN_HOUR = 60;
    const [hourPx, setHourPx] = useState(0);
    const [dayOffset, setDayOffset] = useState(0);
    const bodyRef = useRef(null);

    // Días de la semana
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

    // Obtener día actual + offset
    const getSelectedDay = () => {
        const today = new Date();
        const selectedDate = new Date(today);
        selectedDate.setDate(today.getDate() + dayOffset);
        return days[selectedDate.getDay()];
    };

    const selectedDay = getSelectedDay();

    // Obtener fecha formateada
    const getFormattedDate = () => {
        const today = new Date();
        const selectedDate = new Date(today);
        selectedDate.setDate(today.getDate() + dayOffset);
        return selectedDate.toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
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
    const dayEvents = [...events, ...personalEvents].filter(e => e.day === selectedDay);

    return (
        <div className="dayViewContainer">
            {/* Selector de día */}
            <div className="daySelector">
                <button 
                    className="daySelectorArrow"
                    onClick={() => setDayOffset(dayOffset - 1)}
                >
                    ←
                </button>
                <div className="daySelectorText">
                    <p className="daySelectorDate">{getFormattedDate()}</p>
                </div>
                <button 
                    className="daySelectorArrow"
                    onClick={() => setDayOffset(dayOffset + 1)}
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
                            background_color: event.color || "#c4bebe",
                        };

                        return isClass ? (
                            <BlockClasses
                                key={event.id}
                                {...commonProps}
                                subject_name={event.subject_name}
                                professor_name={event.professor_name || "No disponible"}
                                classroom={event.classroom || "No disponible"}
                                nrc={event.nrc}
                                onClick={() => onClassClick(event)}
                            />
                        ) : (
                            <BlockPersonal
                                key={event.id}
                                {...commonProps}
                                id={event.id}
                                subject_name={event.activity_name || event.subject_name}
                                classroom={event.location || event.classroom}
                                onDelete={() => onDeletePersonal(event.id)}
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