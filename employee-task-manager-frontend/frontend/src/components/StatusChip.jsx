import Chip from '@mui/material/Chip'
import { statusColors } from '../theme.js'

export default function StatusChip({ status, size = 'small' }) {
  const s = statusColors[status] || statusColors.pending
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
