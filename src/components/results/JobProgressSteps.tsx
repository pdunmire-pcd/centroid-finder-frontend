import { Step, StepLabel, Stepper, Typography } from '@mui/material'
import type { JobRecord } from '../../types'

const STEPS = ['Started', 'Processing', 'Results ready']

// Started → Processing → Results ready. A failed job marks "Processing" red
// and shows the server's error message under it.
export function JobProgressSteps({ job }: { job: JobRecord }) {
  // activeStep = how many steps are finished; 3 means all done
  const activeStep = job.status === 'done' ? 3 : 1
  const failed = job.status === 'error'

  return (
    <Stepper activeStep={activeStep} alternativeLabel data-cy="job-steps" sx={{ py: 1 }}>
      {STEPS.map((label, index) => {
        const isFailedStep = failed && index === 1
        return (
          <Step key={label} completed={index < activeStep && !isFailedStep}>
            <StepLabel
              error={isFailedStep}
              optional={
                isFailedStep ? (
                  <Typography variant="caption" color="error">
                    {job.error ?? 'Processing failed'}
                  </Typography>
                ) : index === 1 && job.status === 'processing' ? (
                  <Typography variant="caption" color="text.secondary">
                    Running… this page updates by itself
                  </Typography>
                ) : undefined
              }
            >
              {isFailedStep ? 'Failed' : label}
            </StepLabel>
          </Step>
        )
      })}
    </Stepper>
  )
}
