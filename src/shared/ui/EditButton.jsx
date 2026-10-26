import { Icon } from "./IconSystem";
import "./EditButton.css";

export default function EditButton({
	onClick  = () => {},
	title = "Editar",
	className = "",
	dataOnboardingId
}) {
	return (
		<button
			className={`edit-button ${className}`.trim()}
			onClick={onClick}
			title={title}
			aria-label={title}
			type="button"
			data-onboarding-id={dataOnboardingId}
		>
			<Icon name="edit" size="sm" aria-hidden="true" />
		</button>
	);
}
