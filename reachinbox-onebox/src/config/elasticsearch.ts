import { Client } from "@elastic/elasticsearch"
import logger from "./logger"

const client = new Client({
  node: process.env.ELASTICSEARCH_HOST || "http://localhost:9200",
})

export async function initializeElasticsearch() {
  try {
    const health = await client.cluster.health()
    logger.info("Elasticsearch connected:", health)

    // Create index if it doesn't exist
    const indexExists = await client.indices.exists({ index: "emails" })
    if (!indexExists) {
      await client.indices.create({
        index: "emails",
        body: {
          mappings: {
            properties: {
              id: { type: "keyword" },
              accountId: { type: "keyword" },
              folder: { type: "keyword" },
              subject: { type: "text" },
              body: { type: "text" },
              from: { type: "keyword" },
              to: { type: "keyword" },
              cc: { type: "keyword" },
              bcc: { type: "keyword" },
              date: { type: "date" },
              aiCategory: { type: "keyword" },
              indexedAt: { type: "date" },
              hasAttachments: { type: "boolean" },
              messageId: { type: "keyword" },
            },
          },
        },
      })
      logger.info('Elasticsearch index "emails" created')
    }
  } catch (error) {
    logger.error("Failed to initialize Elasticsearch:", error)
    throw error
  }
}

export default client
