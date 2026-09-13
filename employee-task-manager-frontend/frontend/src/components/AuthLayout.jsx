import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import useMediaQuery from '@mui/material/useMediaQuery'

export default function AuthLayout({ children }) {
  const showPanel = useMediaQuery('(min-width:900px)')

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {showPanel && (
        <Box
          sx={{
            width: '42%',
            bgcolor: 'primary.dark',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            p: 6,
          }}
        >
          <Typography variant="h6" fontWeight={700}>
            Taskboard
          </Typography>
          <Stack spacing={2} sx={{ maxWidth: 380 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.25 }}>
              Every task, owned by the right person.
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.72)' }}>
              Employees track their own work. Managers see the whole team's
              progress at a glance — nobody sees more than they should.
            </Typography>
          </Stack>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Employee Task Manager
          </Typography>
        </Box>
      )}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          bgcolor: 'background.default',
        }}
      >
        <Paper
          variant="outlined"
          sx={{ p: { xs: 3, sm: 5 }, width: '100%', maxWidth: 420, borderRadius: 3 }}
        >
          {children}
        </Paper>
      </Box>
    </Box>
  )
}
