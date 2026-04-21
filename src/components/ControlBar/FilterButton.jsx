import {useState, useEffect, useRef} from "react";
import {FaFilter} from "react-icons/fa";
import "../../styles/ControlBar/FilterButton.css";
import {getCategories} from "../../services/categoriesService";

function FilterButton({selectedTag, setSelectedTag}) {
	const [isOpen, setIsOpen] = useState(false);
	const [categories, setCategories] = useState([]);
	const dropdownRef = useRef(null);

	useEffect(() => {
		const loadCategories = async () => {
			const data = await getCategories();
			setCategories(["Todos", ...data]);
		};
		loadCategories();
	}, []);

	const handleSelect = category => {
		window.dispatchEvent(new CustomEvent("onboarding:calendar-filter-option-selected"));
		setSelectedTag(category);
		setIsOpen(false);
	};

	useEffect(() => {
		const handleClickOutside = event => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setIsOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	useEffect(() => {
		const handleCloseUnrelatedUi = (event) => {
			const allowOpenUi = Array.isArray(event?.detail?.allowOpenUi) ? event.detail.allowOpenUi : [];
			if (!allowOpenUi.includes("dropdown-calendar-filter")) {
				setIsOpen(false);
			}
		};

		window.addEventListener("onboarding:close-unrelated-ui", handleCloseUnrelatedUi);
		return () => window.removeEventListener("onboarding:close-unrelated-ui", handleCloseUnrelatedUi);
	}, []);

	return (
		<div className="filterContainer" ref={dropdownRef}>
			<button
				className="filterButton"
				onClick={() => {
					setIsOpen(!isOpen);
					window.dispatchEvent(new CustomEvent("onboarding:calendar-filter-opened"));
				}}
				aria-expanded={isOpen}
				title="Filtrar actividades"
				type="button"
				data-onboarding-id="calendar-filter-button"
			>
				<FaFilter className="filterIcon" />
				Filtrar: {selectedTag}
			</button>

			{isOpen && (
				<ul className="filterMenu" data-onboarding-id="calendar-filter-menu">
					{categories.map(category => (
						<li key={category}>
							<button
								className={`filterOption ${selectedTag === category ? "selected" : ""}`}
								onClick={() => handleSelect(category)}
								title={`Filtrar por ${category}`}
								type="button"
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
