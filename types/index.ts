// ApprovedIn type definitions
// Vendor, compliance document, and alert types will be added here in later steps.

export type UserRole = 'cam' | 'admin'

export interface Profile {
  id: string
  email: string
  role: UserRole
  created_at: string
}
