import { Link as RouterLink } from 'react-router-dom'
import { Breadcrumbs, Link, Typography } from '@mui/material'

export type Crumb = {
  label: string
  /** leave out for the current page (the last crumb) */
  to?: string
}

// "Jobs / mock-job-123" style trail at the top of a page.
export function PageBreadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <Breadcrumbs aria-label="Breadcrumb" sx={{ mb: 1.5, fontSize: 14 }}>
      {items.map((item) =>
        item.to ? (
          <Link key={item.label} component={RouterLink} to={item.to} underline="hover" color="inherit">
            {item.label}
          </Link>
        ) : (
          <Typography key={item.label} color="text.primary" aria-current="page" sx={{ fontSize: 14 }} noWrap>
            {item.label}
          </Typography>
        ),
      )}
    </Breadcrumbs>
  )
}
