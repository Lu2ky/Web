import { Routes, Route } from "react-router-dom";
import LogInForm from "./LogInForm";
import RecoverPassword from "./RecoverPassword";
import AdminView from "./AdminView";
import RestorePassword from "./RestorePassword";
import TokenPassword from "./TokenPassword";
import LegalDocumentsView from "./LegalDocumentsView";
import ProtectedRoute from "./ProtectedRoute";
import PublicOnlyRoute from "./PublicOnlyRoute";
import "./SessionTimeoutModal.css";
import { ROLE_ADMIN, ROLE_USUARIOS } from "../services/authSession";
import AppWithOnboarding from "./AppOnboarding";

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