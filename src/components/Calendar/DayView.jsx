import React, { useEffect, useState } from "react";
import "../../styles/ViewsBase.css";
import "../../styles/DayView.css";
import { BlockClasses } from "./BlockClasses";
import { BlockPersonal } from "./BlockPersonal";

function DayView({ events = [], personalEvents = [], onClassClick = () => {}, onDeletePersonal = () => {} }) {

    const [hourHeight, setHourHeight] = useState(0);

    const getHourHeightFromCSS = () => {
    const temp = document.createElement("div");
    temp.style.height = "var(--hour-height)";
    temp.style.position = "absolute";
    temp.style.visibility = "hidden";
    document.body.appendChild(temp);

    const height = temp.offsetHeight;
    document.body.removeChild(temp);

    return height;
    };

    useEffect(() => {
    const updateHeight = () => {
        setHourHeight(getHourHeightFromCSS());
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
    }, []);
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const MINUTES_IN_HOUR = 60;
    const pxPerMinute = hourHeight / MINUTES_IN_HOUR;
    const [dayOffset, setDayOffset] = useState(0);

    // Días de la semana
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

    // Obtener día actual + offset
    const getSelectedDate = () => {
        const today = new Date();
        const selected = new Date(today);
        selected.setDate(today.getDate() + dayOffset);
        return selected;
    };

    const selectedDate = getSelectedDate();
    const selectedDay = days[selectedDate.getDay()]

    // Obtener fecha formateada
    const formattedDate = selectedDate.toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

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
                const hasConflict = groups[i].some((g) => {
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
        <div className="calendarWrapper">
            <div className="daySelector">
                {/* Selector de día */}
                <div className="daySelector">
                    <button 
                        className="daySelectorArrow"
                        onClick={() => setDayOffset(dayOffset - 1)}
                    >
                        ←
                    </button>
                    <div className="daySelectorText">
                        <p className="daySelectorDate">{formattedDate}</p>
                    </div>
                    <button 
                        className="daySelectorArrow"
                        onClick={() => setDayOffset(dayOffset + 1)}
                    >
                        →
                    </button>
                </div>
            </div>
            {/* Header*/}
            <div className="calendarHeader">
                <div className="hoursColumnHeader">Horas</div>
                <div className="activitiesColumnHeader">Actividades</div>
            </div>
            {/* scroll + grid*/}
            <div className="calendarScrollArea">
                <div className="calendarBodyGrid">
                    {/*columnas horas*/}
                    <div className="hoursColumn">
                        {hours.map((hour)=>(
                            <div key={hour} className="hourSlot">
                                {formatHour(hour)}
                            </div>
                        ))}
                    </div>
                    {/*Timeline*/}
                    <div className="timelineColumn">
                        {/*fondos de lineas*/ }
                        {hours.map((hour)=>(
                            <div key={hour} className="timeSlot"></div>
                        ))}
                        {/*capa de eventos*/ }
                        <div className="eventsLayer">
                            {dayEvents.map((event)=>{
                                const startMinutes = timeToMinutes(event.start_time);
                                const endMinutes = timeToMinutes(event.end_time);
                                const top = startMinutes * pxPerMinute;
                                const height = (endMinutes - startMinutes)* pxPerMinute;
                                const{width, left} = getEventDimensions(event, dayEvents);
                                const isClass = event.some(
                                    (e) => e.id === event.id
                                );
                                const commonStyle = {
                                    top: `${top}px`,
                                    height: `${height}px`,
                                    left: `${left}px`,
                                    width: `${width}px`,
                                };
                                return isClass ? (
                                    <BlockClasses
                                        key={event.id}
                                        style={commonStyle}
                                        start_time={event.start_time}
                                        end_time={event.end_time}
                                        sunject_name={event.subject_name}
                                        professor_name={event.professor_name || "No disponible"}
                                        classroom={event.classroom || "No disponible"}
                                        nrc={event.nrc}
                                        background_color={event.color || "#c4bebe"}
                                        onClick={()=> onClassClick(event)}
                                    />
                                ) : (
                                    <BlockPersonal
                                        key={event.id}
                                        style={commonStyle}
                                        id={event.id}
                                        subject_name={event.activity_name || event.subject_name}
                                        classroom={event.location || event.classroom}
                                        background_color={event.color || "#c4bebe"}
                                        onDelete={()=>onDeletePersonal(event.id)}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DayView; 