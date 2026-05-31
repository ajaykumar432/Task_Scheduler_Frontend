import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export default function ProtectedRoute() {
  const isAuthenticated = useAuthStore(
    (s) => s.isAuthenticated
  );

  const hasHydrated =
    useAuthStore.persist?.hasHydrated?.();

  if (!hasHydrated) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return isAuthenticated
    ? <Outlet />
    : <Navigate to="/login" replace />;
}