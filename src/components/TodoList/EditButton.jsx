import React from "react";
import "../../styles/EditButton.css";

export default function EditButton({
	onClick  = () => {},
	title = "Editar",
	className = ""
}) {
	return (
		<button
			className={`edit-button ${className}`.trim()}
			onClick={onClick}
			title={title}
			aria-label="Edit task"
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
					d="M7 42H41"
					stroke="#333333"
					strokeWidth="4"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				<path
					d="M11 26.7199V34H18.3172L39 13.3081L31.6919 6L11 26.7199Z"
					stroke="#333333"
					strokeWidth="4"
					strokeLinejoin="round"
				/>
			</svg>
		</button>
	);
}
