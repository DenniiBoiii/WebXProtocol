import { z } from "zod";

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
  }),
});

export type WebXBlueprint = z.infer<typeof WebXBlueprintSchema>;

// --- Utilities ---

export function encodeWebX(blueprint: WebXBlueprint): string {
  try {
    const json = JSON.stringify(blueprint);
    // URL-safe base64 encoding
    return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
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
    
    const json = atob(base64);
    const parsed = JSON.parse(json);
    return WebXBlueprintSchema.parse(parsed);
  } catch (e) {
    console.error("Failed to decode WebX blueprint", e);
    return null;
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
    meta: { version: "1.0", author: "WebX Protocol", created: Date.now() },
    data: [
      { type: "heading", value: "The Future of Hyperlinks" },
      { type: "paragraph", value: "WebX isn't just a link; it's a blueprint. This entire page was rendered client-side from a JSON payload embedded in the URL." },
      { type: "quote", value: "No servers. No hosting. Just instructions." },
      { type: "list", value: "Decentralized content distribution,Client-side rendering,AI-ready structure,Zero-infrastructure hosting" },
      { type: "code", value: "WebX://eyJ0aXRsZSI6IldlYlh... (Payload)" }
    ]
  },
  product: {
    title: "CyberDeck 2077",
    layout: "card",
    meta: { version: "1.0", author: "TechCorp", created: Date.now() },
    data: [
      { type: "image", value: "", props: { src: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1000", alt: "Cyberpunk Device" } },
      { type: "heading", value: "CyberDeck 2077" },
      { type: "paragraph", value: "The ultimate portable hacking terminal. Features a neural link interface and quantum encryption." },
      { type: "button", value: "Pre-order - 5000 Credits", props: { variant: "primary" } }
    ]
  },
  ai_demo: {
    title: "AI Story Generator",
    layout: "article",
    meta: { version: "1.0", author: "AI Bot", created: Date.now() },
    ai: { prompt: "Write a short sci-fi story about a robot discovering a flower in a wasteland.", auto_generate: true },
    data: [
      { type: "heading", value: "A New Beginning" },
      { type: "paragraph", value: "[AI Content Will Be Inserted Here]" }
    ]
  },
  whitepaper: {
      title: "WebX Protocol Specification",
      layout: "article",
      meta: { version: "1.0", author: "WebX Foundation", created: Date.now() },
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
  }
};
