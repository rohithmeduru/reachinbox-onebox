import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import logger from "./config/logger"
import { initializeElasticsearch } from "./config/elasticsearch"
import { initializeIMAPConnection, closeAllConnections } from "./services/imap-sync"
import { initializeVectorDB } from "./services/vector-db-service"
import emailRoutes from "./routes/emails"
import ragRoutes from "./routes/rag"
import type { IMAPAccount } from "./types/email"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() })
})

app.use("/api/emails", emailRoutes)
app.use("/api/rag", ragRoutes)

// Initialize and start server
async function startServer() {
  try {
    logger.info("Initializing Elasticsearch...")
    await initializeElasticsearch()

    logger.info("Initializing Vector DB...")
    await initializeVectorDB()

    // Initialize IMAP accounts
    logger.info("Initializing IMAP connections...")
    const accounts: IMAPAccount[] = []

    // Load accounts from environment variables
    for (let i = 1; i <= 2; i++) {
      const email = process.env[`IMAP_USER_${i}`]
      const password = process.env[`IMAP_PASS_${i}`]
      const host = process.env[`IMAP_HOST_${i}`]
      const port = Number.parseInt(process.env[`IMAP_PORT_${i}`] || "993")

      if (email && password && host) {
        accounts.push({
          email,
          password,
          host,
          port,
          accountId: email,
        })
      }
    }

    // Connect to all accounts
    for (const account of accounts) {
      try {
        await initializeIMAPConnection(account)
        logger.info(`Successfully connected to ${account.email}`)
      } catch (error) {
        logger.error(`Failed to connect to ${account.email}:`, error)
      }
    }

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`)
    })

    // Graceful shutdown
    process.on("SIGINT", async () => {
      logger.info("Shutting down...")
      await closeAllConnections()
      process.exit(0)
    })
  } catch (error) {
    logger.error("Failed to start server:", error)
    process.exit(1)
  }
}

startServer()
