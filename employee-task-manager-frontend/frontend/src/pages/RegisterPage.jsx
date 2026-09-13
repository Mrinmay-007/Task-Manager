import { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import Link from '@mui/material/Link'
import ChecklistIcon from '@mui/icons-material/ChecklistRtl'
import { useAuth } from '../context/AuthContext.jsx'
import { errorMessage } from '../api/client.js'
import AuthLayout from '../components/AuthLayout.jsx'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await register(form)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 900)
    } catch (err) {
      setError(errorMessage(err, 'Could not create your account.'))
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
        <Typography variant="h4">Create your account</Typography>
        <Typography variant="body2" color="text.secondary">
          New accounts start as an employee. A manager can promote you later.
        </Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Account created. Redirecting to sign in…
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2.25}>
          <TextField
            label="Full name"
            value={form.name}
            onChange={handleChange('name')}
            required
            fullWidth
            autoFocus
          />
          <TextField
            label="Email"
            type="email"
            value={form.email}
            onChange={handleChange('email')}
            required
            fullWidth
          />
          <TextField
            label="Password"
            type="password"
            value={form.password}
            onChange={handleChange('password')}
            required
            fullWidth
            helperText="Use at least 8 characters."
          />
          <Button type="submit" variant="contained" size="large" disableElevation disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create account'}
          </Button>
        </Stack>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
        Already have an account?{' '}
        <Link component={RouterLink} to="/login" fontWeight={600}>
          Sign in
        </Link>
      </Typography>
    </AuthLayout>
  )
}
