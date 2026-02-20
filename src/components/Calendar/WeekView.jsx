import React, { useEffect, useRef, useState } from "react";
import "../../styles/WeekView.css";
import { BlockClasses } from "./BlockClasses";
import { BlockPersonal } from "./BlockPersonal";

function WeekView({ events = [], personalEvents = [], onClassClick = () => { }, onDeletePersonal = () => {} }) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const days = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
  ];

  const MINUTES_IN_HOUR = 60;
  const [hourPx, setHourPx] = useState(0);
  const gridRef = useRef(null);

  // Medir la altura real de una hora (cambia con media queries/responsive)
  useEffect(() => {
    const measure = () => {
      const cell = gridRef.current?.querySelector(".dayCell");
      if (cell) setHourPx(cell.getBoundingClientRect().height);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const timeToMinutes = (time) => {
    const [hour, min] = time.split(":").map(Number);
    return hour * 60 + min;
  };

  // Agrupar eventos por día
  const eventsByDay = {};
  [...events, ...personalEvents].forEach((event) => {
    if (!eventsByDay[event.day]) eventsByDay[event.day] = [];
    eventsByDay[event.day].push(event);
  });

  const formatHour = (hour) => {
    const period = hour < 12 ? "AM" : "PM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:00 ${period}`;
  };

  return (
    <div className="weekViewWrapper">

      
      {/* Encabezados */}
      <div className="weekHeaderRow">
        <div className="hourHeaderCell">Horas</div>
        {days.map((day) => (
          <div key={day} className="dayHeaderCell">{day}</div>
        ))}
      </div>

      {/* Área scrollable */}
      <div className="weekScrollArea">
        <div className="weekGrid" ref={gridRef}>
          {/* Columna de horas */}
          <div className="hoursColumn">
            {hours.map((hour) => (
              <div key={`hour-${hour}`} className="hourRow">
                <div className="hourCell">{formatHour(hour)}</div>
              </div>
            ))}
          </div>

          {/* Columnas de días */}
          {days.map((day) => (
            <div key={day} className="dayColumn">
              {/* Capa de eventos */}
              <div className="eventsLayer">
                {(eventsByDay[day] || []).map((event) => {
                  const startMinutes = timeToMinutes(event.start_time);
                  const endMinutes = timeToMinutes(event.end_time);
                  const pxPerMinute = hourPx ? hourPx / MINUTES_IN_HOUR : 0;
                  const top = startMinutes * pxPerMinute;
                  const height = (endMinutes - startMinutes) * pxPerMinute;
                  const isClass = events.some((e) => e.id === event.id);

                  const commonProps = {
                    style: {
                      position: "absolute",
                      top: `${top}px`,
                      height: `${height}px`,
                      left: 0,
                      right: 0,
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

              {/* Grid de horas como fondo */}
              {hours.map((hour) => (
                <div key={`${day}-${hour}`} className="dayCell"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default WeekView;
