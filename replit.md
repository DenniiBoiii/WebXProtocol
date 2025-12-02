# WebX Protocol

## Overview

WebX is a next-generation web protocol that reimagines how content is shared on the internet. Instead of traditional hyperlinks that point to servers, WebX links carry the actual page blueprint or instructions encoded directly in the URL. This enables serverless, decentralized content delivery where the link itself contains everything needed to render a complete web page.

The project is a proof-of-concept demonstrating:
- **Blueprint-based pages**: Pages defined as JSON schemas with title, layout, content blocks, and metadata
- **URL-encoded content**: Entire page blueprints compressed and encoded in URL-safe base62 format
- **Client-side rendering**: Zero server dependency for rendering WebX pages
- **Blueprint composer**: Visual editor for creating WebX links without code
- **WebRTC signaling**: Peer-to-peer video calls using WebX links as connection identifiers
- **Blueprint registry**: Shareable marketplace for discovering and downloading WebX blueprints

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript for UI components
- Vite as the build tool and development server
- Wouter for client-side routing (lightweight alternative to React Router)
- TanStack Query for server state management
- Shadcn/ui component library built on Radix UI primitives
- Tailwind CSS v4 with custom theming

**Client Structure:**
- `client/src/pages/` - Route-level page components (Home, Composer, Viewer, Signal, Implement, Whitepaper)
- `client/src/components/` - Reusable UI components from Shadcn
- `client/src/lib/webx.ts` - Core WebX protocol logic (encoding/decoding, compression)
- `client/src/lib/queryClient.ts` - Centralized API request handling

**Key Design Decisions:**
- Single-page application (SPA) architecture for instant navigation
- All WebX rendering happens client-side with zero backend dependency
- URL search parameters carry the encoded blueprint payload
- Base62 encoding with semantic key compression reduces URL length by ~15-20%
- Gzip compression via pako library for larger blueprints

### Backend Architecture

**Technology Stack:**
- Express.js web server
- Node.js with TypeScript and ESM modules
- Drizzle ORM for database operations
- Neon serverless PostgreSQL database
- WebSocket support via ws library

**Server Structure:**
- `server/app.ts` - Express application setup and middleware
- `server/routes.ts` - API endpoints and WebSocket signaling server
- `server/storage.ts` - Storage abstraction layer with in-memory fallback
- `server/db.ts` - Database connection and Drizzle setup

**Key Design Decisions:**
- Dual-mode server: Development (Vite SSR) and production (static serving)
- In-memory storage as fallback if database not provisioned
- WebSocket signaling for WebRTC peer connections (Signal page)
- REST API for blueprint registry CRUD operations
- Database seeding with sample blueprints on startup

### Data Architecture

**Database Schema (PostgreSQL via Drizzle):**
```typescript
blueprints table:
- id: UUID primary key
- title: text
- layout: text (article/card/newsfeed/gallery/form)
- payload: text (encoded WebX string)
- rawData: jsonb (full blueprint for querying)
- category: text
- author: text
- featured: boolean
- downloads: integer
- contentHash: text (for deduplication)
- createdAt: timestamp
```

**WebX Blueprint Schema:**
```typescript
{
  title: string
  layout: "article" | "card" | "newsfeed" | "gallery" | "form"
  meta: { version, author, created, category?, featured?, downloads? }
  data: ContentBlock[] // heading, paragraph, list, image, etc.
  ai?: string // optional AI generation instructions
  jwt?: { expiration?, expireOnFirstView? } // optional time-limited links
}
```

**Rationale:**
- JSONB storage enables flexible querying without rigid schema constraints
- Content hash prevents duplicate blueprints in registry
- Both encoded payload and raw data stored for performance (avoid re-encoding)
- Optional JWT-like expiration fields for ephemeral content

### WebX Protocol Implementation

**Encoding Pipeline:**
1. Minify JSON keys using semantic key map (title→t, layout→l, etc.)
2. JSON.stringify the compressed blueprint
3. Gzip compress using pako
4. Convert bytes to base62 string
5. Prepend with "WebX://" protocol prefix

**Decoding Pipeline:**
1. Remove "WebX://" prefix
2. Base62 decode to bytes
3. Gzip decompress to JSON string
4. Parse JSON and expand minified keys
5. Validate against schema

**Layout Renderers:**
- Article: Traditional blog-style layout with typography
- Card: Centered card UI for focused content
- Newsfeed: Social media-style feed layout
- Gallery: Grid-based image gallery
- Form: Interactive form fields (future enhancement)

### WebRTC Signaling Architecture

**Signal Page Design:**
- Uses WebSocket server for signaling messages
- Room-based architecture (roomId from URL or generated)
- STUN/TURN servers configured for NAT traversal
- Peer-to-peer video/audio after successful connection
- Text chat overlay during calls

**Rationale:**
- WebSockets chosen over polling for real-time, bidirectional signaling
- Free TURN servers (OpenRelay) included for better connectivity
- Room IDs can be shared as WebX links for easy joining

## External Dependencies

### Third-Party Services
- **Neon Database** - Serverless PostgreSQL (optional, has in-memory fallback)
- **STUN Servers** - Google's public STUN servers for WebRTC
- **TURN Servers** - OpenRelay free TURN servers for WebRTC NAT traversal

### Major NPM Packages
- **@radix-ui/*** - Headless UI primitives for accessibility
- **@tanstack/react-query** - Server state management
- **drizzle-orm** - Type-safe SQL ORM
- **pako** - Gzip compression/decompression
- **qrcode.react** - QR code generation for WebX links
- **ws** - WebSocket server for signaling
- **wouter** - Lightweight routing (~1.2KB)
- **zod** - Runtime schema validation
- **jspdf** - PDF generation for whitepaper export

### Development Dependencies
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **@replit/vite-plugin-*** - Replit-specific dev tools

### Asset Dependencies
- **Google Fonts** - Inter, JetBrains Mono, Space Grotesk
- **Lucide Icons** - Icon library
- Generated images in `attached_assets/` for marketing pages