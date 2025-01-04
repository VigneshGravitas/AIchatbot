# AI Chatbot Development Guide

This guide documents the development work done on the AI chatbot, focusing on database integration, LM Studio models, and testing configurations.

## Recent Changes and Improvements

### 1. Database Configuration

#### PostgreSQL Setup
- Using PostgreSQL for chat history and message storage
- Database running in Docker container
- Connection string: `postgresql://postgres:postgres123@localhost:5432/chatbot`

#### Database Schema
- `Chat` table: Stores chat sessions
- `Message` table: Stores individual messages
- `User` table: User information
- Other tables: Document, Suggestion, Vote

#### Database Client Updates
- Switched from Edge runtime to Node.js runtime for better database compatibility
- Using `node-postgres` with connection pooling
- Added proper error handling and logging

```typescript
// Database configuration (lib/db/index.ts)
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

// Global db instance for development
let db = process.env.NODE_ENV === 'production' 
  ? drizzle(pool)
  : (global.db ?? (global.db = drizzle(pool)));

export { db };
```

### 2. Chat API Implementation

#### Key Features
- Message persistence in PostgreSQL
- Streaming responses from LLM
- Chat history in sidebar
- Delete chat functionality

#### API Endpoints
- POST `/api/chat`: Send messages and get responses
- DELETE `/api/chat`: Delete chat sessions
- GET `/api/history`: Fetch chat history

### 3. LM Studio Integration

#### Current Configuration
```env
HYPERBOLIC_API_KEY=your_key_here
HYPERBOLIC_API_ENDPOINT=https://api.hyperbolic.xyz/v1/chat/completions
HYPERBOLIC_MODEL=meta-llama/Llama-3.3-70B-Instruct
```

#### Adding New Models
1. Start LM Studio and load your model
2. Update environment variables:
   ```env
   HYPERBOLIC_API_ENDPOINT=your_lmstudio_endpoint
   HYPERBOLIC_MODEL=your_model_name
   ```
3. Test with small prompts first
4. Adjust model parameters in `app/(chat)/api/chat/route.ts`:
   ```typescript
   {
     max_tokens: 512,
     temperature: 0.7,
     top_p: 0.9,
     stream: true
   }
   ```

## Development Environment Setup

### 1. Database Setup
```bash
# Start PostgreSQL in Docker
docker-compose up -d

# Run database migrations
npm run db:migrate
```

### 2. Environment Variables
Required variables in `.env`:
```env
# Database Configuration
POSTGRES_URL=postgresql://postgres:postgres123@localhost:5432/chatbot

# Authentication
AUTH_SECRET=your_secret
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3001

# LM Studio/Hyperbolic Configuration
HYPERBOLIC_API_KEY=your_key
HYPERBOLIC_API_ENDPOINT=your_endpoint
HYPERBOLIC_MODEL=your_model

# Development Mode
NODE_ENV=development
```

### 3. Running the Application
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Testing

### Local Testing
1. Test database operations:
   ```sql
   -- Check tables
   SELECT COUNT(*) FROM "Chat";
   SELECT COUNT(*) FROM "Message";
   
   -- Check recent messages
   SELECT * FROM "Message" ORDER BY "createdAt" DESC LIMIT 5;
   ```

2. Test chat functionality:
   - Create new chat
   - Send messages
   - Check history
   - Delete chat

### Test Server Deployment
1. Update environment variables for test server
2. Run migrations on test database
3. Test with different LM Studio models
4. Monitor performance and errors

## Troubleshooting

### Common Issues and Solutions

1. Database Connection Issues
   - Check if PostgreSQL container is running
   - Verify connection string
   - Check database logs

2. Chat API Errors
   - Check browser console for errors
   - Verify authentication
   - Check server logs

3. LM Studio Integration
   - Verify API endpoint is accessible
   - Check model loading in LM Studio
   - Monitor response times

## Future Improvements

1. Database
   - Add indexes for better performance
   - Implement chat archiving
   - Add message search functionality

2. Chat Features
   - Add chat categories
   - Implement chat sharing
   - Add file attachments

3. LM Studio Integration
   - Support multiple models
   - Add model switching UI
   - Implement response caching

4. Testing
   - Add automated tests
   - Set up CI/CD pipeline
   - Add performance monitoring
