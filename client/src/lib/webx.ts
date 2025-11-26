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
    // Restore standard base64 characters
    let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
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
  }
};
