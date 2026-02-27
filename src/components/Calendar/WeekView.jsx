import React, { useEffect, useMemo, useState } from "react";
import "../../styles/ViewsBase.css";
import "../../styles/DayView.css";
import { BlockClasses } from "./BlockClasses";
import { BlockPersonal } from "./BlockPersonal";



function WeekView({ events = [], personalEvents = [], onClassClick = () => { }, onDeletePersonal = () => {} }) {
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

  const [hourHeight, setHourHeight] = useState(0);
  useEffect(() => {
  const updateHeight = () => {
    const value = getHourHeightFromCSS();
    setHourHeight(value);
  };

  updateHeight();
  window.addEventListener("resize", updateHeight);
  return () => window.removeEventListener("resize", updateHeight);
}, []);
  const MINUTES_IN_HOUR = 60;
  const pxPerMinute = hourHeight / MINUTES_IN_HOUR
  
  const timeToMinutes = (time) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
  };

  const formatHour = (hour) => {
  const period = hour < 12 ? "AM" : "PM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:00 ${period}`;
  };

  // Agrupar eventos por día
  const eventsByDay = useMemo(()=> {
    const grouped = {};
    [...events, ...personalEvents].forEach((event) => {
      if(!grouped[event.day]) grouped[event.day]=[];
      grouped[event.day].push(event);
    })
    return grouped;
  }, [events, personalEvents]);

  //Detectar solapamientos
  const getEventDimensions = (event, eventsList)=> {
    if(eventsList.lenght <= 1) return {width:100, left:0};
    const sorted = [...eventList].sort(
      (a,b)=>timeToMinutes(a.start_time) - timeToMinutes(b.start_time)
    );
    const groups = [];
    const eventToGroup={};
    sorted.forEach((e)=> {
      const startMin= timeToMinutes(e.start_time);
      const endMin= timeToMinutes(e.end_time);
      let placed=false;
      for(let i = 0; i < groups.lenght; i++) {
        const hasConflict = groups[i].some((g)=> {
          const gStart=timeToMinutes(g.start_time);
          const gEnd=timeToMinutes(g.end_time);
          return startMin < gEnd && endMin >gStart;
        });
        if(!hasConflict){
          groups[i].push(e);
          eventToGroup[e.id]=i;
          placed=true;
          break;
        }
      }
      if(!placed){
        groups.push([e]);
        eventToGroup[e.id]=groups.length-1;
      }
    });
    const groupindex = eventToGroup[event.id] || 0;
    const width = 100 / groups.length;
    const left= groupindex * width;
    return{width, left};
  };

  return (
    <div className="calendarWrapper">

      {/* Encabezados */}
      <div className="calendarheader weekHeader">
        <div className="hoursColumnHeader">Horas</div>
        {days.map((day) => (
          <div key={day} className="dayHeaderCell">{day}</div>
        ))}
      </div>

      {/* Área scrollable */}
      <div className="calendarScrollArea">
        <div className="calendarBodyGrid weekGrid">
          {/* Columna de horas */}
          <div className="hoursColumn">
            {hours.map((hour) => (
              <div key={hour} className="hourSlot">
                {formatHour(hour)}
              </div>
            ))}
          </div>

          {/* Columnas de días */}
          {days.map((day) => (
            <div key={day} className="timeSlot">
              {/*fondo */}
              {hours.map((hour)=> (
                <div key={hour} className="timeSlot"></div>
              ))}
              {/*Eventos */}
              <div className="eventsLayer">
                {(eventsByDay[day] || []).map((event)=> {
                const startMinutes = timeToMinutes(event.start_time);
                const endMinutes = timeToMinutes(event.end_time);
                const top = startMinutes * pxPerMinute;
                const height = (endMinutes - startMinutes)*pxPerMinute;
                const {width, left}=getEventDimensions(event,eventsByDay[day]);
                const isClass = events.some(
                  (e) => e.id === event.id
                );
                const style = {
                  top: `${top}px`,
                  height: `${height}px`,
                  left: `${left}%`,
                  width: `${width}%`,
                };
                return isClass ? (
                  <BlockClasses
                    key={event.id}
                    style={style}
                    start_time={event.start_time}
                    end_time={event.end_time}
                    subject_name={event.subject_name}
                    professor_name={event.professor_name || "No disponible"}
                    classroom={event.classroom || "No disponible"}
                    nrc={event.nrc}
                    background_color={event.color || "#c4bebe"}
                    onClick={()=> onClassClick(event)}
                  />
                ) : (
                  <BlockPersonal
                    key={event.id}
                    style={style}
                    id={event.id}
                    subject_name={event.activity_name || event.subject_name}
                    classroom={event.location || event.classroom}
                    background_color={event.color || "#c4bebe"}
                    onDelete={()=> onDeletePersonal(event.id)}
                  />
                 );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export default WeekView;
