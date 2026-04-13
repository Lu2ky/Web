export const PAST_REMINDER_DATE_MESSAGE = "Por favor, selecciona una fecha y hora futura.";

const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const dateTimePattern = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/;

export function isReminderDateInPast(dueDateValue, now = new Date()) {
    if (!dueDateValue) return false;

    if (dueDateValue instanceof Date) {
        return dueDateValue.getTime() <= now.getTime();
    }

    const raw = String(dueDateValue).trim();
    if (!raw) return false;

    const dateTime = raw.match(dateTimePattern);
    if (dateTime) {
        const year = Number(dateTime[1]);
        const month = Number(dateTime[2]) - 1;
        const day = Number(dateTime[3]);
        const hour = Number(dateTime[4]);
        const minute = Number(dateTime[5]);
        const second = Number(dateTime[6] || 0);
        const selectedDateTime = new Date(year, month, day, hour, minute, second);
        return selectedDateTime.getTime() <= now.getTime();
    }

    const dateOnly = raw.match(dateOnlyPattern);
    if (dateOnly) {
        const year = Number(dateOnly[1]);
        const month = Number(dateOnly[2]) - 1;
        const day = Number(dateOnly[3]);
        const selectedDate = new Date(year, month, day);
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return selectedDate < today;
    }

    const parsed = new Date(raw.replace(" ", "T"));
    return Number.isNaN(parsed.getTime()) ? false : parsed.getTime() <= now.getTime();
}