import { Icon } from "./IconSystem";
import "./DuplicateButton.css";

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
			<Icon name="duplicate" size="sm" aria-hidden="true" />
		</button>
	);
}