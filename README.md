# ReachInbox Email Onebox

A production-ready, real-time AI-powered email aggregator with IMAP sync, Elasticsearch search, AI categorization, and RAG-based suggested replies. Built for the ReachInbox Associate Backend Engineer assignment.

## 🎯 Features

1. **Real-Time Email Synchronization** - IMAP IDLE for multiple Gmail accounts (no polling)
2. **Searchable Storage** - Elasticsearch indexing with full-text search and filtering
3. **AI Email Categorization** - Gemini API for intelligent categorization into 5 categories
4. **Slack & Webhook Integration** - Automatic notifications for "Interested" emails
5. **Modern Frontend Interface** - Email list, search, filtering, and email details
6. **AI-Powered Suggested Replies** - RAG system with vector database for contextual replies

## 📋 Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Docker & Docker Compose** ([Download](https://www.docker.com/products/docker-desktop))
- **Gemini API Key** ([Get here](https://makersuite.google.com/app/apikey))
- **Gmail Account** with App Password enabled
- **Slack Webhook** (optional, for notifications)

## 🚀 Quick Start

### 1. Clone & Install

\`\`\`bash
git clone <your-repo-url>
cd reachinbox-onebox
npm install
\`\`\`

### 2. Configure Environment Variables

\`\`\`bash
cp .env.example .env
\`\`\`

Edit `.env` with your credentials:

\`\`\`env
# Gmail Accounts (use App Passwords)
IMAP_EMAIL_1=your-email-1@gmail.com
IMAP_PASSWORD_1=your-app-password-1
IMAP_EMAIL_2=your-email-2@gmail.com
IMAP_PASSWORD_2=your-app-password-2

# Gemini API
GEMINI_API_KEY=your-gemini-api-key

# Slack Webhook (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Webhook.site (optional)
WEBHOOK_URL=https://webhook.site/your-unique-id

# Services
ELASTICSEARCH_URL=http://localhost:9200
QDRANT_URL=http://localhost:6333
\`\`\`

### 3. Start Docker Services

\`\`\`bash
npm run docker:up
\`\`\`

Wait for both Elasticsearch and Qdrant to be ready (30-60 seconds).

### 4. Start the Application

In a **new terminal**:

\`\`\`bash
npm run dev
\`\`\`

### 5. Access the Frontend

Open your browser and navigate to:
\`\`\`
http://localhost:3000
\`\`\`

## 📖 How to Get Credentials

### Gmail App Password
1. Go to [myaccount.google.com/security](https://myaccount.google.com/security)
2. Enable 2-Factor Authentication
3. Go to "App passwords" → Select "Mail" and "Windows Computer"
4. Copy the generated password

### Gemini API Key
1. Visit [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy and paste into `.env`

### Slack Webhook (Optional)
1. Go to [api.slack.com/messaging/webhooks](https://api.slack.com/messaging/webhooks)
2. Create a new webhook
3. Copy the URL to `.env`

## 🏗️ Architecture

\`\`\`
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│              Email List, Search, Details                 │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              Express API Server                          │
│  /api/emails, /api/search, /api/rag, /api/suggest-reply │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
   ┌────▼──┐  ┌─────▼────┐  ┌───▼────┐
   │ IMAP  │  │Elasticsearch│ Qdrant │
   │ Sync  │  │  (Search)   │(Vector)│
   └────┬──┘  └─────┬────┘  └───┬────┘
        │           │            │
   ┌────▼───────────▼────────────▼────┐
   │      Gemini API (AI)              │
   │  Categorization & Replies         │
   └──────────────────────────────────┘
\`\`\`

### Components

- **IMAP Sync Service** (`src/services/imap-sync.ts`)
  - Real-time email synchronization using IMAP IDLE
  - Automatic reconnection with watchdog timer
  - Batch processing for initial sync

- **Elasticsearch Service** (`src/services/elasticsearch-service.ts`)
  - Full-text search indexing
  - Email filtering and aggregations
  - Pagination support

- **Gemini Service** (`src/services/gemini-service.ts`)
  - AI-based email categorization
  - 5 categories: Interested, Meeting Booked, Not Interested, Spam, Out of Office
  - JSON schema validation

- **Notification Service** (`src/services/notification-service.ts`)
  - Slack webhook integration
  - Generic webhook.site support
  - Formatted payloads with email metadata

- **Vector DB & RAG Services** (`src/services/vector-db-service.ts`, `src/services/rag-service.ts`)
  - Qdrant vector database integration
  - Gemini embeddings for semantic search
  - RAG pipeline for contextual replies

## 📡 API Endpoints

### Health & Status
- `GET /health` - Server health check

### Email Management
- `GET /api/emails` - Fetch paginated emails
  - Query params: `page`, `limit`, `account`, `folder`, `category`
- `GET /api/emails/search` - Full-text search
  - Query params: `q`, `page`, `limit`, `account`, `folder`, `category`
- `GET /api/emails/accounts` - List all configured accounts
- `GET /api/emails/folders` - List all folders

### AI Features
- `POST /api/emails/:id/suggest-reply` - Generate basic reply suggestion
- `POST /api/rag/init` - Initialize vector database
- `POST /api/rag/knowledge` - Add product knowledge to vector DB
- `POST /api/rag/generate-reply` - Generate RAG-enhanced reply

## 🎨 Frontend Features

- **Email List** - Real-time email display with pagination
- **Search & Filter** - Full-text search with account/folder/category filters
- **AI Categories** - Color-coded category badges
- **Email Details** - Full email content with metadata
- **Suggested Replies** - AI-generated reply suggestions
- **RAG Toggle** - Switch between basic and context-aware replies
- **Dark Theme** - Modern gradient-based UI

## 🔧 Project Structure

\`\`\`
reachinbox-onebox/
├── src/
│   ├── config/
│   │   ├── logger.ts              # Pino logger setup
│   │   └── elasticsearch.ts       # ES client & index mapping
│   ├── services/
│   │   ├── imap-sync.ts           # IMAP IDLE sync service
│   │   ├── elasticsearch-service.ts # Search & indexing
│   │   ├── gemini-service.ts      # AI categorization
│   │   ├── notification-service.ts # Slack & webhooks
│   │   ├── vector-db-service.ts   # Qdrant integration
│   │   └── rag-service.ts         # RAG pipeline
│   ├── routes/
│   │   ├── emails.ts              # Email API endpoints
│   │   └── rag.ts                 # RAG API endpoints
│   ├── types/
│   │   └── email.ts               # TypeScript interfaces
│   └── index.ts                   # Express server setup
├── app/
│   ├── page.tsx                   # Main dashboard
│   ├── layout.tsx                 # Root layout
│   ├── globals.css                # Global styles
│   └── loading.tsx                # Loading state
├── docker-compose.yml             # Elasticsearch & Qdrant
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
├── .env.example                   # Environment template
└── README.md                      # This file
\`\`\`

## 🧪 Testing the Features

### 1. Real-Time Sync
- Send an email to one of your configured Gmail accounts
- It should appear in the dashboard within 5 seconds

### 2. Search
- Type keywords in the search bar
- Results filter in real-time

### 3. AI Categorization
- Look at the colored badges on emails
- Each color represents a category

### 4. Suggested Replies
- Click on an email
- Click "Generate Reply"
- See AI-generated suggestions

### 5. RAG Mode
- Click "Toggle RAG Mode"
- Replies become more contextual

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 3000 already in use | `PORT=3001 npm run dev` |
| Elasticsearch connection error | Ensure Docker is running: `npm run docker:up` |
| Gmail connection fails | Verify app password (not regular password) |
| No emails appearing | Enable IMAP in Gmail settings |
| Gemini API errors | Check API key and quota |
| Docker containers won't start | Run `npm run docker:down` then `npm run docker:up` |

## 🛑 Stopping the Application

\`\`\`bash
# Stop the dev server
Ctrl + C

# Stop Docker services
npm run docker:down
\`\`\`

## 📦 Available Scripts

\`\`\`bash
npm run dev           # Start development server
npm run docker:up     # Start Docker services
npm run docker:down   # Stop Docker services
npm run build         # Build for production
npm start             # Start production server
\`\`\`

## 🔐 Security Considerations

- **Never commit `.env` file** - Use `.env.example` as template
- **App Passwords** - Use Gmail app passwords, not account password
- **API Keys** - Keep Gemini API key private
- **Row-Level Security** - Implement RLS for production databases
- **Rate Limiting** - Add rate limiting for API endpoints in production

## 📝 Environment Variables

All required environment variables are documented in `.env.example`. Key variables:

- `IMAP_EMAIL_*` / `IMAP_PASSWORD_*` - Gmail credentials
- `GEMINI_API_KEY` - Google Gemini API key
- `SLACK_WEBHOOK_URL` - Slack webhook for notifications
- `ELASTICSEARCH_URL` - Elasticsearch connection
- `QDRANT_URL` - Qdrant vector database connection

## 🚢 Deployment

### Deploy to Vercel

\`\`\`bash
npm run build
vercel deploy
\`\`\`

### Deploy with Docker

\`\`\`bash
docker build -t reachinbox-onebox .
docker run -p 3000:3000 --env-file .env reachinbox-onebox
\`\`\`

## 📚 Technologies Used

- **Backend**: Node.js, Express, TypeScript
- **Frontend**: Next.js, React, Tailwind CSS
- **Search**: Elasticsearch
- **Vector DB**: Qdrant
- **AI**: Google Gemini API
- **Email**: IMAP (Nodemailer)
- **Notifications**: Slack API, Webhooks
- **Logging**: Pino
- **Database**: Elasticsearch (for email storage)

## 👥 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

##  License

This project is licensed under the MIT License - see the LICENSE file for details.

##  Support

For issues or questions:
1. Check the Troubleshooting section
2. Review the API documentation
3. Check existing GitHub issues
4. Create a new issue with detailed description

##  Assignment Details

- **Company**: ReachInbox
- **Position**: Associate Backend Engineer
- **Assignment**: Real-Time AI Email Onebox
- **Submission**: GitHub Repository + Demo Video (max 5 mins)

##  Demo Video

[Add link to your demo video here]

---

**Built with ❤️ for ReachInbox**
