import axios from "axios"
import logger from "../config/logger"

const QDRANT_HOST = process.env.QDRANT_HOST || "http://localhost"
const QDRANT_PORT = process.env.QDRANT_PORT || "6333"
const QDRANT_URL = `${QDRANT_HOST}:${QDRANT_PORT}`

const COLLECTION_NAME = "product_knowledge"
const VECTOR_SIZE = 768 // Gemini embedding size

interface VectorDocument {
  id: string
  text: string
  metadata: Record<string, any>
}

export async function initializeVectorDB(): Promise<void> {
  try {
    // Check if collection exists
    const collectionsRes = await axios.get(`${QDRANT_URL}/collections`)
    const collections = collectionsRes.data.result.collections || []
    const collectionExists = collections.some((c: any) => c.name === COLLECTION_NAME)

    if (!collectionExists) {
      // Create collection
      await axios.put(`${QDRANT_URL}/collections/${COLLECTION_NAME}`, {
        vectors: {
          size: VECTOR_SIZE,
          distance: "Cosine",
        },
      })
      logger.info(`Vector DB collection "${COLLECTION_NAME}" created`)
    } else {
      logger.info(`Vector DB collection "${COLLECTION_NAME}" already exists`)
    }
  } catch (error) {
    logger.error("Failed to initialize vector DB:", error)
    throw error
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai")
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

    const model = genAI.getGenerativeModel({
      model: "embedding-001",
    })

    const result = await model.embedContent(text)
    return result.embedding.values
  } catch (error) {
    logger.error("Failed to generate embedding:", error)
    throw error
  }
}

export async function storeDocument(doc: VectorDocument): Promise<void> {
  try {
    const embedding = await generateEmbedding(doc.text)

    await axios.put(`${QDRANT_URL}/collections/${COLLECTION_NAME}/points`, {
      points: [
        {
          id: doc.id,
          vector: embedding,
          payload: {
            text: doc.text,
            ...doc.metadata,
          },
        },
      ],
    })

    logger.info(`Document stored in vector DB: ${doc.id}`)
  } catch (error) {
    logger.error("Failed to store document:", error)
    throw error
  }
}

export async function searchSimilarDocuments(query: string, limit = 3): Promise<VectorDocument[]> {
  try {
    const queryEmbedding = await generateEmbedding(query)

    const searchRes = await axios.post(`${QDRANT_URL}/collections/${COLLECTION_NAME}/points/search`, {
      vector: queryEmbedding,
      limit,
      with_payload: true,
    })

    return searchRes.data.result.map((item: any) => ({
      id: item.id,
      text: item.payload.text,
      metadata: item.payload,
      score: item.score,
    }))
  } catch (error) {
    logger.error("Failed to search vector DB:", error)
    return []
  }
}

export async function addProductKnowledge(knowledgeItems: Array<{ title: string; content: string }>): Promise<void> {
  try {
    for (let i = 0; i < knowledgeItems.length; i++) {
      const item = knowledgeItems[i]
      await storeDocument({
        id: `product_${Date.now()}_${i}`,
        text: `${item.title}\n${item.content}`,
        metadata: {
          type: "product_knowledge",
          title: item.title,
          createdAt: new Date().toISOString(),
        },
      })
    }
    logger.info(`Added ${knowledgeItems.length} product knowledge items to vector DB`)
  } catch (error) {
    logger.error("Failed to add product knowledge:", error)
    throw error
  }
}
