import { Box, Button, List, ListItem, Stack, TextField, Typography } from '@mui/material'
import { useState, type FormEvent } from 'react'
import type { ColorProfile } from '../../types'
import { ColorSwatch } from './ColorSwatch'

export type ColorProfilesProps = {
  profiles: ColorProfile[]
  /** save the current settings under this name */
  onSave: (name: string) => void
  onLoad: (profile: ColorProfile) => void
  onDelete: (name: string) => void
}

/** Save, load and delete named tracking colors. */
export function ColorProfiles({ profiles, onSave, onLoad, onDelete }: ColorProfilesProps) {
  const [name, setName] = useState('')
  const trimmed = name.trim()
  const replaces = profiles.some((profile) => profile.name === trimmed)

  function handleSubmit(event: FormEvent) {
    event.preventDefault() // stop the browser from reloading the page
    if (!trimmed) return
    onSave(trimmed)
    setName('')
  }

  return (
    <Stack spacing={1}>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
        <TextField
          size="small"
          label="Profile name"
          placeholder="e.g. Ensatina on pink"
          value={name}
          onChange={(event) => setName(event.target.value)}
          helperText={replaces ? 'A profile with this name exists and will be replaced.' : ' '}
          sx={{ flex: 1 }}
        />
        <Button type="submit" variant="outlined" disabled={!trimmed}>
          Save
        </Button>
      </Box>

      {profiles.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No saved profiles yet.
        </Typography>
      ) : (
        <List dense data-testid="profile-list">
          {profiles.map((profile) => (
            <ListItem
              key={profile.name}
              disableGutters
              secondaryAction={
                <>
                  <Button size="small" onClick={() => onLoad(profile)} aria-label={`Load profile ${profile.name}`}>
                    Load
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => onDelete(profile.name)}
                    aria-label={`Delete profile ${profile.name}`}
                  >
                    Delete
                  </Button>
                </>
              }
            >
              <ColorSwatch color={`#${profile.targetColor}`} />
              <Typography variant="body2" sx={{ ml: 1.5, mr: 18 }}>
                <strong>{profile.name}</strong> · #{profile.targetColor} · threshold {profile.threshold} ·{' '}
                {profile.samples.length} sample{profile.samples.length === 1 ? '' : 's'}
              </Typography>
            </ListItem>
          ))}
        </List>
      )}
    </Stack>
  )
}
