import axios from "axios"
import logger from "../config/logger"
import type { EmailDocument } from "../types/email"

export async function sendSlackNotification(email: EmailDocument): Promise<void> {
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL

  if (!slackWebhookUrl) {
    logger.warn("Slack webhook URL not configured")
    return
  }

  try {
    const payload = {
      text: "New Interested Lead",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "New Interested Lead",
            emoji: true,
          },
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*From:*\n${email.from}`,
            },
            {
              type: "mrkdwn",
              text: `*Account:*\n${email.accountId}`,
            },
          ],
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Subject:*\n${email.subject}`,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Preview:*\n${email.body.substring(0, 200)}...`,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Date:*\n${new Date(email.date).toLocaleString()}`,
          },
        },
      ],
    }

    await axios.post(slackWebhookUrl, payload)
    logger.info(`Slack notification sent for email from ${email.from}`)
  } catch (error) {
    logger.error("Failed to send Slack notification:", error)
  }
}

export async function triggerWebhook(email: EmailDocument): Promise<void> {
  const webhookUrl = process.env.WEBHOOK_SITE_URL

  if (!webhookUrl) {
    logger.warn("Webhook URL not configured")
    return
  }

  try {
    const payload = {
      event: "InterestedLead",
      timestamp: new Date().toISOString(),
      email: {
        id: email.id,
        from: email.from,
        to: email.to,
        subject: email.subject,
        body: email.body,
        date: email.date,
        accountId: email.accountId,
        folder: email.folder,
        category: email.aiCategory,
      },
    }

    await axios.post(webhookUrl, payload)
    logger.info(`Webhook triggered for email from ${email.from}`)
  } catch (error) {
    logger.error("Failed to trigger webhook:", error)
  }
}

export async function notifyInterestedLead(email: EmailDocument): Promise<void> {
  if (email.aiCategory === "Interested") {
    await Promise.all([sendSlackNotification(email), triggerWebhook(email)])
  }
}
