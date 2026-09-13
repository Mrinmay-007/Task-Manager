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
import PlayArrowIcon from '@mui/icons-material/PlayArrowRounded'
import FlagIcon from '@mui/icons-material/FlagRounded'
import VerifiedIcon from '@mui/icons-material/VerifiedRounded'
import { listUsers } from '../api/users.js'

import { listTasks, createTask, updateTask, requestTaskCompletion, deleteTask } from '../api/tasks.js'
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
  const { isManager, user: currentUser } = useAuth()
  const [employees, setEmployees] = useState([])

  const [tasks, setTasks] = useState([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  // FIX (BUG): tracks which single task row has a workflow action (Start /
  // Finish / Verify) in flight, so we can disable just that button instead
  // of nothing at all, and avoid double-submits from a slow click.
  const [actionTaskId, setActionTaskId] = useState(null)

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

  useEffect(() => {
    if (!isManager) return
    listUsers()
      .then((users) =>
        setEmployees(users.filter((user) => user.role !== 'manager' || user.id === currentUser?.id)),
      )
      .catch((err) => setError(errorMessage(err, 'Could not load employees.')))
  }, [isManager, currentUser?.id])

  const openCreate = () => {
    setEditingTask(null)
    setFormOpen(true)
  }

  const openEdit = (task) => {
    setEditingTask(task)
    setFormOpen(true)
  }

  const handleFormSubmit = async (form) => {
    const payload = {
      ...form,
      assignee_id: form.assignee_id ? Number(form.assignee_id) : undefined,
    }
    if (editingTask) {
      const updated = await updateTask(editingTask.id, payload)
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    } else {
      const created = await createTask(payload)
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

  // FIX (BUG - CRITICAL): these three handlers used to be declared *inside*
  // handleDelete (one of them nested two levels deep), so they never
  // actually existed in this component's scope. Every click on "Start
  // task" / "Finish" / "Verify" threw `ReferenceError: ... is not defined`
  // — which is why the star -> in progress -> finish -> verify workflow
  // looked completely broken. They're now top-level functions of
  // TasksPage, exactly like handleDelete and handleFormSubmit.

  // Employee: pending assigned task -> "Start task" -> in_progress.
  // (This is the "click the star/start" step from the request.)
  const handleStartTask = async (task) => {
    setActionTaskId(task.id)
    setError('')
    try {
      const updated = await updateTask(task.id, { status: 'in_progress' })
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    } catch (err) {
      setError(errorMessage(err, 'Could not start the task.'))
    } finally {
      setActionTaskId(null)
    }
  }

  // Employee: in-progress assigned task -> "Finish" -> flags it for the
  // manager to verify (completion_requested = true; status stays
  // in_progress until the manager approves it).
  const handleRequestCompletion = async (task) => {
    setActionTaskId(task.id)
    setError('')
    try {
      const updated = await requestTaskCompletion(task.id)
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    } catch (err) {
      setError(errorMessage(err, 'Could not mark the task as finished.'))
    } finally {
      setActionTaskId(null)
    }
  }

  // Manager: a task flagged "finished" -> "Verify" -> completed.
  const handleApproveCompletion = async (task) => {
    setActionTaskId(task.id)
    setError('')
    try {
      const updated = await updateTask(task.id, { status: 'completed' })
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    } catch (err) {
      setError(errorMessage(err, 'Could not verify the task.'))
    } finally {
      setActionTaskId(null)
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
          <Typography variant="h4">{isManager ? 'My and assigned tasks' : 'My tasks'}</Typography>
          <Typography variant="body2" color="text.secondary">
            {isManager ? 'Your tasks and tasks you assigned to employees.' : 'What you own right now.'}
          </Typography>
        </Box>
        {/* CHANGED: only managers can create tasks now, so this button is
            hidden entirely for employees rather than letting them open a
            form that would fail on submit. */}
        {isManager && (
          <Button variant="contained" disableElevation startIcon={<AddIcon />} onClick={openCreate}>
            New task
          </Button>
        )}
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
            {isManager ? 'Create a task to get started.' : "Once your manager assigns you a task, it'll show up here."}
          </Typography>
          {isManager && (
            <Button variant="outlined" startIcon={<AddIcon />} onClick={openCreate}>
              New task
            </Button>
          )}
        </Paper>
      ) : (
        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <List disablePadding>
            {tasks.map((task, idx) => {
              const isAssigned = task.creator_id !== task.user_id
              const busy = actionTaskId === task.id
              return (
                <Box key={task.id}>
                  {idx > 0 && <Divider component="li" />}
                  <ListItem
                    sx={{ py: 2, px: 3 }}
                    secondaryAction={
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        {isManager && task.completion_requested && (
                          <Button
                            size="small"
                            variant="contained"
                            disableElevation
                            color="secondary"
                            startIcon={<VerifiedIcon />}
                            onClick={() => handleApproveCompletion(task)}
                            disabled={busy}
                          >
                            Verify
                          </Button>
                        )}
                        {!isManager && isAssigned && task.status === 'pending' && (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<PlayArrowIcon />}
                            onClick={() => handleStartTask(task)}
                            disabled={busy}
                          >
                            Start task
                          </Button>
                        )}
                        {!isManager && isAssigned && task.status === 'in_progress' && !task.completion_requested && (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<FlagIcon />}
                            onClick={() => handleRequestCompletion(task)}
                            disabled={busy}
                          >
                            Finish
                          </Button>
                        )}
                        {(isManager || !isAssigned) && (
                          <>
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
                          </>
                        )}
                      </Stack>
                    }
                  >
                    <ListItemText
                      disableTypography
                      primary={
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5, flexWrap: 'wrap', rowGap: 0.5 }}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {task.title}
                          </Typography>
                          <StatusChip status={task.status} completionRequested={task.completion_requested} />
                          {isManager && (
                            <Typography variant="caption" color="text.secondary">
                              {task.user_id === currentUser?.id ? 'Your task' : `Assigned to #${task.user_id}`}
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
              )
            })}
          </List>
        </Paper>
      )}

      <TaskFormDialog
        open={formOpen}
        task={editingTask}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        isManager={isManager}
        employees={employees}
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
