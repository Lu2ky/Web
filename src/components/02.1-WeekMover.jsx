import React, {useState} from "react";
import "../styles/WeekMover.css";

function GetStartOfWeek(date) {
    const fullDate = new Date(date);
    const day = fullDate.getDay();
    // Ajustar para que la semana empiece en Lunes (day=0 → domingo → retroceder 6)
    const diff = (day === 0 ? 6 : day - 1);
    fullDate.setDate(fullDate.getDate() - diff);
    fullDate.setHours(0, 0, 0, 0);
    return fullDate;
}

function FormatWeekRange(startDate, endDate) {
    const sameYear = startDate.getFullYear() === endDate.getFullYear();
    if (sameYear) {
        return `${startDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        })} - ${endDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        })}`;
    }
    return `${startDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    })} - ${endDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    })}`;
}

function WeekMover() {
    const [weekOffset, setWeekOffset] = useState(0);
    const today = new Date();
    const startOfWeek = GetStartOfWeek(today);
    const displayStart = new Date(startOfWeek);
    displayStart.setDate(displayStart.getDate() + weekOffset * 7);
    const displayEnd = new Date(displayStart);
    displayEnd.setDate(displayEnd.getDate() + 6);

    return (
        <div className="navigatorContainer">
            <button
                className="dateBoxArrowBox"
                onClick={() => setWeekOffset(weekOffset - 1)}
            >
                <span>←</span>
            </button>

            <div className="dateBoxCenterBox">
                {FormatWeekRange(displayStart, displayEnd)}
            </div>

            <button
                className="dateBoxArrowBox"
                onClick={() => setWeekOffset(weekOffset + 1)}
            >
                <span>→</span>
            </button>   
        </div>
    );
}
export default WeekMover;