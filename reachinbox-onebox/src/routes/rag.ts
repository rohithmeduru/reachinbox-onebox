import express from "express"
import logger from "../config/logger"
import { generateRAGReply } from "../services/rag-service"
import { addProductKnowledge, initializeVectorDB } from "../services/vector-db-service"

const router = express.Router()

// Initialize vector DB
router.post("/init", async (req, res) => {
  try {
    await initializeVectorDB()
    res.json({ success: true, message: "Vector DB initialized" })
  } catch (error) {
    logger.error("Failed to initialize vector DB:", error)
    res.status(500).json({ error: "Failed to initialize vector DB" })
  }
})

// Add product knowledge
router.post("/knowledge", async (req, res) => {
  try {
    const { items } = req.body

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items array is required" })
    }

    await addProductKnowledge(items)
    res.json({ success: true, message: `Added ${items.length} knowledge items` })
  } catch (error) {
    logger.error("Failed to add knowledge:", error)
    res.status(500).json({ error: "Failed to add knowledge" })
  }
})

// Generate RAG-based reply
router.post("/generate-reply", async (req, res) => {
  try {
    const { subject, body } = req.body

    if (!subject || !body) {
      return res.status(400).json({ error: "Subject and body are required" })
    }

    const reply = await generateRAGReply(subject, body)
    res.json({ reply })
  } catch (error) {
    logger.error("Failed to generate reply:", error)
    res.status(500).json({ error: "Failed to generate reply" })
  }
})

export default router
