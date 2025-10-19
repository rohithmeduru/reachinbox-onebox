"use client"

import { useState, useEffect } from "react"
import { Mail, Search, Send, Loader2, BookOpen } from "lucide-react"

interface Email {
  id: string
  from: string
  subject: string
  body: string
  date: string
  aiCategory: string
  accountId: string
  folder: string
}

interface SearchResult {
  total: number
  emails: Email[]
  page: number
  limit: number
}

const categoryColors: Record<string, string> = {
  Interested: "bg-green-100 text-green-800",
  "Meeting Booked": "bg-blue-100 text-blue-800",
  "Not Interested": "bg-red-100 text-red-800",
  Spam: "bg-gray-100 text-gray-800",
  "Out of Office": "bg-yellow-100 text-yellow-800",
  Uncategorized: "bg-gray-50 text-gray-600",
}

export default function Home() {
  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedAccount, setSelectedAccount] = useState("")
  const [selectedFolder, setSelectedFolder] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [accounts, setAccounts] = useState<string[]>([])
  const [folders, setFolders] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalEmails, setTotalEmails] = useState(0)
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [suggestedReply, setSuggestedReply] = useState("")
  const [generatingReply, setGeneratingReply] = useState(false)
  const [useRAG, setUseRAG] = useState(false)

  // Fetch accounts on mount
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await fetch("/api/emails/accounts")
        const data = await res.json()
        setAccounts(data.accounts || [])
      } catch (error) {
        console.error("Failed to fetch accounts:", error)
      }
    }
    fetchAccounts()
  }, [])

  // Fetch folders when account changes
  useEffect(() => {
    if (selectedAccount) {
      const fetchFolders = async () => {
        try {
          const res = await fetch(`/api/emails/folders?accountId=${selectedAccount}`)
          const data = await res.json()
          setFolders(data.folders || [])
        } catch (error) {
          console.error("Failed to fetch folders:", error)
        }
      }
      fetchFolders()
    }
  }, [selectedAccount])

  // Fetch emails
  useEffect(() => {
    const fetchEmails = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (searchQuery) params.append("q", searchQuery)
        if (selectedAccount) params.append("accountId", selectedAccount)
        if (selectedFolder) params.append("folder", selectedFolder)
        if (selectedCategory) params.append("category", selectedCategory)
        params.append("page", currentPage.toString())
        params.append("limit", "20")

        const res = await fetch(`/api/emails/search?${params}`)
        const data: SearchResult = await res.json()
        setEmails(data.emails || [])
        setTotalEmails(data.total || 0)
      } catch (error) {
        console.error("Failed to fetch emails:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEmails()
  }, [searchQuery, selectedAccount, selectedFolder, selectedCategory, currentPage])

  const handleGenerateReply = async (email: Email) => {
    setGeneratingReply(true)
    try {
      if (useRAG) {
        const res = await fetch("/api/rag/generate-reply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject: email.subject,
            body: email.body,
          }),
        })
        const data = await res.json()
        setSuggestedReply(data.reply || "")
      } else {
        const res = await fetch(`/api/emails/${email.id}/suggest-reply`, {
          method: "POST",
        })
        const data = await res.json()
        setSuggestedReply(data.suggestedReply || "")
      }
    } catch (error) {
      console.error("Failed to generate reply:", error)
      setSuggestedReply("Failed to generate reply")
    } finally {
      setGeneratingReply(false)
    }
  }

  const totalPages = Math.ceil(totalEmails / 20)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">ReachInbox Onebox</h1>
            </div>
            <div className="text-sm text-slate-400">
              {totalEmails} emails • {accounts.length} accounts
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 mb-8">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={selectedAccount}
                onChange={(e) => {
                  setSelectedAccount(e.target.value)
                  setCurrentPage(1)
                }}
                className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">All Accounts</option>
                {accounts.map((account) => (
                  <option key={account} value={account}>
                    {account}
                  </option>
                ))}
              </select>

              <select
                value={selectedFolder}
                onChange={(e) => {
                  setSelectedFolder(e.target.value)
                  setCurrentPage(1)
                }}
                className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">All Folders</option>
                {folders.map((folder) => (
                  <option key={folder} value={folder}>
                    {folder}
                  </option>
                ))}
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value)
                  setCurrentPage(1)
                }}
                className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">All Categories</option>
                <option value="Interested">Interested</option>
                <option value="Meeting Booked">Meeting Booked</option>
                <option value="Not Interested">Not Interested</option>
                <option value="Spam">Spam</option>
                <option value="Out of Office">Out of Office</option>
              </select>
            </div>
          </div>
        </div>

        {/* Email List and Detail View */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Email List */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : emails.length === 0 ? (
              <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 text-center">
                <Mail className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">No emails found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {emails.map((email) => (
                  <div
                    key={email.id}
                    onClick={() => {
                      setSelectedEmail(email)
                      setSuggestedReply("")
                    }}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedEmail?.id === email.id
                        ? "bg-blue-900/30 border-blue-500"
                        : "bg-slate-800 border-slate-700 hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">{email.from}</p>
                        <p className="text-sm text-slate-400 truncate">{email.subject}</p>
                      </div>
                      <span
                        className={`ml-2 px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${categoryColors[email.aiCategory]}`}
                      >
                        {email.aiCategory}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{new Date(email.date).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg disabled:opacity-50 hover:bg-slate-600"
                >
                  Previous
                </button>
                <span className="text-slate-400">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg disabled:opacity-50 hover:bg-slate-600"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Email Detail */}
          {selectedEmail && (
            <div className="lg:col-span-1">
              <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 sticky top-24">
                <h3 className="text-lg font-semibold text-white mb-4">Email Details</h3>

                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">From</p>
                    <p className="text-white font-medium">{selectedEmail.from}</p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Subject</p>
                    <p className="text-white font-medium">{selectedEmail.subject}</p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Category</p>
                    <span
                      className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${categoryColors[selectedEmail.aiCategory]}`}
                    >
                      {selectedEmail.aiCategory}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Date</p>
                    <p className="text-white">{new Date(selectedEmail.date).toLocaleString()}</p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Preview</p>
                    <p className="text-slate-300 text-sm line-clamp-3">{selectedEmail.body}</p>
                  </div>
                </div>

                {/* RAG Toggle */}
                <div className="mb-4 flex items-center gap-2 p-3 bg-slate-700 rounded-lg">
                  <input
                    type="checkbox"
                    id="rag-toggle"
                    checked={useRAG}
                    onChange={(e) => setUseRAG(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="rag-toggle" className="text-sm text-slate-300 flex items-center gap-2 cursor-pointer">
                    <BookOpen className="w-4 h-4" />
                    Use Knowledge Base
                  </label>
                </div>

                <button
                  onClick={() => handleGenerateReply(selectedEmail)}
                  disabled={generatingReply}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 font-medium"
                >
                  {generatingReply ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Suggest Reply
                    </>
                  )}
                </button>

                {suggestedReply && (
                  <div className="mt-6 p-4 bg-slate-700 rounded-lg border border-slate-600">
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Suggested Reply</p>
                    <p className="text-slate-200 text-sm">{suggestedReply}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
