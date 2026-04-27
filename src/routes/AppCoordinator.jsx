import { HashRouter } from "react-router-dom";
import { SessionTimeoutManager } from "./SessionTimeoutManager";
import { getSessionConfig } from "../config/sessionConfig.js";
import RootRoutes from "./RootRoutes.jsx";

const sessionConfig = getSessionConfig();

export default function AppRoot() {
	return (
		<HashRouter>
			<SessionTimeoutManager 
				timeoutMinutes={sessionConfig.IDLE_TIMEOUT_MINUTES}
				warningMinutes={sessionConfig.WARNING_BEFORE_LOGOUT_MINUTES}
				showWarningModal={sessionConfig.SHOW_TIMEOUT_WARNING}
			>
				<RootRoutes />
			</SessionTimeoutManager>
		</HashRouter>
	);
}
