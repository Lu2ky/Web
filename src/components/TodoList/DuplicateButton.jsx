import "../../styles/DuplicateButton.css";

export default function DuplicateButton({
	onClick = () => {},
	title = "Duplicar",
	className = ""
}) {
	return (
		<button
			className={`duplicate-button ${className}`.trim()}
			onClick={onClick}
			title={title}
			aria-label={title}
			type="button"
		>
			<svg
				width="48"
				height="48"
				viewBox="0 0 48 48"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
			>
				<path
					d="M12 8H32C34.2091 8 36 9.79086 36 12V32M16 16H36C38.2091 16 40 17.7909 40 20V40C40 42.2091 38.2091 44 36 44H16C13.7909 44 12 42.2091 12 40V20C12 17.7909 13.7909 16 16 16Z"
					stroke="#333333"
					strokeWidth="4"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		</button>
	);
}