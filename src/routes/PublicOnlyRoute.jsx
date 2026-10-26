import { Navigate, Outlet } from "react-router-dom";
import {
    clearAuthSession,
    getHomeRouteByRole,
    isAuthenticated
} from "../services/authSession";

export default function PublicOnlyRoute() {
    if (!isAuthenticated()) {
        return <Outlet />;
    }

    const homeRoute = getHomeRouteByRole();
    if (homeRoute === "/") {
        // Evita loop de redirección cuando hay sesión sin rol válido.
        clearAuthSession();
        return <Outlet />;
    }

    return <Navigate to={homeRoute} replace />;
}
