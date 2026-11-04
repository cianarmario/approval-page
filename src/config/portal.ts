const configuredSupportEmail = import.meta.env.VITE_APPROVAL_SUPPORT_EMAIL?.trim()

export const approvalSupport = {
  email: configuredSupportEmail || 'admin@example.com',
  isSample: !configuredSupportEmail,
}
