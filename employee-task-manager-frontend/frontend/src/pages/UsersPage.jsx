import { useCallback, useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import TableBody from '@mui/material/TableBody'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Tooltip from '@mui/material/Tooltip'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'

import { listUsers, updateUser, updateUserRole, deleteUser } from '../api/users.js'
import { errorMessage } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'

function initialsOf(name) {
  return (name || '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function UsersPage() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [editing, setEditing] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', email: '' })
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  // ADDED: which user's role change is in flight, for a small inline spinner
  // state on that row's chip instead of a full-page loading state.
  const [roleChangingId, setRoleChangingId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await listUsers()
      setUsers(data)
    } catch (err) {
      setError(errorMessage(err, 'Could not load the team.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openEdit = (u) => {
    setEditing(u)
    setEditForm({ name: u.name, email: u.email })
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const updated = await updateUser(editing.id, editForm)
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
      setEditing(null)
    } catch (err) {
      setError(errorMessage(err, 'Could not update this person.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteUser(deleteTarget.id)
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      setError(errorMessage(err, 'Could not remove this person.'))
    } finally {
      setDeleting(false)
    }
  }

  // ADDED: promote/demote via the new manager-only /user/{id}/role endpoint.
  const handleToggleRole = async (u) => {
    const nextRole = u.role === 'manager' ? 'user' : 'manager'
    setRoleChangingId(u.id)
    setError('')
    try {
      const updated = await updateUserRole(u.id, nextRole)
      setUsers((prev) => prev.map((usr) => (usr.id === updated.id ? updated : usr)))
    } catch (err) {
      setError(errorMessage(err, "Could not change this person's role."))
    } finally {
      setRoleChangingId(null)
    }
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Team
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Everyone with an account. Manager-only view.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: 'primary.light' }}>
                        {initialsOf(u.name)}
                      </Avatar>
                      <Typography variant="body2" fontWeight={600}>
                        {u.name}
                        {u.id === me?.id && (
                          <Typography component="span" variant="caption" color="text.secondary">
                            {' '}
                            (you)
                          </Typography>
                        )}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {u.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={u.id === me?.id ? "You can't change your own role here" : `Click to ${u.role === 'manager' ? 'demote to employee' : 'promote to manager'}`}>
                      <span>
                        <Chip
                          label={u.role === 'manager' ? 'Manager' : 'Employee'}
                          size="small"
                          color={u.role === 'manager' ? 'secondary' : 'default'}
                          onClick={u.id === me?.id ? undefined : () => handleToggleRole(u)}
                          disabled={roleChangingId === u.id}
                          clickable={u.id !== me?.id}
                        />
                      </span>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEdit(u)}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={u.id === me?.id ? "You can't remove your own account here" : 'Remove'}>
                      <span>
                        <IconButton
                          size="small"
                          disabled={u.id === me?.id}
                          onClick={() => setDeleteTarget(u)}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Dialog open={!!editing} onClose={() => setEditing(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit team member</DialogTitle>
        <DialogContent>
          <Stack spacing={2.25} sx={{ mt: 1 }}>
            <TextField
              label="Full name"
              value={editForm.name}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Email"
              value={editForm.email}
              onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setEditing(null)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" disableElevation onClick={handleSave} disabled={saving}>
            Save changes
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove this person?"
        description={`${deleteTarget?.name} will lose access and their tasks will be deleted. This can't be undone.`}
        confirmLabel="Remove"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </Box>
  )
}
