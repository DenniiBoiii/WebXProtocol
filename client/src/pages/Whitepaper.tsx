import { ArrowRight, Download, Copy, Check } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { motion } from "framer-motion";

export default function Whitepaper() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const sections = [
    { id: "abstract", title: "Abstract" },
    { id: "introduction", title: "1. Introduction" },
    { id: "problem", title: "2. Problem Statement" },
    { id: "architecture", title: "3. Technical Architecture" },
    { id: "encoding", title: "4. Data Encoding & Compression" },
    { id: "security", title: "5. Security & Authentication" },
    { id: "performance", title: "6. Performance Analysis" },
    { id: "usecases", title: "7. Use Cases & Applications" },
    { id: "comparison", title: "8. Comparison with Alternatives" },
    { id: "extensibility", title: "9. Extensibility & Ecosystem" },
    { id: "distribution", title: "10. Distribution: URLs & .webx Files" },
    { id: "implementation", title: "11. Implementation Roadmap" },
    { id: "conclusion", title: "12. Conclusion" }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden relative selection:bg-primary selection:text-white">
      {/* Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-secondary/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <Link href="/">
              <Button variant="ghost" className="mb-6 gap-2 text-muted-foreground hover:text-foreground">
                <ArrowRight className="w-4 h-4 rotate-180" /> Back to Home
              </Button>
            </Link>
            <h1 className="text-5xl md:text-6xl font-display font-bold tracking-tight mb-4 text-glow">
              WebX Protocol Whitepaper
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl">
              A Serverless Web Protocol for Self-Contained, Immutable, Shareable Content Using URL-Encoded Blueprints
            </p>
          </motion.div>

          {/* Table of Contents */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-20"
          >
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">Table of Contents</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {sections.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="text-primary hover:text-primary/80 transition-colors"
                    >
                      {section.title}
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Abstract */}
          <section id="abstract" className="mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold mb-6">Abstract</h2>
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-8 space-y-4">
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    WebX is a serverless web protocol that enables self-contained, immutable, and shareable digital content through URL-encoded JSON blueprints. By combining semantic minification, string deduplication, base62 encoding, and optional gzip compression, WebX achieves 60-75% payload reduction compared to standard JSON. This allows complete web pages, forms, documents, and applications to be encoded as clickable links.
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    The protocol is designed for censorship resistance, offline accessibility, one-time sharing, and decentralized distribution. It supports JWT-based authentication, content expiration, and is extensible through custom layouts, compression algorithms, and renderers. WebX is protocol-agnostic and can be implemented on any platform capable of URL parsing and JSON decoding.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </section>

          {/* Introduction */}
          <section id="introduction" className="mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold mb-6">1. Introduction</h2>
              <div className="space-y-6">
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-8 space-y-4">
                    <h3 className="text-xl font-bold">The Vision</h3>
                    <p className="text-muted-foreground">
                      The internet was designed around URLs as links to resources on servers. WebX reimagines URLs as complete data containers. Instead of <code className="bg-black/50 px-2 py-1 rounded text-sm">https://example.com/page/123</code>, a WebX link contains the entire page: <code className="bg-black/50 px-2 py-1 rounded text-sm">https://example.com/view?payload=x7F3...</code>
                    </p>
                    <p className="text-muted-foreground">
                      This shifts power from infrastructure providers to users. Content becomes portable, immutable, and doesn't depend on external servers staying online. A WebX link from 2025 will render identically in 2035—no broken links, no dead services.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-8 space-y-4">
                    <h3 className="text-xl font-bold">Core Principles</h3>
                    <ul className="space-y-3">
                      {[
                        "Serverless: Content is self-contained; no infrastructure required",
                        "Immutable: URLs encode content; content cannot change after sharing",
                        "Decentralized: Links work offline, on Tor, on mesh networks, or any platform",
                        "Extensible: Protocol supports custom layouts, compression, and renderers",
                        "Secure: Optional JWT authentication with expiration and one-time access",
                        "Censorship-Resistant: Complete, downloadable package works without internet"
                      ].map((principle, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="text-primary mt-1">✓</span>
                          <span className="text-muted-foreground">{principle}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </section>

          {/* Problem Statement */}
          <section id="problem" className="mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold mb-6">2. Problem Statement</h2>
              <div className="space-y-6">
                {[
                  {
                    title: "Link Rot & Dead Services",
                    desc: "Millions of URLs become broken when services shut down or change infrastructure. WebX links remain valid indefinitely because content is encoded in the URL itself."
                  },
                  {
                    title: "Censorship & Surveillance",
                    desc: "In countries with restricted internet, users cannot access external resources. WebX enables offline-first applications that work without server connectivity."
                  },
                  {
                    title: "Data Portability",
                    desc: "Users are locked into platforms. WebX treats the URL as a portable data format—you can use the same link across any WebX-compatible client."
                  },
                  {
                    title: "Server Infrastructure Burden",
                    desc: "Hosting scales with users. WebX shifts computation to the client; the only infrastructure needed is a simple static file server or CDN."
                  },
                  {
                    title: "One-Time Sharing",
                    desc: "Sensitive information (passwords, documents, codes) cannot truly self-destruct. WebX supports one-time access expiration at the protocol level."
                  },
                  {
                    title: "URL Length Limitations",
                    desc: "Modern URLs support 2,000+ characters. WebX compression (60-75% reduction) enables much richer content than traditional URL encoding."
                  }
                ].map((problem, idx) => (
                  <Card key={idx} className="bg-white/5 border-white/10">
                    <CardContent className="p-6">
                      <h4 className="font-bold mb-2">{problem.title}</h4>
                      <p className="text-sm text-muted-foreground">{problem.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          </section>

          {/* Technical Architecture */}
          <section id="architecture" className="mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold mb-6">3. Technical Architecture</h2>
              <div className="space-y-6">
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold mb-4">Blueprint Structure</h3>
                    <div className="bg-black/50 border border-white/10 rounded-lg p-4 font-mono text-xs mb-4 overflow-x-auto">
                      <pre>{`{
  title: string,
  layout: "article" | "card" | "newsfeed" | "bank" | "messaging" | "email" | "form" | ...
  data: ContentBlock[],
  ai?: { prompt: string, auto_generate?: boolean },
  jwt?: { 
    token: string,
    expiration?: number,
    expireOnFirstView?: boolean,
    permissions?: string[]
  },
  meta: {
    version: string,
    author?: string,
    created: number,
    category?: string,
    featured?: boolean,
    downloads?: number
  }
}`}</pre>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      A WebX blueprint is a JSON object containing layout type, content blocks, optional AI generation rules, JWT authentication metadata, and page metadata.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold mb-4">Content Block Types</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {[
                        { type: "heading", desc: "Page/section titles with optional level" },
                        { type: "paragraph", desc: "Text content blocks" },
                        { type: "image", desc: "Embedded images with src and alt" },
                        { type: "list", desc: "Ordered or unordered lists" },
                        { type: "code", desc: "Code blocks with syntax highlighting" },
                        { type: "input", desc: "Form inputs (text, email, checkbox)" },
                        { type: "button", desc: "Interactive buttons with actions" },
                        { type: "quote", desc: "Blockquotes with attribution" },
                        { type: "divider", desc: "Visual separators" }
                      ].map((block, idx) => (
                        <div key={idx} className="bg-white/5 p-4 rounded border border-white/10">
                          <p className="font-mono text-sm text-primary mb-1">{block.type}</p>
                          <p className="text-xs text-muted-foreground">{block.desc}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold mb-4">Rendering Pipeline</h3>
                    <ol className="space-y-3">
                      {[
                        "Client receives URL with payload parameter",
                        "Extract payload from query string",
                        "Base62 decode to binary data",
                        "Check for gzip marker; decompress if needed",
                        "Parse JSON containing blueprint and string dictionary",
                        "Recursively decompress strings using dictionary",
                        "Verify JWT token (if present)",
                        "Check expiration and one-time access (if applicable)",
                        "Match layout type and render accordingly",
                        "Display fully interactive content"
                      ].map((step, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="text-primary font-bold flex-shrink-0">{idx + 1}.</span>
                          <span className="text-muted-foreground text-sm">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </section>

          {/* Data Encoding & Compression */}
          <section id="encoding" className="mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold mb-6">4. Data Encoding & Compression</h2>
              <div className="space-y-6">
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold mb-4">Four-Layer Compression Stack</h3>
                    <div className="space-y-4">
                      {[
                        {
                          name: "Layer 1: Semantic Minification",
                          desc: "Reduce key lengths using single-character aliases",
                          reduction: "~30% reduction"
                        },
                        {
                          name: "Layer 2: String Deduplication",
                          desc: "Extract repeated strings into a shared dictionary; reference by key",
                          reduction: "~25% reduction"
                        },
                        {
                          name: "Layer 3: Base62 Encoding",
                          desc: "Use 62 characters (0-9, a-z, A-Z) instead of base64's 64 (no padding overhead)",
                          reduction: "15-20% reduction"
                        },
                        {
                          name: "Layer 4: Optional Gzip",
                          desc: "Apply gzip compression if enabled (adds minimal overhead for already-minified data)",
                          reduction: "5-15% additional reduction"
                        }
                      ].map((layer, idx) => (
                        <div key={idx} className="bg-white/5 p-4 rounded border border-white/10">
                          <p className="font-bold text-sm mb-1">{layer.name}</p>
                          <p className="text-xs text-muted-foreground mb-2">{layer.desc}</p>
                          <p className="text-xs text-green-400 font-mono">{layer.reduction}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-6">
                      <strong>Combined Result:</strong> 60-75% payload reduction. A typical article (5KB JSON) compresses to ~1.2-2KB URL-encoded.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold mb-4">Example Encoding Process</h3>
                    <div className="bg-black/50 border border-white/10 rounded-lg p-4 font-mono text-xs space-y-3">
                      <div className="text-muted-foreground">
                        <p>
                          <span className="text-purple-400">// Original Blueprint (JSON)</span>
                        </p>
                        <p>
                          <span className="text-green-400">2,847 bytes</span>
                        </p>
                      </div>
                      <div className="text-muted-foreground">
                        <p>
                          <span className="text-purple-400">↓ After Minification (30%)</span>
                        </p>
                        <p>
                          <span className="text-green-400">~1,993 bytes</span>
                        </p>
                      </div>
                      <div className="text-muted-foreground">
                        <p>
                          <span className="text-purple-400">↓ After String Dedup (25%)</span>
                        </p>
                        <p>
                          <span className="text-green-400">~1,495 bytes</span>
                        </p>
                      </div>
                      <div className="text-muted-foreground">
                        <p>
                          <span className="text-purple-400">↓ After Base62 (15-20%)</span>
                        </p>
                        <p>
                          <span className="text-green-400">~1,196 bytes</span>
                        </p>
                      </div>
                      <div className="text-muted-foreground">
                        <p>
                          <span className="text-purple-400">↓ After Gzip (optional, 10%)</span>
                        </p>
                        <p>
                          <span className="text-green-400">~1,076 bytes</span>
                        </p>
                      </div>
                      <div className="text-green-400 font-bold border-t border-white/10 pt-3">
                        Total Reduction: 62%
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold mb-4">Base62 vs Base64</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-bold text-sm mb-2">Base64</p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          <li>• 64 characters (0-9, a-z, A-Z, +, /)</li>
                          <li>• Requires padding (=)</li>
                          <li>• Not URL-safe without escaping</li>
                          <li>• Adds ~25% overhead</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-bold text-sm mb-2">Base62</p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          <li>• 62 characters (0-9, a-z, A-Z)</li>
                          <li>• No padding needed</li>
                          <li>• Natively URL-safe</li>
                          <li>• 15-20% reduction vs Base64</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </section>

          {/* Security & Authentication */}
          <section id="security" className="mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold mb-6">5. Security & Authentication</h2>
              <div className="space-y-6">
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold mb-4">Immutability & Integrity</h3>
                    <p className="text-muted-foreground mb-4">
                      WebX payloads are cryptographically tamper-proof. Because URLs are used as links and the protocol is deterministic, any modification to the payload produces a different URL. If someone modifies the content after sharing, the resulting URL will be different—the original cannot be compromised.
                    </p>
                    <div className="bg-black/50 border border-white/10 rounded-lg p-4 font-mono text-xs space-y-2">
                      <p className="text-muted-foreground">
                        <span className="text-purple-400"># Original URL</span>
                      </p>
                      <p className="text-green-400 break-all">https://webx.com/view?payload=x7F3a2Kl9pQ...</p>
                      <p className="text-muted-foreground mt-4">
                        <span className="text-purple-400"># Even 1 character change produces different URL</span>
                      </p>
                      <p className="text-red-400 break-all">https://webx.com/view?payload=x7F3a2Kl9pR...</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold mb-4">JWT-Based Authentication</h3>
                    <p className="text-muted-foreground mb-4">
                      WebX supports embedded JWT tokens for additional security layers:
                    </p>
                    <ul className="space-y-3">
                      {[
                        "Time-Based Expiration: Links expire at specific times (10 min, 1 hour, 1 day, etc.)",
                        "One-Time Access: Links expire after first view; subsequent accesses show 'Access Denied'",
                        "Permissions: JWT includes permission bits for future extensibility (read, execute, etc.)",
                        "Custom Tokens: Integrates with your own signing infrastructure for enterprise scenarios"
                      ].map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="text-green-400 flex-shrink-0">✓</span>
                          <span className="text-muted-foreground text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold mb-4">Content Security Model</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-white/5 p-4 rounded border border-white/10">
                        <p className="font-bold text-sm mb-2">Public Links</p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          <li>• No expiration</li>
                          <li>• Can be viewed infinite times</li>
                          <li>• Share freely on social media</li>
                          <li>• Use for public content</li>
                        </ul>
                      </div>
                      <div className="bg-white/5 p-4 rounded border border-white/10">
                        <p className="font-bold text-sm mb-2">Sensitive Links</p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          <li>• 1-hour expiration</li>
                          <li>• One-time access enabled</li>
                          <li>• Share in secure channels only</li>
                          <li>• Use for credentials/codes</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold mb-4">Screenshot & Copy-Paste Limitations (Transparent)</h3>
                    <p className="text-muted-foreground mb-4">
                      WebX is honest about its security model. While links can self-destruct after opening, the content can still be screenshot before expiration. This is a fundamental limitation of any displayed content. WebX does not claim to prevent this—users should understand:
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>✓ One-time access prevents re-viewing through the link</li>
                      <li>✓ But content can be screenshot/copied before expiration</li>
                      <li>✓ For truly sensitive data, combine with external encryption</li>
                      <li>✓ Usage audit logs should be kept on server-side when available</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </section>

          {/* Performance Analysis */}
          <section id="performance" className="mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold mb-6">6. Performance Analysis</h2>
              <div className="space-y-6">
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold mb-4">Benchmark Results</h3>
                    <div className="space-y-4">
                      {[
                        {
                          scenario: "Simple Article (3KB JSON)",
                          webx: "~1.1KB",
                          reduction: "64%"
                        },
                        {
                          scenario: "Social Media Post (8KB JSON)",
                          webx: "~2.8KB",
                          reduction: "65%"
                        },
                        {
                          scenario: "Banking Form (5KB JSON)",
                          webx: "~1.6KB",
                          reduction: "68%"
                        },
                        {
                          scenario: "Email Message (12KB JSON)",
                          webx: "~4.2KB",
                          reduction: "65%"
                        }
                      ].map((benchmark, idx) => (
                        <div key={idx} className="bg-white/5 p-4 rounded border border-white/10">
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-bold text-sm">{benchmark.scenario}</p>
                            <span className="text-green-400 text-sm">{benchmark.reduction}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">WebX: {benchmark.webx}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold mb-4">Scalability</h3>
                    <ul className="space-y-3">
                      {[
                        "Encoding/Decoding: O(n) time complexity; fast even for large payloads",
                        "Client-Side Rendering: No server load; rendering happens in browser",
                        "Distribution: CDN-friendly static files; scales to millions of users",
                        "Memory Usage: Minimal; decompression happens in-memory"
                      ].map((point, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="text-primary mt-1">→</span>
                          <span className="text-muted-foreground text-sm">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold mb-4">URL Length Limitations</h3>
                    <p className="text-muted-foreground mb-4">
                      Modern browsers and servers support URLs up to 2,000-8,000 characters. With WebX compression:
                    </p>
                    <div className="bg-black/50 border border-white/10 rounded-lg p-4 font-mono text-xs space-y-2 text-muted-foreground">
                      <p><span className="text-green-400">2000 chars</span> ≈ 10-15 KB of uncompressed content</p>
                      <p><span className="text-green-400">8000 chars</span> ≈ 40-60 KB of uncompressed content</p>
                      <p><span className="text-purple-400"># Typical use: 1-5KB (covers 90% of real-world needs)</span></p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </section>

          {/* Use Cases */}
          <section id="usecases" className="mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold mb-6">7. Use Cases & Applications</h2>
              <div className="space-y-4">
                {[
                  {
                    title: "Secure Document Sharing",
                    desc: "Share PDFs, contracts, or sensitive documents as one-time links that expire",
                    features: ["One-time access", "Expiration timestamps", "No server storage"]
                  },
                  {
                    title: "Social Media & Messaging",
                    desc: "Embed rich content (posts, stories, messages) directly in links",
                    features: ["Instant loading", "No app install needed", "Fully interactive"]
                  },
                  {
                    title: "Censorship-Resistant Journalism",
                    desc: "Share news and articles in regions with restricted internet",
                    features: ["Works offline", "Downloadable toolkit", "No central server"]
                  },
                  {
                    title: "One-Time Passwords & Codes",
                    desc: "Share 2FA codes, recovery keys, or temporary credentials",
                    features: ["Self-destructs after use", "No email needed", "URL-based delivery"]
                  },
                  {
                    title: "Form & Survey Distribution",
                    desc: "Create and share forms without hosting infrastructure",
                    features: ["Self-contained", "Shareable via QR", "Portable across platforms"]
                  },
                  {
                    title: "Decentralized Mesh Networks",
                    desc: "Share content on peer-to-peer networks without central servers",
                    features: ["P2P compatible", "Offline-first", "Works on mesh nodes"]
                  },
                  {
                    title: "Email & Newsletter Distribution",
                    desc: "Embed full email content in single, unchangeable links",
                    features: ["No link rot", "Immutable content", "Email-friendly"]
                  },
                  {
                    title: "AI-Generated Content Caching",
                    desc: "Bake AI outputs into links for deterministic sharing",
                    features: ["Frozen content", "Reproducible", "No API calls needed"]
                  }
                ].map((usecase, idx) => (
                  <Card key={idx} className="bg-white/5 border-white/10">
                    <CardContent className="p-6">
                      <h4 className="font-bold mb-2">{usecase.title}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{usecase.desc}</p>
                      <div className="flex flex-wrap gap-2">
                        {usecase.features.map((feat, fidx) => (
                          <span key={fidx} className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                            {feat}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          </section>

          {/* Comparison */}
          <section id="comparison" className="mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold mb-6">8. Comparison with Alternatives</h2>
              <div className="space-y-6">
                <Card className="bg-white/5 border-white/10 overflow-x-auto">
                  <CardContent className="p-8">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-2">Feature</th>
                          <th className="text-center py-2">WebX</th>
                          <th className="text-center py-2">Traditional URLs</th>
                          <th className="text-center py-2">QR Codes</th>
                          <th className="text-center py-2">Email Links</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs text-muted-foreground">
                        {[
                          ["Self-Contained", "✓", "✗", "✓", "✗"],
                          ["Serverless", "✓", "✗", "✓", "✗"],
                          ["Immutable", "✓", "✗", "✓", "✗"],
                          ["Decentralized", "✓", "✗", "✓", "✗"],
                          ["Interactive", "✓", "✓", "✗", "✓"],
                          ["No Link Rot", "✓", "✗", "N/A", "✗"],
                          ["Offline Access", "✓", "✗", "N/A", "✗"],
                          ["Compression", "60-75%", "0%", "N/A", "0%"],
                          ["One-Time Access", "✓", "Requires backend", "✗", "Requires backend"]
                        ].map((row, idx) => (
                          <tr key={idx} className="border-b border-white/10">
                            <td className="py-2">{row[0]}</td>
                            <td className="text-center">{row[1]}</td>
                            <td className="text-center">{row[2]}</td>
                            <td className="text-center">{row[3]}</td>
                            <td className="text-center">{row[4]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold mb-4">vs. Traditional URLs + Servers</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      <strong>Traditional:</strong> Client requests server, server returns content, client renders
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      <strong>WebX:</strong> Client decodes URL, extracts content, renders locally
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>✓ WebX: No server needed; works offline</li>
                      <li>✓ WebX: Content cannot be changed after sharing</li>
                      <li>✓ WebX: Scales infinitely (no backend load)</li>
                      <li>✗ WebX: Limited to ~2-8KB of content (vs. unlimited with servers)</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold mb-4">vs. QR Codes</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      QR codes are excellent for linking to resources but limited by URL length.
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>✓ WebX: Encodes complete content in URL/QR (not just links)</li>
                      <li>✓ WebX: Content can be interactive forms, not just links</li>
                      <li>✓ WebX: Works with or without internet</li>
                      <li>✓ QR: More compact for simple links; universal support</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </section>

          {/* Extensibility */}
          <section id="extensibility" className="mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold mb-6">9. Extensibility & Ecosystem</h2>
              <div className="space-y-6">
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold mb-4">Extension Architecture</h3>
                    <p className="text-muted-foreground mb-4">
                      WebX is designed like HTTP—simple at its core, extensible in practice. Just as HTTP gained HTTPS, HTTP/2, and compression over time, WebX supports custom implementations:
                    </p>
                    <div className="space-y-4">
                      {[
                        {
                          name: "Custom Layouts",
                          desc: "Beyond article/card/newsfeed: dashboard, kanban, timeline, 3D viewer"
                        },
                        {
                          name: "Compression Algorithms",
                          desc: "Base62 is default; support brotli, zstd, or proprietary compression"
                        },
                        {
                          name: "Custom Renderers",
                          desc: "Build WebX viewers for iOS, Android, CLI, VR, or any platform"
                        },
                        {
                          name: "Authentication Schemes",
                          desc: "JWT is default; add OAuth, biometric, multi-signature, ZK proofs"
                        },
                        {
                          name: "Content Plugins",
                          desc: "Extend beyond text/images: video, audio, 3D models, games, AR"
                        }
                      ].map((ext, idx) => (
                        <div key={idx} className="bg-white/5 p-4 rounded border border-white/10">
                          <p className="font-bold text-sm mb-1">{ext.name}</p>
                          <p className="text-xs text-muted-foreground">{ext.desc}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold mb-4">Backward Compatibility Model</h3>
                    <p className="text-muted-foreground mb-4">
                      If a renderer encounters an unknown extension, it gracefully degrades:
                    </p>
                    <div className="bg-black/50 border border-white/10 rounded-lg p-4 font-mono text-xs text-muted-foreground">
                      <pre>{`if (blueprint.extensions?.renderer === "v2") {
  loadExtension("v2-renderer");
} else {
  useDefaultRenderer();
}

// Unknown extensions don't break rendering
// Client falls back to standard layout
`}</pre>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                      This mirrors browser behavior with new HTML5 features: older browsers still work, but miss enhancements.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold mb-4">The Nexus Registry</h3>
                    <p className="text-muted-foreground mb-4">
                      A curated registry where developers share:
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>✓ Custom layout implementations</li>
                      <li>✓ Compression algorithm optimizations</li>
                      <li>✓ Platform-specific renderers</li>
                      <li>✓ Pre-built examples and templates</li>
                      <li>✓ Community-driven addons</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </section>

          {/* Distribution & File Format */}
          <section id="distribution" className="mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold mb-6">10. Distribution: URLs & .webx Files</h2>
              <div className="space-y-6">
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold mb-4">Two Sharing Mechanisms</h3>
                    <p className="text-muted-foreground mb-6">
                      WebX blueprints can be shared through two complementary formats, each optimized for different use cases:
                    </p>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-white/5 p-6 rounded border border-white/10">
                        <p className="font-bold text-lg mb-3">1. URL-Encoded Links</p>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>✓ Paste directly into chat, email, social media</li>
                          <li>✓ Scannable via QR codes</li>
                          <li>✓ Works across browsers without installation</li>
                          <li>✓ Instant rendering (no file save/load)</li>
                          <li>✓ Optimal for quick sharing and viral distribution</li>
                          <li>✓ Limited by URL length (~2-8KB content)</li>
                        </ul>
                      </div>
                      <div className="bg-white/5 p-6 rounded border border-white/10">
                        <p className="font-bold text-lg mb-3">2. .webx File Format</p>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>✓ Share as email attachment or file</li>
                          <li>✓ Transfer via USB, cloud storage, messaging</li>
                          <li>✓ No practical size limits (can embed large content)</li>
                          <li>✓ Editable in Composer (import/export)</li>
                          <li>✓ Perfect for offline-first workflows</li>
                          <li>✓ Ideal for censored regions</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold mb-4">.webx File Specification</h3>
                    <p className="text-muted-foreground mb-4">
                      The <code className="bg-black/50 px-2 py-1 rounded text-sm">.webx</code> file format is a JSON file containing a complete WebX blueprint:
                    </p>
                    <div className="bg-black/50 border border-white/10 rounded-lg p-4 font-mono text-xs mb-4 overflow-x-auto">
                      <pre>{`{
  "title": "My WebX Document",
  "layout": "article",
  "data": [...],
  "meta": {
    "version": "1.0",
    "author": "Jane Doe",
    "created": 1700000000000
  },
  "jwt": { ... }
}`}</pre>
                    </div>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Valid JSON format; readable in any text editor</li>
                      <li>• MIME type: <code className="bg-black/50 px-1 py-0.5 rounded text-xs">application/webx+json</code></li>
                      <li>• Filename convention: <code className="bg-black/50 px-1 py-0.5 rounded text-xs">document-name.webx</code></li>
                      <li>• Can be imported into Composer for editing</li>
                      <li>• Can be converted to URL links with one click</li>
                      <li>• Supports all blueprint features (expiration, AI prompts, custom layouts)</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold mb-4">Use Cases by Format</h3>
                    <div className="space-y-4">
                      {[
                        {
                          scenario: "Quick Social Media Share",
                          format: "URL Link",
                          reason: "Works directly in posts without downloads"
                        },
                        {
                          scenario: "Journalist Sharing Articles in Restricted Country",
                          format: ".webx File",
                          reason: "Transfer via USB or mesh network, works offline"
                        },
                        {
                          scenario: "Team Collaboration & Editing",
                          format: ".webx File",
                          reason: "Export for review, import after edits"
                        },
                        {
                          scenario: "QR Code on Print Media",
                          format: "URL Link",
                          reason: "Scannable; instant rendering in browser"
                        },
                        {
                          scenario: "Email Attachment (Large Content)",
                          format: ".webx File",
                          reason: "No URL length limitations"
                        },
                        {
                          scenario: "One-Time Sensitive Documents",
                          format: "URL Link + Expiration",
                          reason: "Embedded JWT ensures automatic expiration"
                        },
                        {
                          scenario: "Archive & Long-Term Storage",
                          format: ".webx File",
                          reason: "Portable, editable, readable by future systems"
                        },
                        {
                          scenario: "Mobile-First Applications",
                          format: "URL Link",
                          reason: "No file picker needed; instant access"
                        }
                      ].map((usecase, idx) => (
                        <div key={idx} className="bg-white/5 p-4 rounded border border-white/10">
                          <p className="font-bold text-sm mb-2">{usecase.scenario}</p>
                          <div className="flex justify-between items-start">
                            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">{usecase.format}</span>
                            <span className="text-xs text-muted-foreground text-right flex-1 ml-4">{usecase.reason}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold mb-4">Converting Between Formats</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="font-bold text-sm mb-2">URL Link → .webx File</p>
                        <p className="text-sm text-muted-foreground">
                          When you open a URL link in the renderer, you can download the blueprint as a .webx file for offline backup or editing.
                        </p>
                      </div>
                      <div>
                        <p className="font-bold text-sm mb-2">.webx File → URL Link</p>
                        <p className="text-sm text-muted-foreground">
                          Import a .webx file into the Composer, then generate a URL link with one click. Perfect for converting archived files back into shareable links.
                        </p>
                      </div>
                      <div className="bg-black/50 border border-white/10 rounded-lg p-4 font-mono text-xs text-muted-foreground">
                        <p><span className="text-green-400">// Composer enables bidirectional conversion</span></p>
                        <p>.webx file ↔ Blueprint Editor ↔ URL Link</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </section>

          {/* Implementation Roadmap */}
          <section id="implementation" className="mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold mb-6">10. Implementation Roadmap</h2>
              <div className="space-y-6">
                {[
                  {
                    phase: "Phase 1: Foundation (Current)",
                    status: "✓ Complete",
                    items: [
                      "Core protocol specification",
                      "Base62 encoding & decoding",
                      "Semantic minification & string deduplication",
                      "JWT authentication with expiration",
                      "One-time access (expire after first view)",
                      "5 layout types (article, card, newsfeed, bank, messaging, email)",
                      "Open-source reference implementation"
                    ]
                  },
                  {
                    phase: "Phase 2: Extensions (6 months)",
                    status: "In Progress",
                    items: [
                      "Official extension API specification",
                      "Community registry for layouts, renderers, plugins",
                      "Standardized packaging for extensions",
                      "NPM package publication",
                      "Platform-specific renderers (iOS, Android, CLI)",
                      "Additional compression algorithms (brotli, zstd)",
                      "Enhanced authentication (OAuth, WebAuthn)"
                    ]
                  },
                  {
                    phase: "Phase 3: Ecosystem (12+ months)",
                    status: "Planned",
                    items: [
                      "Package manager for WebX addons",
                      "Browser/client marketplace",
                      "Multi-signature verification",
                      "Official spec versioning & governance",
                      "Standardized testing & certification",
                      "Educational resources & documentation",
                      "Conference talks & community outreach"
                    ]
                  }
                ].map((phase, idx) => (
                  <Card key={idx} className="bg-white/5 border-white/10">
                    <CardContent className="p-8">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-xl font-bold">{phase.phase}</h4>
                        <span className="text-xs bg-green-400/20 text-green-400 px-2 py-1 rounded font-mono">
                          {phase.status}
                        </span>
                      </div>
                      <ul className="space-y-2">
                        {phase.items.map((item, itemIdx) => (
                          <li key={itemIdx} className="flex items-start gap-2">
                            <span className="text-primary flex-shrink-0">→</span>
                            <span className="text-sm text-muted-foreground">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          </section>

          {/* Conclusion */}
          <section id="conclusion" className="mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold mb-6">11. Conclusion</h2>
              <Card className="bg-gradient-to-r from-purple-400/10 to-pink-400/10 border-purple-400/30">
                <CardContent className="p-8 space-y-6">
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    WebX reimagines what URLs can do. By embedding complete, immutable content in links, WebX enables a new class of applications: serverless, decentralized, and censorship-resistant.
                  </p>

                  <p className="text-lg text-muted-foreground leading-relaxed">
                    With 60-75% compression, JWT authentication, one-time access, and extensible architecture, WebX addresses real problems faced by journalists, activists, developers, and everyday users.
                  </p>

                  <p className="text-lg text-muted-foreground leading-relaxed">
                    The protocol is open, simple to implement, and designed for long-term stability. A WebX link from 2025 will render identically in 2035, unchanged and unchanged-able.
                  </p>

                  <div className="bg-white/5 border border-white/10 p-6 rounded-lg">
                    <p className="font-bold mb-3 text-white">Key Takeaways</p>
                    <ul className="space-y-2">
                      {[
                        "URLs as complete data containers, not just pointers",
                        "No infrastructure needed—content lives in the URL",
                        "Immutable by design; changing content creates a different URL",
                        "Censorship-resistant through offline accessibility",
                        "Extensible like HTTP; built for a 50-year evolution",
                        "Open protocol; anyone can build WebX clients"
                      ].map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-primary flex-shrink-0">✓</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="text-muted-foreground italic">
                    WebX is not a replacement for the web—it's an evolution. Use it alongside traditional servers for content that needs to be truly permanent, portable, and self-contained.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </section>

          {/* Download & Share */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center py-16"
          >
            <h2 className="text-3xl font-bold mb-8">Download & Share</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="gap-2"
                onClick={() => copyToClipboard(window.location.href, 0)}
              >
                {copiedIndex === 0 ? (
                  <>
                    <Check className="w-4 h-4" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copy Whitepaper Link
                  </>
                )}
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="gap-2"
                onClick={() => {
                  const element = document.createElement('a');
                  element.setAttribute('href', 'data:text/html;charset=utf-8,' + encodeURIComponent(document.documentElement.outerHTML));
                  element.setAttribute('download', 'WebX-Whitepaper.html');
                  element.style.display = 'none';
                  document.body.appendChild(element);
                  element.click();
                  document.body.removeChild(element);
                }}
              >
                <Download className="w-4 h-4" /> Download as HTML
              </Button>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center py-20 border-t border-white/10"
          >
            <h2 className="text-3xl font-bold mb-6">Ready to Build?</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/composer">
                <Button size="lg" className="gap-2">
                  Start Creating <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/implement">
                <Button size="lg" variant="outline" className="gap-2">
                  Implement WebX <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/">
                <Button size="lg" variant="ghost" className="gap-2">
                  Back to Home
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
