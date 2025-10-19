import logger from "../config/logger"
import { searchSimilarDocuments } from "./vector-db-service"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function generateRAGReply(emailSubject: string, emailBody: string): Promise<string> {
  try {
    // Step 1: Retrieve relevant context from vector DB
    const queryText = `${emailSubject}\n${emailBody}`
    const relevantDocs = await searchSimilarDocuments(queryText, 3)

    // Step 2: Build context from retrieved documents
    let context = ""
    if (relevantDocs.length > 0) {
      context = "Relevant product information:\n"
      relevantDocs.forEach((doc, index) => {
        context += `\n${index + 1}. ${doc.text}\n`
      })
    } else {
      context = "No specific product information available in knowledge base."
    }

    // Step 3: Create comprehensive prompt with context
    const systemInstruction = `You are a professional email assistant for a sales/outreach team. 
Your task is to generate professional, helpful email replies based on the incoming email and relevant product information.
Be concise, professional, and address the main points of the email.
Use the provided context to make your reply more relevant and personalized.`

    const userPrompt = `Based on the following context and the incoming email, generate a professional reply.

CONTEXT (Product Information):
${context}

INCOMING EMAIL:
Subject: ${emailSubject}
Body: ${emailBody}

Generate a professional reply that:
1. Acknowledges the sender's message
2. Incorporates relevant information from the context when applicable
3. Is concise and to the point
4. Maintains a professional tone
5. Addresses the main points of the email

Reply:`

    // Step 4: Generate reply using Gemini
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction,
    })

    const result = await model.generateContent(userPrompt)
    const reply = result.response.text()

    logger.info("RAG reply generated successfully")
    return reply
  } catch (error) {
    logger.error("Failed to generate RAG reply:", error)
    throw error
  }
}
