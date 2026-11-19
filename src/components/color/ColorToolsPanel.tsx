import { Box, Divider, Stack, Typography } from '@mui/material'
import { useState, type ReactNode } from 'react'
import { useColorProfiles } from '../../hooks/useColorProfiles'
import type { ColorProfile, ColorSample } from '../../types'
import { ColorProfiles } from './ColorProfiles'
import { ColorSampler } from './ColorSampler'
import { RequestPreview } from './RequestPreview'
import { TargetColorFromSamples } from './TargetColorFromSamples'
import { ThresholdSuggestion } from './ThresholdSuggestion'
import { TrackingColorLegend } from './TrackingColorLegend'

export type ColorToolsPanelProps = {
  /** the frame on screen (thumbnail, paused video frame...); null while loading */
  frame: ImageData | null
  /** time of that frame in seconds */
  currentTime: number
  /** video name, for the API request preview */
  filename: string
  /** e.g. "#660005" */
  targetColor: string
  threshold: number
  onTargetColorChange: (hex: string) => void
  onThresholdChange: (threshold: number) => void
}

/** A titled step of the panel. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box component="section">
      <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 600, mb: 1 }}>
        {title}
      </Typography>
      {children}
    </Box>
  )
}

/**
 * Everything for choosing a tracking color in one panel: sample the animal,
 * use the samples' average color, apply the suggested threshold, save the
 * result as a profile, and see the exact request Process will send.
 */
export function ColorToolsPanel({
  frame,
  currentTime,
  filename,
  targetColor,
  threshold,
  onTargetColorChange,
  onThresholdChange,
}: ColorToolsPanelProps) {
  const [samples, setSamples] = useState<ColorSample[]>([])
  const { profiles, saveProfile, deleteProfile } = useColorProfiles()

  function handleSave(name: string) {
    saveProfile({ name, samples, targetColor: targetColor.replace('#', ''), threshold })
  }

  function handleLoad(profile: ColorProfile) {
    setSamples(profile.samples)
    onTargetColorChange(`#${profile.targetColor}`)
    onThresholdChange(profile.threshold)
  }

  return (
    <Stack spacing={2.5} divider={<Divider flexItem />} data-testid="color-tools">
      <Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Current tracking settings
        </Typography>
        <TrackingColorLegend targetColor={targetColor} threshold={threshold} />
      </Box>

      <Section title="1. Sample the animal">
        <ColorSampler frame={frame} currentTime={currentTime} samples={samples} onSamplesChange={setSamples} />
      </Section>

      <Section title="2. Tracking color from samples">
        <TargetColorFromSamples samples={samples} targetColor={targetColor} onUseColor={onTargetColorChange} />
      </Section>

      <Section title="3. Suggested threshold">
        <ThresholdSuggestion
          samples={samples}
          targetColor={targetColor}
          threshold={threshold}
          onApply={onThresholdChange}
        />
      </Section>

      <Section title="Saved color profiles">
        <ColorProfiles profiles={profiles} onSave={handleSave} onLoad={handleLoad} onDelete={deleteProfile} />
      </Section>

      <Section title="API request">
        <RequestPreview filename={filename} targetColor={targetColor} threshold={threshold} />
      </Section>
    </Stack>
  )
}
