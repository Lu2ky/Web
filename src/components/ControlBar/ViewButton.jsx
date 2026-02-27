import "../../styles/ViewButton.css";

function ViewButton({viewMode, setViewMode, options = ["Semanal", "Diario"]}) {
	const selectedIndex = options.indexOf(viewMode);
	const percentage = 100 / options.length;
	return (
		<div className="segmented">
			<div
				className="indicator"
				style={{width: `${percentage}%`,
					transform: `translateX(${selectedIndex * 100}%)`}}
			/>
			{options.map((option, index) => (
				<button
					key={option}
					className={index === selected ? "active" : ""}
					onClick={() => setViewMode(option)}
				>
					{option}
				</button>
			))}
		</div>
	);
}
export default ViewButton;
