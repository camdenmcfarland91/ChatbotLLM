# AI Chat Application

## Overview

This is a full-stack AI chat application built with React frontend and Express backend. It provides a conversational AI interface with text and voice chat capabilities, conversation history management, and image generation features. The application uses OpenAI-compatible APIs through Replit AI Integrations for AI functionality.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state and caching
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style variant)
- **Build Tool**: Vite with hot module replacement
- **UI Components**: Radix UI primitives wrapped with shadcn/ui styling

The frontend follows a page-based structure with reusable components. Chat messages support markdown rendering via react-markdown, and the UI includes smooth animations via Framer Motion.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **API Pattern**: RESTful endpoints with streaming support (SSE) for real-time AI responses
- **Build**: ESBuild for production bundling with selective dependency bundling for cold start optimization

The server uses a modular integration pattern with dedicated folders for different AI capabilities (chat, image, audio) under `server/replit_integrations/`.

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` exports models, with actual definitions in `shared/models/`
- **Tables**: 
  - `conversations` - stores chat sessions with title and timestamp
  - `messages` - stores individual messages with role, content, and conversation reference

### Key Design Patterns
- **Shared Types**: Schema and route definitions in `shared/` folder are used by both client and server
- **Streaming Responses**: AI chat responses stream via SSE for real-time text display
- **Audio Worklets**: Web Audio API worklets handle real-time audio playback for voice chat
- **Path Aliases**: TypeScript paths configured for `@/` (client), `@shared/` (shared), and `@assets/` (attached assets)

### API Structure
- `GET/POST /api/conversations` - List and create conversations
- `GET/PATCH/DELETE /api/conversations/:id` - Manage individual conversations
- `POST /api/conversations/:id/messages` - Send messages with streaming response
- `POST /api/conversations/:id/voice-stream` - Voice chat endpoint
- `POST /api/generate-image` - Image generation endpoint

## External Dependencies

### AI Services
- **OpenAI-compatible API**: Accessed via Replit AI Integrations
  - Environment variables: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`
  - Models used: Standard chat models, `gpt-audio-mini` for voice, `gpt-image-1` for images

### Database
- **PostgreSQL**: Connection via `DATABASE_URL` environment variable
- **Session Storage**: connect-pg-simple for PostgreSQL session storage (available but not actively used in current routes)

### Key Runtime Dependencies
- `drizzle-orm` / `drizzle-kit` - Database ORM and migrations
- `openai` - OpenAI SDK for AI API calls
- `react-markdown` / `remark-gfm` - Markdown rendering in chat
- `framer-motion` - UI animations
- `@tanstack/react-query` - Server state management