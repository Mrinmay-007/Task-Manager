import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'

import { useAuth } from '../context/AuthContext.jsx'
import { errorMessage } from '../api/client.js'

export default function ProfilePage() {
  const { user, isManager, updateProfile } = useAuth()
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const initials = (user?.name || '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const handleChange = (field) => (e) => {
    setSuccess(false)
    setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await updateProfile(form)
      setSuccess(true)
    } catch (err) {
      setError(errorMessage(err, 'Could not update your profile.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Profile
      </Typography>

      <Paper variant="outlined" sx={{ p: { xs: 3, sm: 4 }, borderRadius: 3, maxWidth: 520 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Avatar sx={{ width: 56, height: 56, bgcolor: 'secondary.main', color: '#0B241F', fontWeight: 700 }}>
            {initials}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {user?.name}
            </Typography>
            <Chip
              label={isManager ? 'Manager' : 'Employee'}
              size="small"
              color={isManager ? 'secondary' : 'default'}
              sx={{ mt: 0.5 }}
            />
          </Box>
        </Stack>

        <Divider sx={{ mb: 3 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Profile updated.
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2.25}>
            <TextField label="Full name" value={form.name} onChange={handleChange('name')} fullWidth required />
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              fullWidth
              required
            />
            <Box>
              <Button type="submit" variant="contained" disableElevation disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </Box>
          </Stack>
        </Box>
      </Paper>
    </Box>
  )
}
