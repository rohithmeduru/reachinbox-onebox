import Imap from "imap"
import { simpleParser } from "mailparser"
import logger from "../config/logger"
import type { EmailDocument, IMAPAccount } from "../types/email"
import { indexEmail } from "./elasticsearch-service"
import { categorizeEmail } from "./gemini-service"
import { notifyInterestedLead } from "./notification-service"

interface IMAPConnection {
  imap: Imap
  account: IMAPAccount
  isIdle: boolean
  watchdog?: NodeJS.Timeout
}

const connections: Map<string, IMAPConnection> = new Map()

export async function initializeIMAPConnection(account: IMAPAccount): Promise<void> {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: account.email,
      password: account.password,
      host: account.host,
      port: account.port,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    })

    imap.on("error", (err) => {
      logger.error(`IMAP error for ${account.email}:`, err)
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        initializeIMAPConnection(account).catch((e) => logger.error("Reconnection failed:", e))
      }, 5000)
    })

    imap.on("end", () => {
      logger.info(`IMAP connection closed for ${account.email}`)
      connections.delete(account.accountId)
    })

    imap.openBox("INBOX", false, async (err, box) => {
      if (err) {
        logger.error(`Failed to open INBOX for ${account.email}:`, err)
        reject(err)
        return
      }

      logger.info(`Connected to INBOX for ${account.email}. Total emails: ${box.messages}`)

      try {
        // Fetch last 30 days of emails
        await fetchInitialEmails(imap, account)

        startIDLE(imap, account)

        connections.set(account.accountId, {
          imap,
          account,
          isIdle: true,
        })

        resolve()
      } catch (error) {
        logger.error(`Failed to initialize IMAP for ${account.email}:`, error)
        reject(error)
      }
    })

    imap.connect()
  })
}

async function fetchInitialEmails(imap: Imap, account: IMAPAccount): Promise<void> {
  return new Promise((resolve, reject) => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    imap.search(["SINCE", thirtyDaysAgo], (err, results) => {
      if (err) {
        logger.error(`Search failed for ${account.email}:`, err)
        reject(err)
        return
      }

      if (results.length === 0) {
        logger.info(`No emails found in last 30 days for ${account.email}`)
        resolve()
        return
      }

      logger.info(`Found ${results.length} emails in last 30 days for ${account.email}`)

      const f = imap.fetch(results, { bodies: "" })

      f.on("message", (msg) => {
        parseAndIndexEmail(msg, account, "INBOX")
      })

      f.on("error", (err) => {
        logger.error(`Fetch error for ${account.email}:`, err)
        reject(err)
      })

      f.on("end", () => {
        logger.info(`Initial email fetch completed for ${account.email}`)
        resolve()
      })
    })
  })
}

async function parseAndIndexEmail(msg: any, account: IMAPAccount, folder: string): Promise<void> {
  try {
    const parsed = await simpleParser(msg)

    const category = await categorizeEmail(parsed.subject || "(No Subject)", parsed.text || parsed.html || "")

    const emailDoc: EmailDocument = {
      id: `${account.accountId}-${parsed.messageId || Date.now()}`,
      accountId: account.accountId,
      folder,
      subject: parsed.subject || "(No Subject)",
      body: parsed.text || parsed.html || "",
      from: parsed.from?.text || "",
      to: parsed.to?.map((t: any) => t.address) || [],
      cc: parsed.cc?.map((c: any) => c.address) || [],
      bcc: parsed.bcc?.map((b: any) => b.address) || [],
      date: parsed.date || new Date(),
      indexedAt: new Date(),
      hasAttachments: (parsed.attachments?.length || 0) > 0,
      messageId: parsed.messageId || "",
      aiCategory: category,
    }

    await indexEmail(emailDoc)
    logger.info(`Indexed email: ${emailDoc.subject} from ${emailDoc.from} - Category: ${category}`)

    await notifyInterestedLead(emailDoc)
  } catch (error) {
    logger.error("Failed to parse and index email:", error)
  }
}

function startIDLE(imap: Imap, account: IMAPAccount): void {
  imap.openBox("INBOX", false, (err) => {
    if (err) {
      logger.error(`Failed to open INBOX for IDLE for ${account.email}:`, err)
      return
    }

    imap.on("mail", () => {
      logger.info(`New mail detected for ${account.email}`)
      // Fetch the latest email
      imap.search(["ALL"], (err, results) => {
        if (err || !results.length) return

        const f = imap.fetch([results[results.length - 1]], { bodies: "" })
        f.on("message", (msg) => {
          parseAndIndexEmail(msg, account, "INBOX")
        })
      })
    })

    imap.idle((err) => {
      if (err) {
        logger.error(`IDLE failed for ${account.email}:`, err)
        return
      }
      logger.info(`IDLE mode started for ${account.email}`)

      // Watchdog to keep IDLE alive (reset every 29 minutes)
      const watchdog = setInterval(
        () => {
          imap.openBox("INBOX", false, () => {
            imap.idle((err) => {
              if (err) {
                logger.error(`IDLE watchdog failed for ${account.email}:`, err)
                clearInterval(watchdog)
              }
            })
          })
        },
        29 * 60 * 1000,
      )

      const connection = connections.get(account.accountId)
      if (connection) {
        connection.watchdog = watchdog
      }
    })
  })
}

export async function closeAllConnections(): Promise<void> {
  for (const [accountId, connection] of connections) {
    if (connection.watchdog) {
      clearInterval(connection.watchdog)
    }
    connection.imap.closeBox(false, (err) => {
      if (err) logger.error(`Error closing box for ${accountId}:`, err)
    })
    connection.imap.end()
  }
  connections.clear()
  logger.info("All IMAP connections closed")
}

export function getConnections(): Map<string, IMAPConnection> {
  return connections
}
