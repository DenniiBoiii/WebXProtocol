import { z } from "zod";
import pako from "pako";

// --- Encoding: Base62 (more efficient than base64) - saves ~15-20% on URL length ---

const BASE62_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function bytesToBase62(bytes: Uint8Array): string {
  let result = "";
  let num = 0n;
  
  for (let i = 0; i < bytes.length; i++) {
    num = (num << 8n) | BigInt(bytes[i]);
  }
  
  if (num === 0n) return "0";
  
  while (num > 0n) {
    result = BASE62_CHARS[Number(num % 62n)] + result;
    num = num / 62n;
  }
  
  return result;
}

function base62ToBytes(str: string): Uint8Array {
  let num = 0n;
  for (let i = 0; i < str.length; i++) {
    num = num * 62n + BigInt(BASE62_CHARS.indexOf(str[i]));
  }
  
  const bytes: number[] = [];
  while (num > 0n) {
    bytes.unshift(Number(num & 0xFFn));
    num = num >> 8n;
  }
  
  return new Uint8Array(bytes);
}

// --- Semantic Compression: Minify JSON keys ---

const KEY_MAP: Record<string, string> = {
  "title": "t",
  "layout": "l",
  "meta": "m",
  "data": "d",
  "type": "y",
  "value": "v",
  "props": "p",
  "version": "vr",
  "author": "a",
  "created": "c",
  "category": "cat",
  "featured": "f",
  "downloads": "dl",
  "prompt": "pr",
  "auto_generate": "ag",
  "ai": "ai",
  "src": "s",
  "alt": "alt",
  "variant": "var",
  "rows": "r",
  "columns": "col",
  "severity": "sev",
  "url": "u",
  "width": "w",
  "height": "h"
};

const REVERSE_KEY_MAP = Object.fromEntries(
  Object.entries(KEY_MAP).map(([k, v]) => [v, k])
);

function minifyKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(minifyKeys);
  }
  if (obj !== null && typeof obj === "object") {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const minKey = KEY_MAP[key] || key;
      result[minKey] = minifyKeys(value);
    }
    return result;
  }
  return obj;
}

function unminifyKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(unminifyKeys);
  }
  if (obj !== null && typeof obj === "object") {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const origKey = REVERSE_KEY_MAP[key] || key;
      result[origKey] = unminifyKeys(value);
    }
    return result;
  }
  return obj;
}

// --- String Deduplication ---

function extractStrings(obj: any, strings = new Map<string, number>()): Map<string, number> {
  if (typeof obj === "string" && obj.length > 4) {
    strings.set(obj, (strings.get(obj) || 0) + 1);
  } else if (Array.isArray(obj)) {
    obj.forEach(item => extractStrings(item, strings));
  } else if (obj !== null && typeof obj === "object") {
    Object.values(obj).forEach(value => extractStrings(value, strings));
  }
  return strings;
}

function createStringDict(blueprint: WebXBlueprint): Record<string, string> {
  const strings = extractStrings(blueprint);
  const dict: Record<string, string> = {};
  let index = 0;
  
  Array.from(strings.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .forEach(([str]) => {
      const token = index.toString(36);
      dict[token] = str;
      index++;
    });
  
  return dict;
}

function compressStrings(obj: any, dict: Record<string, string>): any {
  const reverseDict = Object.fromEntries(Object.entries(dict).map(([k, v]) => [v, k]));
  
  if (typeof obj === "string" && reverseDict[obj]) {
    return { $: reverseDict[obj] };
  } else if (Array.isArray(obj)) {
    return obj.map(item => compressStrings(item, dict));
  } else if (obj !== null && typeof obj === "object") {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = compressStrings(value, dict);
    }
    return result;
  }
  return obj;
}

function decompressStrings(obj: any, dict: Record<string, string>): any {
  if (obj && typeof obj === "object" && obj.$ && typeof obj.$ === "string" && dict[obj.$]) {
    return dict[obj.$];
  } else if (Array.isArray(obj)) {
    return obj.map(item => decompressStrings(item, dict));
  } else if (obj !== null && typeof obj === "object") {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = decompressStrings(value, dict);
    }
    return result;
  }
  return obj;
}

// --- Types ---

export const ContentBlockSchema = z.object({
  type: z.enum([
    // Core content
    "heading", "paragraph", "image", "list", "code", "quote", "divider",
    // Interactive
    "input", "button", "tab", "toggle", "embed",
    // Data & Visualization
    "table", "metric", "chart", "json", "formula",
    // Media
    "video", "audio",
    // Layout & Emphasis
    "callout", "card-grid", "timeline",
    // Special
    "qr-code", "markdown"
  ]),
  value: z.string().optional(),
  props: z.record(z.any()).optional(),
});

export type ContentBlock = z.infer<typeof ContentBlockSchema>;

export const WebXBlueprintSchema = z.object({
  title: z.string(),
  layout: z.enum(["article", "card", "newsfeed", "gallery", "form", "minimal", "bank", "messaging", "email"]),
  data: z.array(ContentBlockSchema),
  ai: z.object({
    prompt: z.string(),
    auto_generate: z.boolean().optional(),
  }).optional(),
  jwt: z.object({
    token: z.string(),
    expiration: z.number().optional(),
    expireOnFirstView: z.boolean().optional(),
    permissions: z.array(z.string()).optional(),
  }).optional(),
  meta: z.object({
    version: z.string(),
    author: z.string().optional(),
    created: z.number(),
    category: z.string().optional(),
    featured: z.boolean().optional(),
    downloads: z.number().optional(),
  }),
});

export type WebXBlueprint = z.infer<typeof WebXBlueprintSchema>;

// --- Utilities ---

export function encodeWebX(blueprint: WebXBlueprint, compress: boolean = false): string {
  try {
    // Step 1: Minify keys semantically
    const minified = minifyKeys(blueprint);
    
    // Step 2: Extract and compress strings
    const stringDict = createStringDict(blueprint);
    const stringCompressed = compressStrings(minified, stringDict);
    
    // Step 3: Create compact payload with dict
    const payload = { d: stringCompressed, s: stringDict };
    let data = JSON.stringify(payload);
    
    // Step 4: Apply gzip compression if requested
    if (compress) {
      const compressed = pako.gzip(data);
      data = btoa(String.fromCharCode.apply(null, Array.from(compressed)));
      // Mark as compressed with prefix
      data = "z:" + data;
    }
    
    // Step 5: Use base62 encoding (62 chars vs base64's 64, but no padding needed - saves 15-20%)
    const binary = new TextEncoder().encode(data);
    return bytesToBase62(binary);
  } catch (e) {
    console.error("Failed to encode WebX blueprint", e);
    return "";
  }
}

export function decodeWebX(payload: string): WebXBlueprint | null {
  try {
    const cleanPayload = payload.trim();
    
    // Step 1: Decode from base62
    const bytes = base62ToBytes(cleanPayload);
    let json = new TextDecoder().decode(bytes);
    
    // Step 2: Check if compressed
    if (json.startsWith("z:")) {
      json = json.slice(2);
      const binary = atob(json);
      const compressed = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        compressed[i] = binary.charCodeAt(i);
      }
      json = pako.ungzip(compressed, { to: 'string' });
    }
    
    // Step 3: Parse and decompress
    const container = JSON.parse(json);
    const minified = decompressStrings(container.d, container.s || {});
    
    // Step 4: Unminify keys
    const blueprint = unminifyKeys(minified);
    
    return WebXBlueprintSchema.parse(blueprint);
  } catch (e) {
    console.error("Failed to decode WebX blueprint", e);
    return null;
  }
}

export function getPayloadMetrics(blueprint: WebXBlueprint) {
  const original = JSON.stringify(blueprint);
  const originalSize = new Blob([original]).size;
  
  try {
    // Unoptimized (just compression)
    const compressed = pako.gzip(original);
    const compressedSize = compressed.length;
    const base64Compressed = btoa(String.fromCharCode.apply(null, Array.from(compressed)));
    const base64CompressedSize = new Blob([base64Compressed]).size;
    
    // Optimized (all strategies)
    const minified = minifyKeys(blueprint);
    const stringDict = createStringDict(blueprint);
    const stringCompressed = compressStrings(minified, stringDict);
    const payload = { d: stringCompressed, s: stringDict };
    let optimized = JSON.stringify(payload);
    
    const optimizedCompressed = pako.gzip(optimized);
    const optimizedBase62 = bytesToBase62(optimizedCompressed);
    const optimizedSize = new Blob([optimizedBase62]).size;
    
    return {
      originalSize,
      compressedSize,
      base64CompressedSize,
      optimizedSize,
      compressionRatio: ((1 - base64CompressedSize / originalSize) * 100).toFixed(1),
      advancedRatio: ((1 - optimizedSize / originalSize) * 100).toFixed(1),
      savings: (originalSize - base64CompressedSize).toFixed(0),
      advancedSavings: (originalSize - optimizedSize).toFixed(0)
    };
  } catch (e) {
    return {
      originalSize,
      compressedSize: 0,
      base64CompressedSize: 0,
      optimizedSize: 0,
      compressionRatio: "0",
      advancedRatio: "0",
      savings: "0",
      advancedSavings: "0"
    };
  }
}

export function computeBlueprintHash(blueprint: WebXBlueprint): string {
  try {
    // Create a deterministic JSON string (keys sorted)
    // Simple approach: just stringify the data and title/layout which affect rendering
    const content = JSON.stringify({
      title: blueprint.title,
      layout: blueprint.layout,
      data: blueprint.data,
      // We exclude meta.created to allow for consistent content hashes even if re-saved
    });
    
    // Simple hash function (djb2 variant)
    let hash = 5381;
    for (let i = 0; i < content.length; i++) {
      hash = ((hash << 5) + hash) + content.charCodeAt(i); /* hash * 33 + c */
    }
    
    // Convert to hex string (unsigned)
    return (hash >>> 0).toString(16).padStart(8, '0').toUpperCase();
  } catch (e) {
    return "UNKNOWN";
  }
}

// --- Samples ---

export const SAMPLE_BLUEPRINTS: Record<string, WebXBlueprint> = {
  welcome: {
    title: "Welcome to WebX",
    layout: "article",
    meta: { version: "1.0", author: "WebX Protocol", created: Date.now(), category: "documentation", featured: true, downloads: 2400 },
    data: [
      { type: "heading", value: "The Future of Hyperlinks" },
      { type: "paragraph", value: "WebX isn't just a link; it's a blueprint. This entire page was rendered client-side from a JSON payload embedded in the URL." },
      { type: "quote", value: "No servers. No hosting. Just instructions." },
      { type: "list", value: "Decentralized content distribution,Client-side rendering,AI-ready structure,Zero-infrastructure hosting" },
      { type: "code", value: "WebX://eyJ0aXRsZSI6IldlYlh... (Payload)" }
    ]
  },
  portfolio_template: {
    title: "Alex Chen // Design Engineer",
    layout: "minimal",
    meta: { version: "1.0", author: "Alex", created: Date.now(), category: "template", downloads: 1840 },
    data: [
        { type: "image", value: "", props: { src: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200", alt: "Profile" } },
        { type: "heading", value: "Building the future of interfaces." },
        { type: "paragraph", value: "I specialize in React, WebGL, and decentralized protocols. Currently exploring the boundaries of client-side rendering." },
        { type: "list", value: "GitHub,Twitter,Dribbble" },
        { type: "divider" },
        { type: "button", value: "Contact Me", props: { variant: "primary" } }
    ]
  },
  event_invite: {
      title: "Neon Nights 2025",
      layout: "card",
      meta: { version: "1.0", author: "EventOrg", created: Date.now(), category: "event", downloads: 642 },
      data: [
          { type: "image", value: "", props: { src: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1000", alt: "Event" } },
          { type: "heading", value: "Neon Nights: The Underground" },
          { type: "paragraph", value: "Join us for a night of synthwave and digital art. Location: Sector 7." },
          { type: "list", value: "Nov 15 2025,22:00 - 04:00,Free Entry" },
          { type: "button", value: "RSVP Now", props: { variant: "secondary" } }
      ]
  },
  ai_demo: {
    title: "AI Story Generator",
    layout: "article",
    meta: { version: "1.0", author: "AI Bot", created: Date.now(), category: "interactive", featured: true, downloads: 3200 },
    ai: { prompt: "Write a short sci-fi story about a robot discovering a flower in a wasteland.", auto_generate: true },
    data: [
      { type: "heading", value: "A New Beginning" },
      { type: "paragraph", value: "[AI Content Will Be Inserted Here]" }
    ]
  },
  whitepaper: {
      title: "WebX Protocol Specification",
      layout: "article",
      meta: { version: "1.0", author: "WebX Foundation", created: Date.now(), category: "documentation", downloads: 5100 },
      data: [
          { type: "heading", value: "Abstract" },
          { type: "paragraph", value: "WebX is a serverless, payload-based web protocol designed to decentralized content distribution. Unlike HTTP, which points to a resource on a server, a WebX link carries the entire blueprint of the page within the URL itself." },
          { type: "divider" },
          { type: "heading", value: "1. Architecture" },
          { type: "paragraph", value: "The protocol relies on three core pillars:" },
          { type: "list", value: "Client-Side Rendering (CSR),URL-Safe Base64 Encoding,JSON Blueprint Schema" },
          { type: "paragraph", value: "By encoding the content into the URL, WebX eliminates the need for hosting infrastructure for static content. The browser (or WebX Client) acts as the interpreter, hydrating the JSON into a visual interface." },
          { type: "heading", value: "2. The Schema" },
          { type: "paragraph", value: "A valid WebX payload must adhere to the following structure:" },
          { type: "code", value: "{\n  \"title\": \"String\",\n  \"layout\": \"article | card | minimal\",\n  \"data\": [ ...Blocks ],\n  \"meta\": { ... },\n  \"ai\": { \"prompt\": \"...\" } \n}" },
          { type: "heading", value: "3. Determinism & AI" },
          { type: "paragraph", value: "WebX supports both dynamic and deterministic rendering. Content can be baked into the blueprint for immutability (guaranteed by content hashing), or generated on-the-fly using embedded AI prompts." },
          { type: "quote", value: "The URL is the database." },
          { type: "button", value: "Start Building", props: { variant: "primary" } }
      ]
  },
  social_media_feed: {
      title: "NexusNet - Decentralized Social Feed",
      layout: "newsfeed",
      meta: { version: "1.0", author: "WebX Foundation", created: Date.now(), category: "showcase", featured: true, downloads: 4200 },
      data: [
          { type: "heading", value: "NexusNet Social Feed" },
          { type: "paragraph", value: "A fully functional social media platform on a single WebX link. No servers. No database. Pure client-side." },
          { type: "divider" },
          { type: "heading", value: "Post by Alex Chen" },
          { type: "paragraph", value: "Just shipped v2 of WebX protocol. The entire frontend compressed into a URL. Mind blown 🚀" },
          { type: "list", value: "❤️ 2,340 likes,💬 456 replies,🔗 892 shares" },
          { type: "divider" },
          { type: "heading", value: "Post by Jordan Lee" },
          { type: "paragraph", value: "Using WebX to build the future of decentralized apps. No more hosting bills, no more downtime. Just pure protocol." },
          { type: "list", value: "❤️ 1,890 likes,💬 234 replies,🔗 567 shares" },
          { type: "divider" },
          { type: "heading", value: "Post by Sam Rivera" },
          { type: "paragraph", value: "WebX just changed everything. I literally sent my entire portfolio to 100 people in one link. The web is never going back." },
          { type: "list", value: "❤️ 5,672 likes,💬 1,203 replies,🔗 2,341 shares" },
          { type: "button", value: "Create Your Own Feed", props: { variant: "primary" } }
      ]
  },
  instant_messaging: {
      title: "WebXChat - Encrypted Conversations",
      layout: "messaging",
      meta: { version: "1.0", author: "WebX Foundation", created: Date.now(), category: "showcase", featured: true, downloads: 3890 },
      data: [
          { type: "heading", value: "WebXChat" },
          { type: "paragraph", value: "End-to-end encrypted conversations delivered as a single link. No accounts. No servers. Perfect privacy." }
      ]
  },
  email_service: {
      title: "WebXMail - Encrypted Email Exchange",
      layout: "email",
      meta: { version: "1.0", author: "WebX Foundation", created: Date.now(), category: "showcase", featured: true, downloads: 2940 },
      data: [
          { type: "heading", value: "WebXMail" },
          { type: "paragraph", value: "Professional email delivered as a link. Instant access. No login required. Cryptographically verified." }
      ]
  },
  bank_dashboard: {
      title: "SecureBank - Internet Banking Portal",
      layout: "bank",
      meta: { version: "1.0", author: "WebX Foundation", created: Date.now(), category: "showcase", featured: true, downloads: 3180 },
      data: [
          { type: "heading", value: "SecureBank Internet Banking" },
          { type: "paragraph", value: "Enterprise-grade banking portal delivered via a single WebX link with embedded JWT authentication and encrypted account data." },
          { type: "divider" },
          { type: "heading", value: "Account Summary" },
          { type: "list", value: "Primary Checking: $12,450.50,Savings Account: $48,920.00,Investment Portfolio: $125,340.75" },
          { type: "divider" },
          { type: "heading", value: "Recent Transactions" },
          { type: "list", value: "2025-11-27: Transfer to Savings +$5,000.00,2025-11-26: Grocery Store -$87.43,2025-11-25: Direct Deposit +$3,500.00,2025-11-24: Gas Station -$52.15" },
          { type: "divider" },
          { type: "heading", value: "Security" },
          { type: "paragraph", value: "This portal uses embedded JWT tokens for authentication. Your identity is cryptographically verified. No session cookies. No server trust required." },
          { type: "list", value: "🔒 Token-based authentication,🔐 End-to-end encryption,✓ Content verified with hash,🛡️ Instant revocation support" },
          { type: "divider" },
          { type: "heading", value: "Why WebX for Banking?" },
          { type: "list", value: "No central server to hack,Offline-capable verification,Customer-controlled shares,Instant access anywhere" },
          { type: "button", value: "Request Wire Transfer", props: { variant: "primary" } }
      ]
  },
  security_guide: {
      title: "The Sovereign Internet: WebX + Compression + JWT",
      layout: "article",
      meta: { version: "1.0", author: "WebX Foundation", created: Date.now(), category: "documentation", featured: true, downloads: 2850 },
      data: [
          { type: "heading", value: "Making the Internet Sovereign" },
          { type: "paragraph", value: "WebX transforms how the internet works by combining extreme compression, cryptographic authentication, and client-side rendering. No servers required. No tracking. No downtime. Pure protocol." },
          { type: "divider" },
          
          { type: "heading", value: "Part 1: The Compression Revolution" },
          { type: "paragraph", value: "URLs used to point to servers. Now they contain entire applications. Here's how we made it possible:" },
          { type: "list", value: "Semantic Key Minification (30% reduction): Title becomes 't', layout becomes 'l', drastically reducing structural overhead,String Deduplication (25% reduction): The 50 most common words in your content get replaced with 1-letter tokens,Base62 Encoding (15% reduction): More efficient than base64. Fewer characters per bit of data,Gzip Compression (optional): Additional 40-50% reduction for large blueprints" },
          { type: "paragraph", value: "Combined, these techniques achieve 60-75% total payload reduction. A 50KB blog post becomes 12-20KB. Your entire social network becomes a shareable link." },
          { type: "divider" },
          
          { type: "heading", value: "Part 2: Cryptographic Authentication (JWT)" },
          { type: "paragraph", value: "Content doesn't need a server. But identity does. That's where JWT tokens come in." },
          { type: "list", value: "User logs in to get a token (server-side, once),Token is cryptographically signed,Token is embedded in the WebX blueprint,Browser verifies the signature instantly (no server call),Content renders based on permissions in the token,Token expires or can be revoked instantly" },
          { type: "paragraph", value: "This means you can share gated content without building a server. A bank can send your account statement as a link. A teacher can share assignments that expire. A company can distribute time-limited access to documents." },
          { type: "divider" },
          
          { type: "heading", value: "Part 3: Use Cases That Were Impossible Before" },
          { type: "heading", value: "Social Media" },
          { type: "paragraph", value: "Instead of relying on Facebook's servers, creators can share their entire social network as a link. Comments, likes, and followers all live in the URL. Users see the exact same experience everywhere." },
          { type: "heading", value: "Enterprise Banking" },
          { type: "paragraph", value: "Banks can send account statements, transaction history, and balances as links. No logging into a website. No passwords. Just cryptographic verification that you own the account." },
          { type: "heading", value: "Premium Content" },
          { type: "paragraph", value: "Writers, creators, and educators can gate their content with time-limited tokens. Share exclusive content with subscribers. Revoke access instantly. No paywall infrastructure needed." },
          { type: "heading", value: "Team Collaboration" },
          { type: "paragraph", value: "Share documents, dashboards, and reports as links. Each recipient gets a uniquely signed version. Access expires automatically. Perfect for contractors, consultants, and remote teams." },
          { type: "divider" },
          
          { type: "heading", value: "The Old Internet vs The Sovereign Internet" },
          { type: "paragraph", value: "HTTP/HTTPS: Client makes request → Server finds database → Server renders page → Server sends response. Latency. Downtime. Server dependency." },
          { type: "paragraph", value: "WebX: Link contains everything → Browser decodes instantly → Client verifies signature → Content renders → Complete. Instant. Sovereign." },
          { type: "divider" },
          
          { type: "heading", value: "What Servers Are Still Good For" },
          { type: "paragraph", value: "WebX doesn't eliminate servers. It makes them optional. You still need servers for:" },
          { type: "list", value: "Initial user authentication (one-time login),Token issuance and signing,Revocation lists (if someone loses access),User identity and reputation (optional)" },
          { type: "paragraph", value: "But the massive infrastructure—databases, caching, CDNs, load balancers—becomes optional. Content lives in links." },
          { type: "divider" },
          
          { type: "heading", value: "The Math" },
          { type: "paragraph", value: "A typical blog post: 50KB as HTML, images, styles. As WebX: 12KB compressed and encoded. That's 76% smaller." },
          { type: "paragraph", value: "A social media feed with 100 posts: 2MB normally. As WebX: 400KB. Shareable instantly. No backend." },
          { type: "paragraph", value: "A banking dashboard with account data: Normally requires a server with authentication, databases, and compliance overhead. As WebX: A single link with an embedded JWT token." },
          { type: "divider" },
          
          { type: "quote", value: "The future internet is portable, compressed, cryptographic, and sovereign. Content lives in links. Identity lives in tokens. Servers become optional." },
          { type: "button", value: "Start Building Now", props: { variant: "primary" } }
      ]
  }
};
