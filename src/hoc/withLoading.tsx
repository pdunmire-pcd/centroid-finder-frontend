import type { ComponentType } from 'react'
import { Alert, Box, CircularProgress } from '@mui/material'

// The extra props the wrapped component gets
export type WithLoadingProps = {
  loading: boolean
  error?: string | null
}

// Higher-order component: takes a component and returns a NEW component that
// shows a spinner while loading, an error message if something failed,
// and otherwise renders the original component with its normal props.
//
// Usage:
//   const VideoListWithLoading = withLoading(VideoList)
//   <VideoListWithLoading loading={loading} error={error} videos={videos} />
export function withLoading<P extends object>(Wrapped: ComponentType<P>) {
  function WithLoading({ loading, error, ...rest }: P & WithLoadingProps) {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress aria-label="Loading" />
        </Box>
      )
    }
    if (error) {
      return <Alert severity="error">{error}</Alert>
    }
    // rest is everything except loading/error, which is exactly P
    return <Wrapped {...(rest as P)} />
  }

  // Shows up as "withLoading(VideoList)" in React DevTools
  WithLoading.displayName = `withLoading(${Wrapped.displayName || Wrapped.name || 'Component'})`
  return WithLoading
}
