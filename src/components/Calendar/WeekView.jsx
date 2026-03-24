import { useEffect, useLayoutEffect, useRef, useState } from "react";
import "../../styles/WeekView.css";
import { BlockClasses } from "./BlockClasses";
import { BlockPersonal } from "./BlockPersonal";

function WeekView({ events = [], personalEvents = [], onClassClick = () => { }, onDeletePersonal = () => {}, onPersonalClick = () => {}, tagColorMap = {}, getContrastColor = () => "#000000" }) {
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
  const HOUR_HEIGHT = 64; // 4rem = 64px
  const [hourPx, setHourPx] = useState(64); // Inicializar con 64px en lugar de 0
  const [weekOffset, setWeekOffset] = useState(0);
  const gridRef = useRef(null);
  // Obtener rango de fechas de la semana
  const getWeekDateRange = () => {
      const today = new Date();
      const currentDay = today.getDay(); // 0 = Domingo, 1 = Lunes, etc.
      // Calcular inicio de semana (Lunes)
      const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // Lunes es día 1
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - daysFromMonday + (weekOffset * 7));
      // Calcular fin de semana (Domingo)
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      // Formatear fechas
      const formatDate = (date) => {
      const month = date.toLocaleDateString("es-ES", { month: "short" });
      const day = date.getDate();
      return `${month} ${day}`;
      };

      return `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
  };
  // Medir la altura real de una hora (cambia con media queries/responsive)
  useLayoutEffect(() => {
    const measure = () => {
      const cell = gridRef.current?.querySelector(".dayCell");
      if (cell) {
        const height = cell.getBoundingClientRect().height;
        if (height > 40) {
          setHourPx(height);
        } else {
          setHourPx(HOUR_HEIGHT);
        }
      } else {
        setHourPx(HOUR_HEIGHT);
      }
    };
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
      <div className="weekSelector">
        <button
          className="weekSelectorArrow"
          onClick={() => setWeekOffset(weekOffset - 1)}
          title="Semana anterior"
          aria-label="Semana anterior"
          type="button"
        >
          ←
        </button>
        <div className="weekSelectorText">
          <p className="weekSelectorDate">{getWeekDateRange()}</p>
        </div>
          <button
            className="weekSelectorArrow"
            onClick={() => setWeekOffset(weekOffset + 1)}
            title="Semana siguiente"
            aria-label="Semana siguiente"
            type="button"
          >
            →
          </button>
      </div>
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
                  const effectiveHourPx = hourPx > 0 ? hourPx : HOUR_HEIGHT;
                  const pxPerMinute = effectiveHourPx / MINUTES_IN_HOUR;
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
