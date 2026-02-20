import { useState, useEffect, useRef } from "react";
import { FaFilter } from "react-icons/fa";
import "../styles/FilterButton.css";
import { getCategories } from "./categoriesService";

function FilterButton({ selectedTag, setSelectedTag }) {
    const [isOpen, setIsOpen] = useState(false);
    const [categories, setCategories] = useState([]);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const loadCategories = async () => {
            const data = await getCategories();
            setCategories(data);
        };
        loadCategories();
    }, []);


    const handleSelect = (category) => {
        setSelectedTag(category);
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="filterContainer" ref={dropdownRef}>
            <button
                className="filterButton"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <FaFilter className="filterIcon" />
                Filtrar: {selectedTag}
            </button>

            {isOpen && (
                <ul className="filterMenu">
                    {categories.map((category) => (
                        <li key={category}>
                            <button
                                className={`filterOption ${selectedTag === category ? "selected" : ""}`}
                                onClick={() => handleSelect(category)}
                            >
                                {category}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default FilterButton;