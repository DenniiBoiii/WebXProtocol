import { z } from "zod";
import pako from "pako";

// --- Types ---

export const ContentBlockSchema = z.object({
  type: z.enum(["heading", "paragraph", "image", "list", "code", "input", "button", "quote", "divider"]),
  value: z.string().optional(),
  props: z.record(z.any()).optional(),
});

export type ContentBlock = z.infer<typeof ContentBlockSchema>;

export const WebXBlueprintSchema = z.object({
  title: z.string(),
  layout: z.enum(["article", "card", "newsfeed", "gallery", "form", "minimal"]),
  data: z.array(ContentBlockSchema),
  ai: z.object({
    prompt: z.string(),
    auto_generate: z.boolean().optional(),
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
    let data = JSON.stringify(blueprint);
    
    if (compress) {
      // Compress with gzip
      const compressed = pako.gzip(data);
      data = btoa(String.fromCharCode.apply(null, Array.from(compressed)));
    }
    
    // URL-safe base64 encoding
    return btoa(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) {
    console.error("Failed to encode WebX blueprint", e);
    return "";
  }
}

export function decodeWebX(payload: string): WebXBlueprint | null {
  try {
    // Clean the payload of any whitespace
    let cleanPayload = payload.trim();
    
    // Restore standard base64 characters
    let base64 = cleanPayload.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding if needed
    while (base64.length % 4) {
      base64 += '=';
    }
    
    let json = atob(base64);
    
    // Try to decompress if it looks like gzip
    try {
      const binary = atob(json);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      json = pako.ungzip(bytes, { to: 'string' });
    } catch {
      // Not compressed, continue with uncompressed json
    }
    
    const parsed = JSON.parse(json);
    return WebXBlueprintSchema.parse(parsed);
  } catch (e) {
    console.error("Failed to decode WebX blueprint", e);
    return null;
  }
}

export function getPayloadMetrics(blueprint: WebXBlueprint) {
  const original = JSON.stringify(blueprint);
  const originalSize = new Blob([original]).size;
  
  try {
    const compressed = pako.gzip(original);
    const compressedSize = compressed.length;
    const base64Compressed = btoa(String.fromCharCode.apply(null, Array.from(compressed)));
    const base64CompressedSize = new Blob([base64Compressed]).size;
    
    return {
      originalSize,
      compressedSize,
      base64CompressedSize,
      compressionRatio: ((1 - base64CompressedSize / originalSize) * 100).toFixed(1),
      savings: (originalSize - base64CompressedSize).toFixed(0)
    };
  } catch (e) {
    return {
      originalSize,
      compressedSize: 0,
      base64CompressedSize: 0,
      compressionRatio: "0",
      savings: "0"
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
  security_guide: {
      title: "WebX + JWT: The Sovereign Internet",
      layout: "article",
      meta: { version: "1.0", author: "WebX Foundation", created: Date.now(), category: "documentation", featured: true, downloads: 2850 },
      data: [
          { type: "heading", value: "The Truth About WebX & Auth" },
          { type: "paragraph", value: "WebX can deliver authenticated, gated content using cryptographic JWTs. No constant server calls needed." },
          { type: "divider" },
          { type: "heading", value: "How It Works" },
          { type: "list", value: "User logs in,Gets a signed JWT token,Token embedded in WebX link,Browser verifies signature,Content renders based on permissions" },
          { type: "heading", value: "Real Use Cases" },
          { type: "list", value: "Premium gated blogs,Team-only documents,Time-limited access shares,Role-based content" },
          { type: "heading", value: "The Shift" },
          { type: "paragraph", value: "Instead of trusting corporate servers, trust cryptography. Instead of server latency, microsecond client-side verification." },
          { type: "heading", value: "Server-Side Still Needed For" },
          { type: "list", value: "Initial login,Token issuance,Revocation lists,User identity" },
          { type: "heading", value: "The Vision" },
          { type: "quote", value: "Content sovereign, identity cryptographic, servers optional." },
          { type: "button", value: "Build Authenticated Apps", props: { variant: "primary" } }
      ]
  }
};
