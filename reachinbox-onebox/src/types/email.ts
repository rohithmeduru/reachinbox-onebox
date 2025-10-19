export interface EmailDocument {
  id: string
  accountId: string
  folder: string
  subject: string
  body: string
  from: string
  to: string[]
  cc?: string[]
  bcc?: string[]
  date: Date
  aiCategory?: "Interested" | "Meeting Booked" | "Not Interested" | "Spam" | "Out of Office" | "Uncategorized"
  indexedAt: Date
  hasAttachments: boolean
  messageId: string
}

export interface IMAPAccount {
  email: string
  password: string
  host: string
  port: number
  accountId: string
}

export interface SearchQuery {
  q?: string
  accountId?: string
  folder?: string
  category?: string
  page?: number
  limit?: number
}
