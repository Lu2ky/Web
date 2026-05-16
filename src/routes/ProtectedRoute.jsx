import { Navigate, Outlet, useParams } from "react-router-dom";
import {
    getAuthSession,
    getHomeRouteByRole,
    hasAnyRole,
    isAuthenticated
} from "../services/authSession";

export default function ProtectedRoute({ requireMatchingUser = false, allowedRoles = [] }) {
    if (!isAuthenticated()) {
        return <Navigate to="/" replace />;
    }

    if (!hasAnyRole(allowedRoles)) {
        return <Navigate to={getHomeRouteByRole()} replace />;
    }

    if (!requireMatchingUser) {
        return <Outlet />;
    }

    const { userId } = useParams();
    const session = getAuthSession();
    const routeUserId = String(userId || "").trim();

    if (!routeUserId || routeUserId !== session?.userId) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
