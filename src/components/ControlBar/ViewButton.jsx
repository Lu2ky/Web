// ============================================================================
// Componente ViewButton
// ============================================================================
// Botón toggle segmentado para cambiar vista del calendario.
// Alterna entre vista semanal y diaria con indicador visual.
// ============================================================================

import "../../styles/ControlBar/ViewButton.css";

const options = ["Semanal", "Diario"];

function ViewButton({viewMode, setViewMode}) {
	// El indicador visual se mueve entre opciones según la selección
	const selected = options.indexOf(viewMode);

	return (
		<div className="segmented" data-onboarding-id="view-toggle">
			<div
				className="indicator"
				style={{transform: `translateX(${selected * 100}%)`}}
			/>
			{options.map((option, index) => (
				<button
					key={option}
					className={index === selected ? "active" : ""}
					onClick={() => {
						setViewMode(option);
						window.dispatchEvent(new CustomEvent("onboarding:view-changed"));
					}}
					title={`Vista ${option}`}
					type="button"
				>
					{option}
				</button>
			))}
		</div>
	);
}
export default ViewButton;
