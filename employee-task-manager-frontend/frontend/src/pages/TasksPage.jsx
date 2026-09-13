import { useCallback, useEffect, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Paper from '@mui/material/Paper'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Tooltip from '@mui/material/Tooltip'
import AddIcon from '@mui/icons-material/Add'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import ChecklistIcon from '@mui/icons-material/ChecklistRtl'

import { listTasks, createTask, updateTask, deleteTask } from '../api/tasks.js'
import { errorMessage } from '../api/client.js'
import StatusChip from '../components/StatusChip.jsx'
import TaskFormDialog from '../components/TaskFormDialog.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
]

export default function TasksPage() {
  const { isManager } = useAuth()
  const [tasks, setTasks] = useState([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async (status) => {
    setLoading(true)
    setError('')
    try {
      const data = await listTasks(status || undefined)
      setTasks(data)
    } catch (err) {
      setError(errorMessage(err, 'Could not load tasks.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(filter)
  }, [filter, load])

  const openCreate = () => {
    setEditingTask(null)
    setFormOpen(true)
  }

  const openEdit = (task) => {
    setEditingTask(task)
    setFormOpen(true)
  }

  const handleFormSubmit = async (form) => {
    if (editingTask) {
      const updated = await updateTask(editingTask.id, form)
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    } else {
      const created = await createTask(form)
      setTasks((prev) => [created, ...prev])
    }
    setFormOpen(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteTask(deleteTarget.id)
      setTasks((prev) => prev.filter((t) => t.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      setError(errorMessage(err, 'Could not delete the task.'))
    } finally {
      setDeleting(false)
    }
  }

  const emptyMessage = useMemo(() => {
    if (filter) return `No ${FILTERS.find((f) => f.value === filter)?.label.toLowerCase()} tasks.`
    return isManager ? 'No tasks have been created yet.' : "You don't have any tasks yet."
  }, [filter, isManager])

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4">{isManager ? 'All tasks' : 'My tasks'}</Typography>
          <Typography variant="body2" color="text.secondary">
            {isManager ? 'Everything the team is working on.' : 'What you own right now.'}
          </Typography>
        </Box>
        <Button variant="contained" disableElevation startIcon={<AddIcon />} onClick={openCreate}>
          New task
        </Button>
      </Stack>

      <Tabs
        value={filter}
        onChange={(_, v) => setFilter(v)}
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        {FILTERS.map((f) => (
          <Tab key={f.value || 'all'} value={f.value} label={f.label} />
        ))}
      </Tabs>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : tasks.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <ChecklistIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
          <Typography variant="subtitle1" fontWeight={600}>
            {emptyMessage}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create a task to get started.
          </Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={openCreate}>
            New task
          </Button>
        </Paper>
      ) : (
        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <List disablePadding>
            {tasks.map((task, idx) => (
              <Box key={task.id}>
                {idx > 0 && <Divider component="li" />}
                <ListItem
                  sx={{ py: 2, px: 3 }}
                  secondaryAction={
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Edit">
                        <IconButton edge="end" onClick={() => openEdit(task)}>
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton edge="end" onClick={() => setDeleteTarget(task)}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  }
                >
                  <ListItemText
                    disableTypography
                    primary={
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {task.title}
                        </Typography>
                        <StatusChip status={task.status} />
                        {isManager && (
                          <Typography variant="caption" color="text.secondary">
                            #{task.user_id}
                          </Typography>
                        )}
                      </Stack>
                    }
                    secondary={
                      task.description ? (
                        <Typography variant="body2" color="text.secondary" sx={{ pr: 6 }}>
                          {task.description}
                        </Typography>
                      ) : null
                    }
                  />
                </ListItem>
              </Box>
            ))}
          </List>
        </Paper>
      )}

      <TaskFormDialog
        open={formOpen}
        task={editingTask}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this task?"
        description={`"${deleteTarget?.title}" will be removed permanently. This can't be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </Box>
  )
}
