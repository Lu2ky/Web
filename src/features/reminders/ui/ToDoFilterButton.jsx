import React from 'react';
import { Icon } from "../../../shared/ui/IconSystem";
import "./ToDoFilterButton.css";

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
            <Icon name="filter" size="sm" aria-hidden="true" />
        </button>
    );
}