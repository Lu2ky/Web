import { useState, useEffect } from 'react';

/**
 * Custom hook para debounce - ideal para inputs en conexiones lentas
 * @param {*} value - Valor a debounce
 * @param {number} delay - Delay en milisegundos (default 300ms)
 * @returns {*} Valor debounceado
 */
export function useDebounce(value, delay = 300) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Hook para input instantáneo (local) con debounce para efectos secundarios
 * Retorna [valor local, valor debounceado, handler onChange]
 */
export function useInputWithDebounce(initialValue = '', delay = 300) {
    const [localValue, setLocalValue] = useState(initialValue);
    const debouncedValue = useDebounce(localValue, delay);

    const handleChange = (e) => {
        setLocalValue(e.target.value);
    };

    return {
        value: localValue,
        debouncedValue,
        handleChange,
        setValue: setLocalValue,
    };
}
