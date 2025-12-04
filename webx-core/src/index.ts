import { z } from "zod";
import pako from "pako";

// --- Encoding: Base62 (more efficient than base64) - saves ~15-20% on URL length ---

const BASE62_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function bytesToBase62(bytes: Uint8Array): string {
  let result = "";
  let num = BigInt(0);
  
  for (let i = 0; i < bytes.length; i++) {
    num = (num << BigInt(8)) | BigInt(bytes[i]);
  }
  
  if (num === BigInt(0)) return "0";
  
  while (num > BigInt(0)) {
    result = BASE62_CHARS[Number(num % BigInt(62))] + result;
    num = num / BigInt(62);
  }
  
  return result;
}

function base62ToBytes(str: string): Uint8Array {
  let num = BigInt(0);
  for (let i = 0; i < str.length; i++) {
    num = num * BigInt(62) + BigInt(BASE62_CHARS.indexOf(str[i]));
  }
  
  const bytes: number[] = [];
  while (num > BigInt(0)) {
    bytes.unshift(Number(num & BigInt(0xFF)));
    num = num >> BigInt(8);
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

function minifyKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(minifyKeys);
  }
  if (obj !== null && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const minKey = KEY_MAP[key] || key;
      result[minKey] = minifyKeys(value);
    }
    return result;
  }
  return obj;
}

function unminifyKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(unminifyKeys);
  }
  if (obj !== null && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const origKey = REVERSE_KEY_MAP[key] || key;
      result[origKey] = unminifyKeys(value);
    }
    return result;
  }
  return obj;
}

// --- String Deduplication ---

function extractStrings(obj: unknown, strings = new Map<string, number>()): Map<string, number> {
  if (typeof obj === "string" && obj.length > 4) {
    strings.set(obj, (strings.get(obj) || 0) + 1);
  } else if (Array.isArray(obj)) {
    obj.forEach(item => extractStrings(item, strings));
  } else if (obj !== null && typeof obj === "object") {
    Object.values(obj as Record<string, unknown>).forEach(value => extractStrings(value, strings));
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

function compressStrings(obj: unknown, dict: Record<string, string>): unknown {
  const reverseDict = Object.fromEntries(Object.entries(dict).map(([k, v]) => [v, k]));
  
  if (typeof obj === "string" && reverseDict[obj]) {
    return { $: reverseDict[obj] };
  } else if (Array.isArray(obj)) {
    return obj.map(item => compressStrings(item, dict));
  } else if (obj !== null && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = compressStrings(value, dict);
    }
    return result;
  }
  return obj;
}

function decompressStrings(obj: unknown, dict: Record<string, string>): unknown {
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    const record = obj as Record<string, unknown>;
    if (record.$ && typeof record.$ === "string" && dict[record.$]) {
      return dict[record.$];
    }
  }
  if (Array.isArray(obj)) {
    return obj.map(item => decompressStrings(item, dict));
  }
  if (obj !== null && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = decompressStrings(value, dict);
    }
    return result;
  }
  return obj;
}

// --- Content Block Types ---

export const CONTENT_BLOCK_TYPES = [
  "heading", "paragraph", "image", "list", "code", "quote", "divider",
  "input", "button", "tab", "toggle", "embed",
  "table", "metric", "chart", "json", "formula",
  "video", "audio",
  "callout", "card-grid", "timeline",
  "qr-code", "markdown"
] as const;

export type ContentBlockType = typeof CONTENT_BLOCK_TYPES[number];

export const LAYOUT_TYPES = [
  "article", "card", "newsfeed", "gallery", "form", 
  "minimal", "bank", "messaging", "email", "postcard", "video-call"
] as const;

export type LayoutType = typeof LAYOUT_TYPES[number];

// --- Zod Schemas ---

export const ContentBlockSchema = z.object({
  type: z.enum(CONTENT_BLOCK_TYPES),
  value: z.string().optional(),
  props: z.record(z.unknown()).optional(),
});

export type ContentBlock = z.infer<typeof ContentBlockSchema>;

export const WebXBlueprintSchema = z.object({
  title: z.string(),
  layout: z.enum(LAYOUT_TYPES),
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
    to: z.string().optional(),
  }),
});

export type WebXBlueprint = z.infer<typeof WebXBlueprintSchema>;

// --- Encoding Options ---

export interface EncodeOptions {
  compress?: boolean;
}

export interface DecodeResult {
  blueprint: WebXBlueprint;
  raw: string;
}

// --- Core Functions ---

/**
 * Encode a WebX blueprint into a URL-safe string
 * 
 * @param blueprint - The WebX blueprint to encode
 * @param options - Encoding options (compress: boolean)
 * @returns Encoded string ready for URL embedding
 * 
 * @example
 * ```ts
 * const blueprint = {
 *   title: "Hello World",
 *   layout: "article",
 *   meta: { version: "1.0", created: Date.now() },
 *   data: [
 *     { type: "heading", value: "Welcome" },
 *     { type: "paragraph", value: "This is WebX!" }
 *   ]
 * };
 * 
 * const encoded = encodeWebX(blueprint);
 * const url = `webx://page?data=${encoded}`;
 * ```
 */
export function encodeWebX(blueprint: WebXBlueprint, options: EncodeOptions = {}): string {
  const { compress = false } = options;
  
  try {
    const minified = minifyKeys(blueprint);
    const stringDict = createStringDict(blueprint);
    const stringCompressed = compressStrings(minified, stringDict);
    const payload = { d: stringCompressed, s: stringDict };
    let data = JSON.stringify(payload);
    
    if (compress) {
      const compressed = pako.gzip(data);
      data = btoa(String.fromCharCode.apply(null, Array.from(compressed)));
      data = "z:" + data;
    }
    
    const binary = new TextEncoder().encode(data);
    return bytesToBase62(binary);
  } catch (e) {
    console.error("Failed to encode WebX blueprint", e);
    return "";
  }
}

/**
 * Decode a WebX payload string back into a blueprint
 * 
 * @param payload - The encoded WebX string
 * @returns The decoded WebXBlueprint or null if invalid
 * 
 * @example
 * ```ts
 * const payload = "3x7K9..."; // encoded WebX string
 * const blueprint = decodeWebX(payload);
 * 
 * if (blueprint) {
 *   console.log(blueprint.title);
 *   console.log(blueprint.data);
 * }
 * ```
 */
export function decodeWebX(payload: string): WebXBlueprint | null {
  try {
    const cleanPayload = payload.trim();
    const bytes = base62ToBytes(cleanPayload);
    let json = new TextDecoder().decode(bytes);
    
    if (json.startsWith("z:")) {
      json = json.slice(2);
      const binary = atob(json);
      const compressed = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        compressed[i] = binary.charCodeAt(i);
      }
      json = pako.ungzip(compressed, { to: 'string' });
    }
    
    const container = JSON.parse(json);
    const minified = decompressStrings(container.d, container.s || {});
    const blueprint = unminifyKeys(minified);
    
    return WebXBlueprintSchema.parse(blueprint);
  } catch (e) {
    console.error("Failed to decode WebX blueprint", e);
    return null;
  }
}

/**
 * Create a complete WebX URL from a blueprint
 * 
 * @param blueprint - The WebX blueprint
 * @param options - Encoding options
 * @returns Full WebX URL (webx://page?data=...)
 * 
 * @example
 * ```ts
 * const url = createWebXUrl(blueprint);
 * // Returns: webx://page?data=3x7K9...
 * ```
 */
export function createWebXUrl(blueprint: WebXBlueprint, options: EncodeOptions = {}): string {
  const encoded = encodeWebX(blueprint, options);
  return `webx://page?data=${encoded}`;
}

/**
 * Parse a WebX URL and extract the blueprint
 * 
 * @param url - The WebX URL to parse
 * @returns The decoded blueprint or null
 * 
 * @example
 * ```ts
 * const blueprint = parseWebXUrl("webx://page?data=3x7K9...");
 * ```
 */
export function parseWebXUrl(url: string): WebXBlueprint | null {
  try {
    if (url.startsWith("webx://")) {
      const parsed = new URL(url.replace("webx://", "https://"));
      const data = parsed.searchParams.get("data");
      if (data) {
        return decodeWebX(data);
      }
    }
    return decodeWebX(url);
  } catch {
    return null;
  }
}

// --- Utility Functions ---

/**
 * Get compression metrics for a blueprint
 * 
 * @param blueprint - The blueprint to analyze
 * @returns Compression statistics
 */
export function getPayloadMetrics(blueprint: WebXBlueprint) {
  const original = JSON.stringify(blueprint);
  const originalSize = new Blob([original]).size;
  
  try {
    const compressed = pako.gzip(original);
    const compressedSize = compressed.length;
    const base64Compressed = btoa(String.fromCharCode.apply(null, Array.from(compressed)));
    const base64CompressedSize = new Blob([base64Compressed]).size;
    
    const minified = minifyKeys(blueprint);
    const stringDict = createStringDict(blueprint);
    const stringCompressed = compressStrings(minified, stringDict);
    const payload = { d: stringCompressed, s: stringDict };
    const optimized = JSON.stringify(payload);
    
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
  } catch {
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

/**
 * Compute a deterministic hash for a blueprint
 * Useful for content verification and deduplication
 * 
 * @param blueprint - The blueprint to hash
 * @returns 8-character hex hash
 */
export function computeBlueprintHash(blueprint: WebXBlueprint): string {
  try {
    const content = JSON.stringify({
      title: blueprint.title,
      layout: blueprint.layout,
      data: blueprint.data,
    });
    
    let hash = 5381;
    for (let i = 0; i < content.length; i++) {
      hash = ((hash << 5) + hash) + content.charCodeAt(i);
    }
    
    return (hash >>> 0).toString(16).padStart(8, '0').toUpperCase();
  } catch {
    return "UNKNOWN";
  }
}

/**
 * Validate a blueprint against the WebX schema
 * 
 * @param blueprint - Object to validate
 * @returns Validation result with success flag and errors
 */
export function validateBlueprint(blueprint: unknown): { 
  success: boolean; 
  data?: WebXBlueprint; 
  errors?: z.ZodError 
} {
  const result = WebXBlueprintSchema.safeParse(blueprint);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Create a minimal blueprint with defaults
 * 
 * @param title - Page title
 * @param content - Array of content blocks
 * @param options - Additional options
 * @returns A valid WebXBlueprint
 */
export function createBlueprint(
  title: string,
  content: ContentBlock[],
  options: {
    layout?: LayoutType;
    author?: string;
    category?: string;
  } = {}
): WebXBlueprint {
  return {
    title,
    layout: options.layout || "article",
    meta: {
      version: "1.0",
      author: options.author,
      created: Date.now(),
      category: options.category,
    },
    data: content,
  };
}

// --- Helper for building content blocks ---

export const block = {
  heading: (text: string): ContentBlock => ({ type: "heading", value: text }),
  paragraph: (text: string): ContentBlock => ({ type: "paragraph", value: text }),
  image: (src: string, alt?: string): ContentBlock => ({ 
    type: "image", 
    value: "", 
    props: { src, alt: alt || "" } 
  }),
  list: (items: string[]): ContentBlock => ({ type: "list", value: items.join(",") }),
  code: (code: string, language?: string): ContentBlock => ({ 
    type: "code", 
    value: code, 
    props: language ? { language } : undefined 
  }),
  quote: (text: string): ContentBlock => ({ type: "quote", value: text }),
  divider: (): ContentBlock => ({ type: "divider" }),
  button: (text: string, variant?: "primary" | "secondary"): ContentBlock => ({ 
    type: "button", 
    value: text, 
    props: variant ? { variant } : undefined 
  }),
  callout: (text: string, severity?: "info" | "warning" | "error" | "success"): ContentBlock => ({
    type: "callout",
    value: text,
    props: severity ? { severity } : undefined
  }),
  markdown: (content: string): ContentBlock => ({ type: "markdown", value: content }),
  json: (data: unknown): ContentBlock => ({ type: "json", value: JSON.stringify(data) }),
};

// --- Export key maps for advanced usage ---
export { KEY_MAP, REVERSE_KEY_MAP };
