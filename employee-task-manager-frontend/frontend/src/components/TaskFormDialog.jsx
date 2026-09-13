import { useEffect, useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import { errorMessage } from '../api/client.js'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
]

// const emptyForm = { title: '', description: '', status: 'pending' }
const emptyForm = { title: '', description: '', status: 'pending', assignee_id: '' }

export default function TaskFormDialog({ open, task, onClose, onSubmit, isManager, employees }) {

// export default function TaskFormDialog({ open, task, onClose, onSubmit }) {
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(
        task
             ? {
              title: task.title,
              description: task.description || '',
              status: task.status,
              assignee_id: task.user_id || '',
            }
          : emptyForm,
      )
      setError('')
    }
  }, [open, task])

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setError('Give the task a title before saving.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await onSubmit(form)
    } catch (err) {
      setError(errorMessage(err, 'Could not save the task.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{task ? 'Edit task' : 'New task'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Title"
            value={form.title}
            onChange={handleChange('title')}
            autoFocus
            fullWidth
            required
          />
          <TextField
            label="Description"
            value={form.description}
            onChange={handleChange('description')}
            multiline
            minRows={3}
            fullWidth
          />
          <TextField
            label="Status"
            select
            value={form.status}
            onChange={handleChange('status')}
            fullWidth
          >
            {STATUS_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
          {isManager && (
            <TextField
              label="Assign to"
              select
              value={form.assignee_id}
              onChange={handleChange('assignee_id')}
              fullWidth
            >
              {employees.map((employee) => (
                <MenuItem key={employee.id} value={employee.id}>
                  {employee.name} ({employee.email})
                </MenuItem>
              ))}
            </TextField>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disableElevation disabled={submitting}>
          {task ? 'Save changes' : 'Create task'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
