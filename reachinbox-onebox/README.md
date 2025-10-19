# ReachInbox Email Onebox

A real-time AI-powered email aggregator with IMAP sync, Elasticsearch search, and AI categorization.

## Features

1. **Real-Time Email Synchronization** - IMAP IDLE for multiple accounts
2. **Searchable Storage** - Elasticsearch indexing and full-text search
3. **AI Email Categorization** - Gemini API for intelligent categorization
4. **Slack & Webhook Integration** - Notifications for interested leads
5. **Frontend Interface** - Email list, search, and filtering
6. **AI-Powered Suggested Replies** - RAG with vector database

## Setup Instructions

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Gemini API Key
- Gmail App Password (for IMAP)

### Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Start Docker services:
   \`\`\`bash
   npm run docker:up
   \`\`\`

4. Configure environment variables:
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your credentials
   \`\`\`

5. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## Architecture

- **IMAP Sync Service**: Real-time email synchronization using IMAP IDLE
- **Elasticsearch**: Full-text search and email indexing
- **Gemini API**: AI-based email categorization
- **Qdrant**: Vector database for RAG
- **Express API**: REST endpoints for frontend integration

## API Endpoints

- `GET /health` - Health check
- `GET /api/accounts` - List configured accounts
- `GET /api/emails` - Fetch paginated emails
- `GET /api/emails/search` - Search emails with filters
- `POST /api/emails/:id/suggest-reply` - Get AI-suggested reply

## Demo Video

[Link to demo video - max 5 minutes]

## Submission

- GitHub Repository: [Your repo link]
- Collaborators: Mitrajit, sarvagya-chaudhary
