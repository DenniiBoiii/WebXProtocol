# WebX Protocol Core

> **The serverless web protocol where URLs carry complete page blueprints.**

[![npm version](https://badge.fury.io/js/@kbhole/webx-core.svg)](https://www.npmjs.com/package/@kbhole/webx-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

WebX is a next-generation web protocol that reimagines how content is shared on the internet. Instead of traditional hyperlinks that point to servers, WebX links carry the actual page blueprint encoded directly in the URL.

**No servers. No hosting. Just instructions.**

## Features

- **Blueprint-based pages**: Pages defined as JSON schemas with title, layout, and content blocks
- **URL-encoded content**: Entire page blueprints compressed and encoded in URL-safe Base62 format
- **60-75% compression**: Multi-layer compression using semantic key minification, string deduplication, and gzip
- **22+ content block types**: Headings, paragraphs, images, code, tables, charts, and more
- **TypeScript first**: Full type safety with Zod schema validation
- **Zero dependencies on servers**: Everything renders client-side

## Installation

```bash
npm install @kbhole/webx-core
```

```bash
yarn add @kbhole/webx-core
```

```bash
pnpm add @kbhole/webx-core
```

## Quick Start

```typescript
import { encodeWebX, decodeWebX, createBlueprint, block } from '@kbhole/webx-core';

// Create a simple blueprint
const blueprint = createBlueprint("Hello WebX", [
  block.heading("Welcome to the Future"),
  block.paragraph("This entire page is encoded in the URL."),
  block.list(["No servers", "No hosting", "Just a link"]),
  block.button("Learn More", "primary")
]);

// Encode it to a URL-safe string
const encoded = encodeWebX(blueprint);
console.log(`webx://page?data=${encoded}`);

// Decode it back
const decoded = decodeWebX(encoded);
console.log(decoded?.title); // "Hello WebX"
```

## API Reference

### Core Functions

#### `encodeWebX(blueprint, options?)`

Encode a WebX blueprint into a URL-safe string.

```typescript
import { encodeWebX, WebXBlueprint } from 'webx-core';

const blueprint: WebXBlueprint = {
  title: "My Page",
  layout: "article",
  meta: { version: "1.0", created: Date.now() },
  data: [
    { type: "heading", value: "Hello World" },
    { type: "paragraph", value: "Welcome to WebX!" }
  ]
};

const encoded = encodeWebX(blueprint);
// Optional: enable gzip compression for larger blueprints
const compressed = encodeWebX(blueprint, { compress: true });
```

#### `decodeWebX(payload)`

Decode a WebX payload string back into a blueprint.

```typescript
import { decodeWebX } from 'webx-core';

const blueprint = decodeWebX("3x7K9...");
if (blueprint) {
  console.log(blueprint.title);
  console.log(blueprint.data);
}
```

#### `createWebXUrl(blueprint, options?)`

Create a complete WebX URL from a blueprint.

```typescript
import { createWebXUrl } from 'webx-core';

const url = createWebXUrl(blueprint);
// Returns: webx://page?data=3x7K9...
```

#### `parseWebXUrl(url)`

Parse a WebX URL and extract the blueprint.

```typescript
import { parseWebXUrl } from 'webx-core';

const blueprint = parseWebXUrl("webx://page?data=3x7K9...");
```

### Helper Functions

#### `createBlueprint(title, content, options?)`

Create a minimal blueprint with sensible defaults.

```typescript
import { createBlueprint, block } from 'webx-core';

const blueprint = createBlueprint(
  "My Article",
  [
    block.heading("Introduction"),
    block.paragraph("This is my article."),
    block.divider(),
    block.quote("The URL is the database.")
  ],
  {
    layout: "article",
    author: "John Doe",
    category: "technology"
  }
);
```

#### `block` - Content Block Helpers

Convenient helpers for creating content blocks:

```typescript
import { block } from 'webx-core';

block.heading("Title")
block.paragraph("Some text")
block.image("https://example.com/image.jpg", "Alt text")
block.list(["Item 1", "Item 2", "Item 3"])
block.code("const x = 1;", "javascript")
block.quote("Famous quote")
block.divider()
block.button("Click Me", "primary")
block.callout("Important notice", "warning")
block.markdown("# Markdown content")
block.json({ key: "value" })
```

### Utility Functions

#### `validateBlueprint(blueprint)`

Validate an object against the WebX schema.

```typescript
import { validateBlueprint } from 'webx-core';

const result = validateBlueprint(unknownData);
if (result.success) {
  console.log(result.data); // Valid WebXBlueprint
} else {
  console.error(result.errors); // Zod validation errors
}
```

#### `computeBlueprintHash(blueprint)`

Generate a deterministic hash for content verification.

```typescript
import { computeBlueprintHash } from 'webx-core';

const hash = computeBlueprintHash(blueprint);
// Returns: "A1B2C3D4" (8-char hex hash)
```

#### `getPayloadMetrics(blueprint)`

Analyze compression efficiency.

```typescript
import { getPayloadMetrics } from 'webx-core';

const metrics = getPayloadMetrics(blueprint);
console.log(`Original: ${metrics.originalSize} bytes`);
console.log(`Optimized: ${metrics.optimizedSize} bytes`);
console.log(`Savings: ${metrics.advancedRatio}%`);
```

## Content Block Types

WebX supports 22+ content block types:

| Type | Description |
|------|-------------|
| `heading` | Section headings |
| `paragraph` | Text paragraphs |
| `image` | Images with src and alt |
| `list` | Comma-separated lists |
| `code` | Code blocks with syntax highlighting |
| `quote` | Blockquotes |
| `divider` | Horizontal dividers |
| `button` | Interactive buttons |
| `input` | Form inputs |
| `toggle` | Toggle switches |
| `tab` | Tabbed content |
| `embed` | Embedded content |
| `table` | Data tables |
| `metric` | Key metrics/stats |
| `chart` | Data visualizations |
| `json` | Raw JSON display |
| `formula` | Mathematical formulas |
| `video` | Video embeds |
| `audio` | Audio players |
| `callout` | Alert/callout boxes |
| `card-grid` | Card grid layouts |
| `timeline` | Timeline displays |
| `qr-code` | QR code generators |
| `markdown` | Raw markdown content |

## Layout Types

Available layouts for rendering blueprints:

- `article` - Traditional blog-style layout
- `card` - Centered card UI
- `newsfeed` - Social media feed style
- `gallery` - Image gallery grid
- `form` - Interactive form layout
- `minimal` - Clean minimal design
- `bank` - Banking dashboard style
- `messaging` - Chat/messaging UI
- `email` - Email template style
- `postcard` - Postcard design
- `video-call` - Video call interface

## Compression Details

WebX achieves 60-75% compression through multiple strategies:

1. **Semantic Key Minification (30%)**: `title` → `t`, `layout` → `l`
2. **String Deduplication (25%)**: Repeated strings get 1-letter tokens
3. **Base62 Encoding (15%)**: More efficient than Base64, no padding
4. **Gzip (optional, 40-50%)**: Additional compression for large blueprints

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type { 
  WebXBlueprint, 
  ContentBlock, 
  ContentBlockType,
  LayoutType,
  EncodeOptions 
} from 'webx-core';
```

## Browser Support

WebX Core works in all modern browsers and Node.js 16+.

## Examples

### Blog Post

```typescript
const blogPost = createBlueprint("My First Post", [
  block.heading("Welcome to My Blog"),
  block.paragraph("Today I'm announcing something exciting..."),
  block.image("https://example.com/hero.jpg", "Hero image"),
  block.divider(),
  block.heading("The Details"),
  block.paragraph("Here's what you need to know..."),
  block.list(["Point one", "Point two", "Point three"]),
  block.callout("Don't forget to subscribe!", "info"),
  block.button("Subscribe Now", "primary")
], { author: "Jane Doe", category: "announcements" });
```

### Product Card

```typescript
const productCard = createBlueprint("Premium Widget", [
  block.image("https://example.com/product.jpg", "Premium Widget"),
  block.heading("Premium Widget Pro"),
  block.paragraph("The ultimate widget for all your needs."),
  block.list(["Feature A", "Feature B", "Feature C"]),
  block.button("Buy Now - $99", "primary")
], { layout: "card" });
```

### Technical Documentation

```typescript
const docs = createBlueprint("API Reference", [
  block.heading("Getting Started"),
  block.paragraph("Install the package using npm:"),
  block.code("npm install my-package", "bash"),
  block.heading("Basic Usage"),
  block.code(`
import { myFunction } from 'my-package';

const result = myFunction({ 
  option: true 
});
  `.trim(), "typescript"),
  block.callout("Requires Node.js 16 or higher", "warning")
], { layout: "article", category: "documentation" });
```

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- [WebX Protocol Website](https://webxnexus.com)
- [Interactive Demo](https://webxnexus.com/composer)
- [Whitepaper](https://webxnexus.com/whitepaper)
- [GitHub Repository](https://github.com/DenniiBoiii/WebXProtocol)
- [GitHub Issues](https://github.com/DenniiBoiii/WebXProtocol/issues)

---

**The URL is the database.**
