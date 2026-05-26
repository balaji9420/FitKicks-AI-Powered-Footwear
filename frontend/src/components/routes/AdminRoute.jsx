import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
    // TEMPORARY: allow all users during development
    const isAdmin = true;

    return isAdmin ? children : <Navigate to="/" replace />;
}