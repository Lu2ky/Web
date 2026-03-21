import { useEffect, useRef, useState } from "react";
import "../../styles/WeekView.css";
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

function WeekView({ events = [], personalEvents = [], selectedWeekStart, onClassClick = () => { }, onDeletePersonal = () => {}, onPersonalClick = () => {}, tagColorMap = {}, getContrastColor = () => "#000000" }) {
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

  const monday = selectedWeekStart ? new Date(selectedWeekStart) : new Date();

  const getDateForDay = (dayIndex) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + dayIndex);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const eventsByDay = {};

  events.forEach((event) => {
    if (!eventsByDay[event.day]) eventsByDay[event.day] = [];
    eventsByDay[event.day].push(event);
  });

  days.forEach((day, dayIndex) => {
    const targetDate = getDateForDay(dayIndex);
    const validPersonalEvents = personalEvents.filter((event) => {
      if (event.day !== day) return false;
      return isDateWithinRange(targetDate, event.date_start, event.date_end);
    });

    if (!eventsByDay[day]) eventsByDay[day] = [];
    eventsByDay[day].push(...validPersonalEvents);
  });

  // Debug: mostrar agrupación
  personalEvents.forEach(ev => {
    console.log(`  - Evento "${ev.name}" en día: "${ev.day}" (type: ${typeof ev.day})`);
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
