import "../../styles/DuplicateButton.css";

export default function DuplicateButton({
	onClick = () => {},
	title = "Duplicar",
	className = "",
	dataOnboardingId
}) {
	return (
		<button
			className={`duplicate-button ${className}`.trim()}
			onClick={onClick}
			title={title}
			aria-label={title}
			type="button"
			data-onboarding-id={dataOnboardingId}
		>
			<svg
				width="24"  
				height="24" 
				viewBox="0 0 24 24" 
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
			>
				<rect x="9" y="9" width="13" height="13" rx="1" stroke="#333333" strokeWidth="2"/>
				<path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
			</svg>
		</button>
	);
}