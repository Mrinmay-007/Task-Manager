import Chip from '@mui/material/Chip'
import { statusColors } from '../theme.js'

// FIX/ENHANCEMENT: previously a task the employee had "finished" still just
// showed the plain "In progress" chip, with a tiny separate caption for
// "Completion requested" — easy to miss. Per the requested workflow (star ->
// in progress -> finish -> manager verifies -> completed), a finished task
// now gets its own distinct "Finished" chip so it's obvious at a glance
// which tasks are waiting on a manager's verification.
const finishedStyle = { bg: '#F1E8FB', fg: '#6B3FA0', label: 'Finished — awaiting verification' }

export default function StatusChip({ status, completionRequested = false, size = 'small' }) {
  const s = completionRequested ? finishedStyle : statusColors[status] || statusColors.pending
  return (
    <Chip
      label={s.label}
      size={size}
      sx={{
        bgcolor: s.bg,
        color: s.fg,
        border: `1px solid ${s.fg}33`,
      }}
    />
  )
}
