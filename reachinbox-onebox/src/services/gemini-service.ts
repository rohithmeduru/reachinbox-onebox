import { GoogleGenerativeAI } from "@google/generative-ai"
import logger from "../config/logger"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

const systemInstruction = `You are an expert email classifier. Your task is to analyze the provided email text and categorize it into one of the following labels:
- Interested: The sender shows genuine interest in the product/service or wants to proceed
- Meeting Booked: The sender has confirmed a meeting or appointment
- Not Interested: The sender explicitly declines or shows no interest
- Spam: The email is spam, promotional, or unsolicited
- Out of Office: The sender is out of office or auto-reply

Respond ONLY with a valid JSON object containing the category field.`

const responseSchema = {
  type: "OBJECT",
  properties: {
    category: {
      type: "STRING",
      enum: ["Interested", "Meeting Booked", "Not Interested", "Spam", "Out of Office"],
    },
  },
  required: ["category"],
}

export async function categorizeEmail(subject: string, body: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema,
      },
    })

    const emailText = `Subject: ${subject}\n\nBody: ${body}`

    const result = await model.generateContent(emailText)
    const responseText = result.response.text()

    const parsed = JSON.parse(responseText)
    return parsed.category || "Uncategorized"
  } catch (error) {
    logger.error("Failed to categorize email:", error)
    return "Uncategorized"
  }
}

export async function generateReplyWithRetry(subject: string, body: string, maxRetries = 3): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
      })

      const prompt = `You are a professional email assistant. Based on the following email, generate a concise and professional reply.

Email Subject: ${subject}
Email Body: ${body}

Generate a professional reply that:
1. Acknowledges the sender's message
2. Is concise and to the point
3. Maintains a professional tone
4. Addresses the main points of the email

Reply:`

      const result = await model.generateContent(prompt)
      return result.response.text()
    } catch (error) {
      if (attempt === maxRetries) {
        logger.error("Failed to generate reply after retries:", error)
        throw error
      }

      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000
      logger.warn(`Retry attempt ${attempt} after ${delay}ms`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  return ""
}
