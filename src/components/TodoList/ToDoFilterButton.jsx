import React from 'react';
import { FaFilter } from "react-icons/fa";
import "../../styles/ToDoFilterButton.css";

export default function ToDoFilterButton({ onClick }) {
    const handleClick = () => {
        window.dispatchEvent(new CustomEvent("onboarding:todo-filter-opened"));
        onClick?.();
    };

    return (
        <button 
            className="todo-filter-button" 
            onClick={handleClick}
            title="Filtrar"
            data-onboarding-id="todo-filter-button"
        >
            <FaFilter className="todo-filter-icon" />
        </button>
    );
}