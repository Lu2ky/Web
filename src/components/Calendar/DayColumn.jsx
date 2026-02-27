import { BlockClasses } from "./BlockClasses";
import { BlockPersonal } from "./BlockPersonal";

const MINUTES_IN_HOUR=60;

function DayColumn({
    day,
    hours,
    hourPx,
    events=[],
    onClassClick,
    onDeletePersonal,
}) {
    const timeToMinutes = (time) => {
        const[hour,min] = time.split(":").map(Number);
        return hour*60+min;
    };
    const pxPerMinute = hourPx ? hourPx / MINUTES_IN_HOUR:0;
    return(
        <div className="dayColumn">
            <div className="eventsLayer">
                {events.map((event) => {
                const startMinutes = timeToMinutes(event.start_time);
                const endMinutes = timeToMinutes(event.end_time);

                const top = startMinutes * pxPerMinute;
                const height = (endMinutes - startMinutes) * pxPerMinute;

                const commonStyle = {
                    position: "absolute",
                    top,
                    height,
                    left: 0,
                    right: 0,
                };
                const isClass = event.type ==="class";
                return isClass ? (
                    <BlockClasses
                    key={event.id}
                    style={commonStyle}
                    {...event}
                    onClick={() => onClassClick(event)}
                    />
                ) : (
                    <BlockPersonal
                    key={event.id}
                    style={commonStyle}
                    {...event}
                    onDelete={() => onDeletePersonal(event.id)}
                    />
                )
                }
                )
            }
        </div>
        {hours.map((hour) => (
            <div key={`${day}-${hour}`} className="dayCell"></div>
        )
        )
        }

    </div>
    )
}