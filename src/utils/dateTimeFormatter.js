/**
 * Converts various date value formats to a Date object
 * Accepts: Date objects, YYYY-MM-DD strings, YYYY-MM-DD HH:mm:ss strings, ISO strings
 */
export const stringToDate = (dateValue) => {
    if (!dateValue) return new Date();
    if (dateValue instanceof Date) return dateValue;

    const raw = String(dateValue).trim();
    if (!raw) return new Date();

    const yyyyMmDd = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (yyyyMmDd) {
        const year = Number(yyyyMmDd[1]);
        const month = Number(yyyyMmDd[2]) - 1;
        const day = Number(yyyyMmDd[3]);
        return new Date(year, month, day);
    }

    const dateTime = raw.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (dateTime) {
        const year = Number(dateTime[1]);
        const month = Number(dateTime[2]) - 1;
        const day = Number(dateTime[3]);
        const hour = Number(dateTime[4]);
        const minute = Number(dateTime[5]);
        const second = Number(dateTime[6] || 0);
        return new Date(year, month, day, hour, minute, second);
    }

    const parsed = new Date(raw.replace(' ', 'T'));
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

/**
 * Formats a date as DD/MM/YYYY
 */
export const formatDateDMY = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};

/**
 * Parses a DD/MM/YYYY formatted string to a Date object
 * Returns null if the string doesn't match the format or is invalid
 */
export const parseDateDMY = (str) => {
    if (!str) return null;
    const m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return null;
    const day = Number(m[1]);
    const month = Number(m[2]) - 1;
    const year = Number(m[3]);
    const d = new Date(year, month, day);
    if (d.getFullYear() !== year || d.getMonth() !== month || d.getDate() !== day) return null;
    return d;
};

/**
 * Extracts just the date part (YYYY-MM-DD) from a date value
 */
export const getDatePart = (dateValue) => {
    if (!dateValue) return '';
    if (typeof dateValue === 'string') {
        const raw = dateValue.trim();
        const dateOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (dateOnly) return `${dateOnly[1]}-${dateOnly[2]}-${dateOnly[3]}`;

        const dateTime = raw.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::\d{2})?$/);
        if (dateTime) return `${dateTime[1]}-${dateTime[2]}-${dateTime[3]}`;
    }

    const parsed = stringToDate(dateValue);
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Extracts just the time part (HH:mm) from a date value
 */
export const getTimePart = (dateValue) => {
    if (!dateValue) return '';
    if (typeof dateValue === 'string') {
        const raw = dateValue.trim();
        const dateTime = raw.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::\d{2})?$/);
        if (dateTime) return `${dateTime[4]}:${dateTime[5]}`;
    }

    const parsed = stringToDate(dateValue);
    if (Number.isNaN(parsed.getTime())) return '';
    const hours = String(parsed.getHours()).padStart(2, '0');
    const minutes = String(parsed.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};

/**
 * Builds a complete datetime string from date and time parts
 * datePart should be in YYYY-MM-DD format
 * timePart should be in HH:mm format
 * If timePart is empty, defaults to 00:00:00 for consistency
 */
export const buildDateTime = (datePart, timePart) => {
    if (!datePart) return '';
    // If no time specified, use default 00:00:00 for consistency
    if (!timePart) return `${datePart} 00:00:00`;
    return `${datePart} ${timePart}:00`;
};
