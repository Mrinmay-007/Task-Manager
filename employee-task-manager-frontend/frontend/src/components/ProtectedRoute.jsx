import { Navigate, Outlet, useLocation } from 'react-router-dom'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ managerOnly = false }) {
  const { isAuthenticated, isManager, initializing } = useAuth()
  const location = useLocation()

  if (initializing) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (managerOnly && !isManager) {
    return <Navigate to="/tasks" replace />
  }

  return <Outlet />
}
