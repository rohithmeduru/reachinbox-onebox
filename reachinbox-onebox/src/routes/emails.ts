import express from "express"
import logger from "../config/logger"
import {
  searchEmails,
  getEmailById,
  getUniqueAccounts,
  getUniqueFolders,
  updateEmailCategory,
} from "../services/elasticsearch-service"
import { generateReplyWithRetry } from "../services/gemini-service"

const router = express.Router()

// Get all unique accounts
router.get("/accounts", async (req, res) => {
  try {
    const accounts = await getUniqueAccounts()
    res.json({ accounts })
  } catch (error) {
    logger.error("Failed to get accounts:", error)
    res.status(500).json({ error: "Failed to get accounts" })
  }
})

// Get unique folders for an account
router.get("/folders", async (req, res) => {
  try {
    const { accountId } = req.query
    const folders = await getUniqueFolders(accountId as string)
    res.json({ folders })
  } catch (error) {
    logger.error("Failed to get folders:", error)
    res.status(500).json({ error: "Failed to get folders" })
  }
})

// Search emails with filters
router.get("/search", async (req, res) => {
  try {
    const { q, accountId, folder, category, page, limit } = req.query

    const result = await searchEmails({
      q: q as string,
      accountId: accountId as string,
      folder: folder as string,
      category: category as string,
      page: page ? Number.parseInt(page as string) : 1,
      limit: limit ? Number.parseInt(limit as string) : 20,
    })

    res.json(result)
  } catch (error) {
    logger.error("Search failed:", error)
    res.status(500).json({ error: "Search failed" })
  }
})

// Get all emails (paginated)
router.get("/", async (req, res) => {
  try {
    const { page, limit } = req.query

    const result = await searchEmails({
      page: page ? Number.parseInt(page as string) : 1,
      limit: limit ? Number.parseInt(limit as string) : 20,
    })

    res.json(result)
  } catch (error) {
    logger.error("Failed to get emails:", error)
    res.status(500).json({ error: "Failed to get emails" })
  }
})

// Get single email by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params
    const email = await getEmailById(id)

    if (!email) {
      return res.status(404).json({ error: "Email not found" })
    }

    res.json(email)
  } catch (error) {
    logger.error("Failed to get email:", error)
    res.status(500).json({ error: "Failed to get email" })
  }
})

router.post("/:id/suggest-reply", async (req, res) => {
  try {
    const { id } = req.params
    const email = await getEmailById(id)

    if (!email) {
      return res.status(404).json({ error: "Email not found" })
    }

    const suggestedReply = await generateReplyWithRetry(email.subject, email.body)

    res.json({ suggestedReply })
  } catch (error) {
    logger.error("Failed to generate reply:", error)
    res.status(500).json({ error: "Failed to generate reply" })
  }
})

router.patch("/:id/category", async (req, res) => {
  try {
    const { id } = req.params
    const { category } = req.body

    if (!["Interested", "Meeting Booked", "Not Interested", "Spam", "Out of Office"].includes(category)) {
      return res.status(400).json({ error: "Invalid category" })
    }

    await updateEmailCategory(id, category)
    res.json({ success: true, message: "Category updated" })
  } catch (error) {
    logger.error("Failed to update category:", error)
    res.status(500).json({ error: "Failed to update category" })
  }
})

export default router
