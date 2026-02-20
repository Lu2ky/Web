import React from 'react';
import { FaFilter } from "react-icons/fa";
import "../../styles/ToDoFilterButton.css";

export default function ToDoFilterButton({ onClick }) {
    return (
        <button 
            className="todo-filter-button" 
            onClick={onClick}
            title="Filtrar"
        >
            <FaFilter className="todo-filter-icon" />
        </button>
    );
}