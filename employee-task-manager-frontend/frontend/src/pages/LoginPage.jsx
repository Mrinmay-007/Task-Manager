import { useState } from 'react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import Link from '@mui/material/Link'
import Collapse from '@mui/material/Collapse'
import ChecklistIcon from '@mui/icons-material/ChecklistRtl'
import { useAuth } from '../context/AuthContext.jsx'
import { errorMessage } from '../api/client.js'
import AuthLayout from '../components/AuthLayout.jsx'

// Update this text to change the instructions shown by the Manual option.
const MANUAL_INSTRUCTION =
  'For testing purposes, you can use the following credentials:\n\nEmail: admin@example.com\nPassword: 123456789\n\nIf you do not have an account, please register first.'


export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showManual, setShowManual] = useState(false)

  const from = location.state?.from?.pathname || '/tasks'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(errorMessage(err, 'Incorrect email or password.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <Stack spacing={0.5} sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1 }}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: '9px',
              bgcolor: 'secondary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChecklistIcon sx={{ color: '#0B241F' }} />
          </Box>
          <Typography variant="h6" fontWeight={700}>
            Taskboard
          </Typography>
        </Box>
        <Typography variant="h4">Welcome back</Typography>
        <Typography variant="body2" color="text.secondary">
          Sign in to see your tasks.
        </Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2.25}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            autoFocus
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
          />
          <Button type="submit" variant="contained" size="large" disableElevation disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
          <Button
            type="button"
            variant="text"
            size="small"
            onClick={() => setShowManual((visible) => !visible)}
            aria-expanded={showManual}
            aria-controls="manual-instructions"
          >
            Manual
          </Button>
          <Collapse in={showManual}>
            <Alert id="manual-instructions" severity="info">
              {MANUAL_INSTRUCTION}
            </Alert>
          </Collapse>
        </Stack>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
        New here?{' '}
        <Link component={RouterLink} to="/register" fontWeight={600}>
          Create an account
        </Link>
      </Typography>
    </AuthLayout>
  )
}
