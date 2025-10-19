import client from "../config/elasticsearch"
import logger from "../config/logger"
import type { EmailDocument, SearchQuery } from "../types/email"

export async function indexEmail(email: EmailDocument): Promise<void> {
  try {
    await client.index({
      index: "emails",
      id: email.id,
      body: email,
    })
  } catch (error) {
    logger.error("Failed to index email:", error)
    throw error
  }
}

export async function searchEmails(query: SearchQuery) {
  try {
    const { q, accountId, folder, category, page = 1, limit = 20 } = query

    const must: any[] = []
    const filter: any[] = []

    // Full-text search on subject and body
    if (q) {
      must.push({
        multi_match: {
          query: q,
          fields: ["subject^2", "body"],
          fuzziness: "AUTO",
        },
      })
    }

    // Exact filters
    if (accountId) {
      filter.push({ term: { accountId } })
    }
    if (folder) {
      filter.push({ term: { folder } })
    }
    if (category) {
      filter.push({ term: { aiCategory: category } })
    }

    const result = await client.search({
      index: "emails",
      body: {
        query: {
          bool: {
            must: must.length > 0 ? must : [{ match_all: {} }],
            filter,
          },
        },
        sort: [{ date: { order: "desc" } }],
        from: (page - 1) * limit,
        size: limit,
      },
    })

    return {
      total: result.hits.total.value,
      emails: result.hits.hits.map((hit: any) => hit._source),
      page,
      limit,
    }
  } catch (error) {
    logger.error("Search failed:", error)
    throw error
  }
}

export async function getEmailById(id: string): Promise<EmailDocument | null> {
  try {
    const result = await client.get({
      index: "emails",
      id,
    })
    return result._source as EmailDocument
  } catch (error) {
    logger.error("Failed to get email:", error)
    return null
  }
}

export async function updateEmailCategory(id: string, category: string): Promise<void> {
  try {
    await client.update({
      index: "emails",
      id,
      body: {
        doc: {
          aiCategory: category,
        },
      },
    })
  } catch (error) {
    logger.error("Failed to update email category:", error)
    throw error
  }
}

export async function getUniqueAccounts(): Promise<string[]> {
  try {
    const result = await client.search({
      index: "emails",
      body: {
        aggs: {
          accounts: {
            terms: {
              field: "accountId",
              size: 100,
            },
          },
        },
        size: 0,
      },
    })

    return result.aggregations.accounts.buckets.map((bucket: any) => bucket.key)
  } catch (error) {
    logger.error("Failed to get unique accounts:", error)
    return []
  }
}

export async function getUniqueFolders(accountId?: string): Promise<string[]> {
  try {
    const filter = accountId ? [{ term: { accountId } }] : []

    const result = await client.search({
      index: "emails",
      body: {
        query: {
          bool: {
            filter,
          },
        },
        aggs: {
          folders: {
            terms: {
              field: "folder",
              size: 100,
            },
          },
        },
        size: 0,
      },
    })

    return result.aggregations.folders.buckets.map((bucket: any) => bucket.key)
  } catch (error) {
    logger.error("Failed to get unique folders:", error)
    return []
  }
}
