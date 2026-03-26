import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import "../../styles/DayView.css";
import { BlockClasses } from "./BlockClasses";
import { BlockPersonal } from "./BlockPersonal";

function DayView({ events = [], personalEvents = [], weekOffset = 0, setWeekOffset = () => {}, onClassClick = () => {}, onDeletePersonal = () => {}, onPersonalClick = () => {}, tagColorMap = {}, getContrastColor = () => "#000000"}) {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const MINUTES_IN_HOUR = 60;
    const [hourPx, setHourPx] = useState(64); // Inicializar con 4rem = 64px
    const [dayOffsetLocal, setDayOffsetLocal] = useState(0); // Offset relativo dentro de la semana actual (0-6)
    const HOUR_HEIGHT = 64; // 4rem = 64px exactamente
    const bodyRef = useRef(null);

    // Días de la semana (comenzando en lunes para mantener consistencia con WeekView)
    const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

    // Calcular el día seleccionado considerando weekOffset y dayOffsetLocal
    const getSelectedDay = () => {
        const today = new Date();
        const currentDay = today.getDay(); // 0 = Domingo, 1 = Lunes
        const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
        
        // Calcular la fecha de inicio de la semana (lunes)
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - daysFromMonday + (weekOffset * 7));
        
        // Sumar dayOffsetLocal para obtener el día específico
        const selectedDate = new Date(startOfWeek);
        selectedDate.setDate(startOfWeek.getDate() + dayOffsetLocal);
        
        // Retornar el nombre del día en el orden de daysOfWeek (que se alinea con WeekView)
        const dayIndex = selectedDate.getDay();
        if (dayIndex === 0) return "Domingo"; // Domingo
        return daysOfWeek[dayIndex - 1]; // Lunes a Sábado
    };

    const selectedDay = getSelectedDay();

    // Obtener fecha formateada
    const getFormattedDate = () => {
        const today = new Date();
        const currentDay = today.getDay();
        const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
        
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - daysFromMonday + (weekOffset * 7));
        
        const selectedDate = new Date(startOfWeek);
        selectedDate.setDate(startOfWeek.getDate() + dayOffsetLocal);
        
        return selectedDate.toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    };

    // Sincronizar navegación: cuando se navega hacia atrás/adelante, ajustar weekOffset si es necesario
    const handleDayNavigation = (direction) => {
        const newDayOffsetLocal = dayOffsetLocal + direction;
        
        if (newDayOffsetLocal < 0) {
            // Ir a la semana anterior
            setWeekOffset(weekOffset - 1);
            setDayOffsetLocal(6); // Último día de la semana anterior
        } else if (newDayOffsetLocal > 6) {
            // Ir a la semana siguiente
            setWeekOffset(weekOffset + 1);
            setDayOffsetLocal(0); // Primer día de la semana siguiente
        } else {
            // Navegar dentro de la misma semana
            setDayOffsetLocal(newDayOffsetLocal);
        }
    };

    useLayoutEffect(() => {
        const measure = () => {
            const cell = bodyRef.current?.querySelector(".dayCell-day");
            if (cell) {
                const height = cell.getBoundingClientRect().height;
                // Si la altura medida es cercana a 4rem (64px), usarla; si no, usar fallback
                if (height > 40) {
                    setHourPx(height);
                } else {
                    setHourPx(HOUR_HEIGHT);
                }
            } else {
                setHourPx(HOUR_HEIGHT);
            }
        };
        // Medir inmediatamente
        measure();
        const timer = setTimeout(measure, 0);
        
        const handleResize = () => {
            measure();
        };
        window.addEventListener("resize", handleResize);
        return () => {
            clearTimeout(timer);
            window.removeEventListener("resize", handleResize);
        };
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
                    onClick={() => handleDayNavigation(-1)}
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
                    onClick={() => handleDayNavigation(1)}
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
                        // Usar HOUR_HEIGHT si hourPx aún no se ha medido
                        const effectiveHourPx = hourPx > 0 ? hourPx : HOUR_HEIGHT;
                        const pxPerMinute = effectiveHourPx / MINUTES_IN_HOUR;
                        const top = startMinutes * pxPerMinute;
                        const height = (endMinutes - startMinutes) * pxPerMinute;
                        const { width, left } = getEventDimensions(event, dayEvents);
                        const isClass = events.some((e) => e.id === event.id);

                        const commonProps = {
                            style: {
                                position: "absolute",
                                top: `${top}px`,
                                height: `${height}px`,
                                left: `${left}%`,
                                width: `${width}%`,
                                minWidth: "60px",
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