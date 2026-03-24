// Librerias para manejo de rutas y renderizado
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
// Componentes de la aplicación
import LogInForm from "./LogInForm";
import App from "./App"; 
import RecoverPassword from "./RecoverPassword";
import AdminView from "./AdminView";
import RestorePassword from "./RestorePassword";
import TokenPassword from "./TokenPassword";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicOnlyRoute from "./routes/PublicOnlyRoute";
import { SessionTimeoutManager } from "./components/SessionTimeoutManager";
import { getSessionConfig } from "./config/sessionConfig";
import { ROLE_ADMIN_UPB_PLANNER, ROLE_USUARIOS } from "./services/authSession";

import "./index.css";
import "./styles/SessionTimeoutModal.css";
// Renderizado de la aplicación con rutas definidas, solo se puede una ruta a la vez 
// Crea un root para renderizar la aplicación en el elemento con id "root"
// HashRouter evita 404 al recargar en servidores sin reescritura de rutas SPA
// Render() para renderizar los componentes según la ruta actual
// Routes es un contenedor que evalúa las rutas definidas y renderiza el componente correspondiente
// SessionTimeoutManager envuelve el router para gestionar la sesión idle timeout
const sessionConfig = getSessionConfig();

ReactDOM.createRoot(document.getElementById("root")).render( 
	<HashRouter>
		<SessionTimeoutManager 
			timeoutMinutes={sessionConfig.IDLE_TIMEOUT_MINUTES}
			warningMinutes={sessionConfig.WARNING_BEFORE_LOGOUT_MINUTES}
			showWarningModal={sessionConfig.SHOW_TIMEOUT_WARNING}
		>
			<Routes>
				{/* PublicOnlyRoute: solo permite entrar si NO hay sesión activa */}
				<Route element={<PublicOnlyRoute />}>
					{/* Pública para usuarios no autenticados */}
					<Route path="/" element={<LogInForm />} />
				</Route>
				{/* Públicas: recuperación y restauración de contraseña */}
				<Route path="/RecoverPassword" element={<RecoverPassword />} />
				{/* Protegida solo para Usuarios: sesión + userId URL debe coincidir */}
				<Route element={<ProtectedRoute requireMatchingUser={true} allowedRoles={[ROLE_USUARIOS]} />}>
					<Route path="/App/:userId" element={<App />} />
				</Route>
				{/* Protegida solo para admin_upb_planner */}
				<Route element={<ProtectedRoute allowedRoles={[ROLE_ADMIN_UPB_PLANNER]} />}>
					<Route path="/AdminView" element={<AdminView />} />
				</Route>
				<Route path="/RestorePassword" element={<RestorePassword />} />
				<Route path="/TokenPassword" element={<TokenPassword />} />
				{/* Fallback: cualquier ruta no definida va al login */}
				<Route path="*" element={<LogInForm />} />
			</Routes>
		</SessionTimeoutManager>
	</HashRouter>
);


