// Returns status info based on expiry date
export const getDocumentStatus = (expiryDate) => {
  if (!expiryDate) {
    return { status: 'na', label: 'N/A', daysLeft: null, color: 'status-na', emoji: '⚪' }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0)

  const daysLeft = Math.round((expiry - today) / (1000 * 60 * 60 * 24))

  if (daysLeft < 0) {
    return {
      status: 'expired',
      label: 'Expired',
      daysLeft,
      color: 'status-expired',
      emoji: '🔴',
      badgeClass: 'status-expired',
    }
  }
  if (daysLeft === 0) {
    return {
      status: 'expiring-urgent',
      label: 'Today',
      daysLeft,
      color: 'status-expiring-urgent',
      emoji: '🔴',
      badgeClass: 'status-expiring-urgent',
    }
  }
  if (daysLeft <= 6) {
    return {
      status: 'expiring-urgent',
      label: `${daysLeft} Day${daysLeft !== 1 ? 's' : ''} Left`,
      daysLeft,
      color: 'status-expiring-urgent',
      emoji: '🟠',
      badgeClass: 'status-expiring-urgent',
    }
  }
  if (daysLeft <= 30) {
    return {
      status: 'expiring-soon',
      label: `${daysLeft} Days Left`,
      daysLeft,
      color: 'status-expiring-soon',
      emoji: '🟡',
      badgeClass: 'status-expiring-soon',
    }
  }
  return {
    status: 'valid',
    label: 'Valid',
    daysLeft,
    color: 'status-valid',
    emoji: '🟢',
    badgeClass: 'status-valid',
  }
}

// Format date as "22 Jul 2026"
export const formatDisplayDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// Format date for input (YYYY-MM-DD)
export const formatInputDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

// Format date+time
export const formatDateTime = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Relative time (e.g. "2 hours ago")
export const timeAgo = (date) => {
  if (!date) return ''
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDisplayDate(date)
}
