import { Routes, Route } from "react-router-dom";
import LogInForm from "../../pages/login/LoginPage";
import RecoverPassword from "../../pages/auth/RecoverPasswordPage";
import AdminView from "../../pages/admin/AdminPage";
import RestorePassword from "../../pages/auth/RestorePasswordPage";
import TokenPassword from "../../pages/auth/TokenPasswordPage";
import LegalDocumentsView from "../../pages/legal/LegalPage";
import ProtectedRoute from "./ProtectedRoute";
import PublicOnlyRoute from "./PublicOnlyRoute";
import "../../features/auth/ui/SessionTimeoutModal.css";
import { ROLE_ADMIN, ROLE_USUARIOS } from "../../shared/session/authSession";
import AppWithOnboarding from "./AppOnboarding";
import IconShowcase from "../../shared/ui/IconShowcase";

export default function RootRoutes() {
	return (
		<Routes>
			<Route element={<PublicOnlyRoute />}>
				<Route path="/" element={<LogInForm />} />
			</Route>

			<Route path="/IdRestore" element={<RecoverPassword />} />
			<Route path="/Legal" element={<LegalDocumentsView />} />
			<Route path="/RestorePassword" element={<RestorePassword />} />
			<Route path="/TokenPassword" element={<TokenPassword />} />
			<Route path="/icons" element={<IconShowcase />} />

			<Route element={<ProtectedRoute requireMatchingUser={true} allowedRoles={[ROLE_USUARIOS]} />}>
				<Route path="/Estudiante/:userId" element={<AppWithOnboarding />} />
			</Route>


			<Route element={<ProtectedRoute allowedRoles={[ROLE_ADMIN]} />}>
				<Route path="/Admin" element={<AdminView />} />
			</Route>

			<Route path="*" element={<LogInForm />} />
		</Routes>
	);
}