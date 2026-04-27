import { useState, useEffect } from "react";
import { FaFilter } from "react-icons/fa";
import "../../styles/ControlBar/FilterButton.css";
import DropdownBase from "../DropdownBase/DropdownBase";
import { getCategories } from "../../services/categoriesService";

function FilterButton({ selectedTag, setSelectedTag }) {
	const [categories, setCategories] = useState([]);
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		const loadCategories = async () => {
			const data = await getCategories();
			setCategories(["Todos", ...data]);
		};
		loadCategories();
	}, []);

	const handleSelect = (category) => {
		window.dispatchEvent(new CustomEvent("onboarding:calendar-filter-option-selected"));
		setSelectedTag(category);
	};

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
		<DropdownBase
			open={isOpen}
			onOpenChange={(nextState, reason) => {
				setIsOpen(nextState);
				if (nextState && reason === "trigger") {
					window.dispatchEvent(new CustomEvent("onboarding:calendar-filter-opened"));
				}
			}}
			roleMode="menu"
			className="controlBarDropdownRoot controlBarDropdownRoot--filter"
			menuClassName="controlBarDropdownMenu controlBarDropdownMenu--filter"
			trigger={({ ref, onClick, ...triggerProps }) => (
				<button
					ref={ref}
					className="controlBarDropdownTrigger controlBarDropdownTrigger--filter"
					onClick={onClick}
					title="Filtrar actividades"
					type="button"
					data-onboarding-id="calendar-filter-button"
					{...triggerProps}
				>
					<FaFilter className="controlBarDropdownIcon" />
					<span>Filtrar: {selectedTag}</span>
				</button>
			)}
		>
			{({ select }) => (
				<ul className="controlBarDropdownList" data-onboarding-id="calendar-filter-menu">
					{categories.map((category) => (
						<li key={category}>
							<button
								className={`controlBarDropdownOption ${selectedTag === category ? "is-selected" : ""}`}
								onClick={() => {
									handleSelect(category);
									select();
								}}
								title={`Filtrar por ${category}`}
								type="button"
							>
								{category}
							</button>
						</li>
					))}
				</ul>
			)}
		</DropdownBase>
	);
}

export default FilterButton;
