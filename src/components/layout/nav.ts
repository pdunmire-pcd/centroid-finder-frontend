// Which nav tab is active for a URL. The Analyze and old Preview pages
// belong to "Videos" because you get there by picking a video.
export function activeTab(pathname: string): 'videos' | 'jobs' | false {
  if (pathname.startsWith('/jobs')) return 'jobs'
  if (
    pathname.startsWith('/videos') ||
    pathname.startsWith('/analyze') ||
    pathname.startsWith('/preview')
  ) {
    return 'videos'
  }
  return false
}
