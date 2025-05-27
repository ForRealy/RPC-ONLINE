import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * A route wrapper that:
 * 1. Redirects to /login if not authenticated
 * 2. Redirects to /verify if authenticated but email not verified
 * 3. Otherwise renders its children (or nested <Outlet />)
 */
export default function PrivateRoute({ children }) {
  const { currentUser } = useAuth()

  if (!currentUser) {
    // Not logged in
    return <Navigate to="/login" />
  }

  if (!currentUser.emailVerified) {
    // Logged in but email not verified
    return <Navigate to="/verify" />
  }

  // All good!
  return children
}
