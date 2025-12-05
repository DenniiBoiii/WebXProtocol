import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Copy, Check, Code2, Download, GitBranch, Zap, Wifi, Package, FileText, DownloadCloud } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function Implement() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const codeBlocks = [
    {
      title: "1. Install via npm",
      code: `# Install from npm
npm install @kbhole/webx-core

# Or clone the source
git clone https://github.com/DenniiBoiii/WebXProtocol.git`,
      language: "bash"
    },
    {
      title: "2. Import WebX",
      code: `import { 
  encodeWebX, 
  decodeWebX, 
  createBlueprint, 
  block 
} from '@kbhole/webx-core';`,
      language: "typescript"
    },
    {
      title: "3. Decode a Blueprint",
      code: `const payload = "x7F3.a2K..."; // WebX link
const blueprint = decodeWebX(payload);
console.log(blueprint.title);
console.log(blueprint.data);`,
      language: "typescript"
    },
    {
      title: "4. Create a Blueprint (Easy Way)",
      code: `// Use helpers for quick creation
const blueprint = createBlueprint("My First Page", [
  block.heading("Hello World"),
  block.paragraph("This is my WebX page."),
  block.list(["Feature 1", "Feature 2"]),
  block.button("Learn More", "primary")
], { author: "Your Name" });`,
      language: "typescript"
    },
    {
      title: "5. Encode & Share",
      code: `const payload = encodeWebX(blueprint);
const link = \`webx://page?data=\${payload}\`;
// Or use: createWebXUrl(blueprint)
console.log(link); // Share this!`,
      language: "typescript"
    },
    {
      title: "6. Add JWT Authentication",
      code: `const blueprintWithAuth = {
  ...blueprint,
  jwt: {
    token: "eyJhbGc...", // Signed JWT
    expiration: Date.now() + 3600000, // 1 hour
    permissions: ["read"]
  }
};`,
      language: "typescript"
    }
  ];

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast({ title: "Copied to clipboard!" });
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden relative selection:bg-primary selection:text-white">
      {/* Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-secondary/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <Link href="/">
            <Button variant="ghost" className="mb-6 gap-2 text-muted-foreground hover:text-foreground">
              <ArrowRight className="w-4 h-4 rotate-180" /> Back to Home
            </Button>
          </Link>

          <Badge variant="outline" className="mb-4 border-primary/50 text-primary hover:bg-primary/10">
            <Code2 className="w-3 h-3 mr-2" /> DEVELOPER GUIDE
          </Badge>

          <h1 className="text-5xl md:text-6xl font-display font-bold tracking-tight mb-4 text-glow">
            How to Implement WebX
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Add WebX protocol support to your client-based system. Decode compressed blueprints, render content, and build immutable links in minutes.
          </p>
        </motion.div>

        {/* Quick Start */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <Zap className="w-6 h-6 text-secondary flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-display font-bold mb-2">Quick Start (5 minutes)</h2>
                  <p className="text-muted-foreground mb-6">
                    Get WebX rendering in your application with just a few lines of code. No backend required.
                  </p>
                  <div className="bg-black/50 border border-white/10 rounded-lg p-4 font-mono text-sm text-green-400 overflow-x-auto">
                    npm install @kbhole/webx-core
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Code Blocks */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="space-y-6 mb-16"
        >
          {codeBlocks.map((block, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-white/5 border-white/10 overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-white/10 border-b border-white/10 p-4 flex items-center justify-between">
                    <h3 className="font-semibold text-white">{block.title}</h3>
                    <Badge variant="outline" className="text-xs font-mono">
                      {block.language}
                    </Badge>
                  </div>
                  <div className="p-4 relative">
                    <pre className="text-sm text-green-400 overflow-x-auto">
                      <code>{block.code}</code>
                    </pre>
                    <button
                      onClick={() => copyToClipboard(block.code, index)}
                      className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {copiedIndex === index ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-muted-foreground hover:text-white" />
                      )}
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* File Format & Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-3xl font-display font-bold mb-8">Working with .webx Files</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: "Export Blueprints as .webx",
                desc: "Save your work as portable JSON files. Perfect for backup, sharing via email, or transferring to other systems.",
                code: `// In Composer: Click "Download .webx"
blueprint.json → document-name.webx`
              },
              {
                title: "Import .webx Files",
                desc: "Load previously saved blueprints back into the Composer for editing, sharing, or conversion to URL links.",
                code: `// In Composer: Click "Import .webx"
file.webx → editor → edit → export/share`
              },
              {
                title: "Offline Sharing & Distribution",
                desc: "Transfer .webx files via USB, cloud storage, messaging apps, or any method. Works completely offline—no internet needed.",
                code: `// Share via:
• Email attachment
• Cloud storage (Google Drive)
• Peer-to-peer transfer
• USB drive`
              },
              {
                title: "Bidirectional Conversion",
                desc: "Convert between URL links and .webx files seamlessly. Export a link as a file, or turn a file into a shareable link.",
                code: `// Convert:
.webx file → import → editor
→ generate link OR
→ download as .webx`
              }
            ].map((feature, idx) => (
              <Card key={idx} className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <h4 className="font-bold mb-2">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground mb-4">{feature.desc}</p>
                  <div className="bg-black/50 border border-white/10 rounded p-3 font-mono text-xs text-muted-foreground">
                    <pre>{feature.code}</pre>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Advanced Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-3xl font-display font-bold mb-8">Advanced Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: <Code2 className="w-6 h-6 text-primary" />,
                title: "Custom Renderers",
                desc: "Build your own renderer to support custom layouts beyond the standard options. Full control over how blueprints render."
              },
              {
                icon: <Download className="w-6 h-6 text-secondary" />,
                title: "Compression Control",
                desc: "Enable/disable gzip compression, choose encoding strategies, and optimize for your use case with configuration options."
              },
              {
                icon: <GitBranch className="w-6 h-6 text-purple-400" />,
                title: "JWT Integration",
                desc: "Embed authentication tokens directly in blueprints. Verify signatures client-side with zero server dependency."
              },
              {
                icon: <Zap className="w-6 h-6 text-orange-400" />,
                title: "Real-Time Updates",
                desc: "Create blueprints that update content in real-time through client-side state management without reloading."
              }
            ].map((feature, idx) => (
              <Card key={idx} className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Status & Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <Card className="bg-blue-400/10 border-blue-400/30">
            <CardContent className="p-8">
              <h2 className="text-2xl font-display font-bold mb-4">Development Status</h2>
              <p className="text-muted-foreground mb-6">
                WebX Protocol is currently in alpha development. The core library exists in this repository. Here's what's coming:
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-green-400 font-bold min-w-fit">✓ Complete</span>
                  <p className="text-sm text-muted-foreground">Core compression & encoding library (base62, semantic minification, deduplication)</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-400 font-bold min-w-fit">✓ Complete</span>
                  <p className="text-sm text-muted-foreground">Blueprint schema, renderer, and sample implementations</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-400 font-bold min-w-fit">✓ Complete</span>
                  <p className="text-sm text-muted-foreground">Official npm package: @kbhole/webx-core</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-yellow-400 font-bold min-w-fit">⏳ Coming</span>
                  <p className="text-sm text-muted-foreground">Custom browser/renderer tooling</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-yellow-400 font-bold min-w-fit">⏳ Coming</span>
                  <p className="text-sm text-muted-foreground">Official WebX clients for web, mobile, desktop</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Browser/Renderer Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <Card className="bg-gradient-to-r from-primary/20 to-secondary/20 border-primary/30">
            <CardContent className="p-8">
              <h2 className="text-2xl font-display font-bold mb-4">Building Your Own Browser?</h2>
              <p className="text-muted-foreground mb-6">
                WebX is protocol-agnostic. You can build custom browsers, renderers, or clients that understand the WebX format. The protocol is open, decentralized, and designed for extensibility.
              </p>
              <div className="bg-black/50 border border-primary/20 rounded-lg p-4 mb-6">
                <p className="text-sm text-muted-foreground font-mono">
                  // Your custom browser just needs to:
                  <br />1. Parse the payload (base62 decoded)
                  <br />2. Decompress the blueprint (using pako for gzip)
                  <br />3. Decompress strings using the included dictionary
                  <br />4. Render according to the layout type
                  <br />5. Verify JWT tokens (optional, cryptographic verification)
                </p>
              </div>
              <p className="text-xs text-muted-foreground">Check the <code className="bg-black/50 px-2 py-1 rounded">client/src/lib/webx.ts</code> file in the repository for the complete implementation.</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Offline Tutorial for Censored Regions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-3xl font-display font-bold mb-8">Offline Access & Censorship-Resistant Setup</h2>
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Left: Why Offline Matters */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-8">
                <div className="flex items-start gap-3 mb-6">
                  <Wifi className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-bold mb-2">For Restricted Regions</h3>
                    <p className="text-sm text-muted-foreground">
                      In countries with censorship, restricted internet access, or surveillance concerns, download the complete WebX toolkit to your local machine. Works offline—no internet required after download.
                    </p>
                  </div>
                </div>
                <div className="bg-orange-400/10 border border-orange-400/30 p-4 rounded-lg">
                  <p className="text-xs font-mono text-orange-400 mb-2">Use Cases</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Journalists in authoritarian regimes</li>
                    <li>• Activists sharing information securely</li>
                    <li>• Remote communities with poor connectivity</li>
                    <li>• NGOs with censorship concerns</li>
                    <li>• Mesh networks & offline-first applications</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Right: Key Features */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-8">
                <div className="flex items-start gap-3 mb-6">
                  <DownloadCloud className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-bold mb-2">Self-Contained Package</h3>
                    <p className="text-sm text-muted-foreground">
                      Download everything needed to encode/decode WebX blueprints and render content. No phone-home, no tracking, no dependencies on external services.
                    </p>
                  </div>
                </div>
                <div className="bg-green-400/10 border border-green-400/30 p-4 rounded-lg">
                  <p className="text-xs font-mono text-green-400 mb-2">What's Included</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>✓ Complete source code (minified)</li>
                    <li>✓ CLI tool for encoding/decoding</li>
                    <li>✓ Offline documentation</li>
                    <li>✓ Example blueprints & tutorials</li>
                    <li>✓ No dependencies needed</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Download Resources */}
          <Card className="bg-gradient-to-r from-purple-400/10 to-pink-400/10 border-purple-400/30 mb-8">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold mb-6 text-white">Download Offline Resources</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    icon: Package,
                    label: "Core Library",
                    desc: "Complete WebX codec + renderer",
                    size: "2.3 MB",
                    filename: "webx-core-v1.0.zip"
                  },
                  {
                    icon: Code2,
                    label: "CLI Tool",
                    desc: "Command-line encoder/decoder",
                    size: "1.1 MB",
                    filename: "webx-cli-v1.0.zip"
                  },
                  {
                    icon: FileText,
                    label: "Documentation",
                    desc: "Complete spec + examples",
                    size: "8.4 MB",
                    filename: "webx-docs-v1.0.zip"
                  },
                  {
                    icon: Download,
                    label: "Quick Start Bundle",
                    desc: "Everything above + videos",
                    size: "42 MB",
                    filename: "webx-bundle-complete-v1.0.zip"
                  }
                ].map((resource, idx) => {
                  const Icon = resource.icon;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <Button
                        variant="outline"
                        className="w-full h-full flex flex-col items-center justify-center p-6 bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30 transition-all group"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = `/downloads/${resource.filename}`;
                          link.download = resource.filename;
                          link.click();
                        }}
                      >
                        <Icon className="w-8 h-8 mb-3 text-purple-400 group-hover:scale-110 transition-transform" />
                        <p className="font-semibold text-sm text-white mb-1">{resource.label}</p>
                        <p className="text-xs text-muted-foreground mb-2 text-center leading-tight">{resource.desc}</p>
                        <p className="text-xs text-purple-400 font-mono">{resource.size}</p>
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-6 text-center">
                All downloads are unsigned and uncompressed for verification transparency. Checksums and PGP signatures available at <code className="bg-black/50 px-2 py-1 rounded">https://webx-protocol.dev/downloads</code>
              </p>
            </CardContent>
          </Card>

          {/* Installation Methods */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {[
              {
                title: "USB Drive Method",
                steps: [
                  "1. Download on unrestricted network",
                  "2. Verify checksums",
                  "3. Copy to USB drive",
                  "4. Air-gap transfer to target machine",
                  "5. Extract and run locally"
                ]
              },
              {
                title: "Mesh Network Method",
                steps: [
                  "1. Download package locally",
                  "2. Host on mesh node or Tor",
                  "3. Share node address with peers",
                  "4. Peers download via mesh/Tor",
                  "5. Completely decentralized"
                ]
              },
              {
                title: "Email/Chat Method",
                steps: [
                  "1. Split zip into 10MB chunks",
                  "2. Email/message across channels",
                  "3. Receive on restricted network",
                  "4. Reassemble with included script",
                  "5. Verify and extract"
                ]
              }
            ].map((method, idx) => (
              <Card key={idx} className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <h4 className="font-bold mb-4 text-white">{method.title}</h4>
                  <ol className="text-xs text-muted-foreground space-y-2">
                    {method.steps.map((step, sidx) => (
                      <li key={sidx}>{step}</li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-white/5 border-white/10 mb-8">
            <CardContent className="p-8">
              <h3 className="font-bold mb-4 text-white">Using the Offline CLI</h3>
              <div className="bg-black/50 border border-white/10 rounded-lg p-4 font-mono text-sm mb-4 space-y-2 text-muted-foreground">
                <p><span className="text-green-400">$</span> webx encode --file blueprint.json --output link.txt</p>
                <p><span className="text-green-400">$</span> webx decode --payload 'x7F3a2K...' --output result.json</p>
                <p><span className="text-green-400">$</span> webx render --payload 'x7F3a2K...' --format html</p>
                <p><span className="text-muted-foreground"># All operations work completely offline—no network calls</span></p>
              </div>
              <p className="text-xs text-muted-foreground">
                The CLI is self-contained with zero external dependencies. Perfect for automation, scripting, and integration into existing offline workflows.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Implementation Checklist */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-3xl font-display font-bold mb-8">Implementation Checklist</h2>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-8">
              <div className="space-y-4">
                {[
                  "Install webx-protocol package",
                  "Implement blueprint decoder in your app",
                  "Add renderer component for your target layout",
                  "Set up JWT verification (if using authentication)",
                  "Create link generator for your use case",
                  "Test with sample blueprints",
                  "Deploy your WebX-enabled client"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-primary">{idx + 1}</span>
                    </div>
                    <p className="text-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center py-16"
        >
          <h2 className="text-2xl font-display font-bold mb-6">Ready to Build?</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/composer">
              <Button size="lg" className="gap-2">
                <Code2 className="w-4 h-4" /> Try the Composer
              </Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="outline" className="gap-2">
                <ArrowRight className="w-4 h-4" /> Back to Home
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
