export const currency = (value: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(value)
export const dateLabel = (value: string, time = false) => new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric', ...(time ? { hour: 'numeric', minute: '2-digit' } : {}), timeZone: 'Asia/Manila' }).format(new Date(value))
export const statusLabels = { unassigned: 'Needs assignment', pending: 'Pending review', approved: 'Approved', 'changes-requested': 'Changes requested', upcoming: 'Upcoming' }
export function initials(name: string) { return name.replace(/Engr\.|Hon\./g, '').trim().split(' ').slice(0, 2).map(word => word[0]).join('') }
