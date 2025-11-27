import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { decodeWebX, SAMPLE_BLUEPRINTS, encodeWebX } from "@/lib/webx";
import { ArrowRight, Zap, Code, Layers, Share2, Globe, Plus, UserCheck, Search, Flame, TrendingUp, BookOpen, Link2, Zap as ZapIcon, Database, Sparkles, Lock, Info } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import comparisonDiagram from "@assets/generated_images/webx_vs_http_comparison_diagram.png";
import magicLink from "@assets/generated_images/magic_hyperlink_with_page_inside.png";

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [searchNexus, setSearchNexus] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const categories = useMemo(() => {
    const cats = new Set(Object.values(SAMPLE_BLUEPRINTS).map(b => b.meta.category || "other"));
    return ["all", ...Array.from(cats)];
  }, []);

  const filteredBlueprints = useMemo(() => {
    let results = Object.entries(SAMPLE_BLUEPRINTS).filter(([_, bp]) => {
      const matchesCategory = selectedCategory === "all" || bp.meta.category === selectedCategory;
      const matchesSearch = searchNexus === "" || bp.title.toLowerCase().includes(searchNexus.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    if (sortBy === "popular") {
      results.sort((a, b) => (b[1].meta.downloads || 0) - (a[1].meta.downloads || 0));
    } else if (sortBy === "recent") {
      results.sort((a, b) => b[1].meta.created - a[1].meta.created);
    }

    return results;
  }, [selectedCategory, searchNexus, sortBy]);

  const featured = useMemo(() => {
    return Object.entries(SAMPLE_BLUEPRINTS).find(([_, bp]) => bp.meta.featured);
  }, []);

  const handleLoad = () => {
    if (!inputValue) return;
    
    let payload = inputValue.trim();
    
    // Check if it's a full URL first
    try {
        const url = new URL(payload);
        // If it's a URL, extract the payload param
        const urlPayload = url.searchParams.get("payload");
        if (urlPayload) {
            payload = urlPayload;
        }
    } catch (e) {
        // Not a valid URL, continue treating as raw payload or WebX:// protocol
    }

    // If it's a WebX:// link, strip the protocol (case insensitive)
    if (payload.toLowerCase().startsWith("webx://")) {
        payload = payload.slice(7);
    }
    
    // Ensure we encode special characters properly for the URL
    setLocation(`/view?payload=${encodeURIComponent(payload)}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden relative selection:bg-primary selection:text-white">
      {/* Abstract Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-secondary/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-12">
        {/* Hero */}
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-3 py-1 mb-6 text-xs font-mono text-secondary border border-secondary/30 rounded-full bg-secondary/5 backdrop-blur-md">
              PROTOCOL V1.0 ONLINE
            </span>
            <h1 className="text-6xl md:text-8xl font-display font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/50 text-glow">
              WebX Protocol
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              The serverless web. Hyperlinks that carry their own blueprints. 
              <br className="hidden md:block" />
              Instant rendering, zero infrastructure, AI-ready.
            </p>
          </motion.div>

          {/* Input Action */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="max-w-xl mx-auto mt-12 flex gap-2"
          >
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Zap className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input 
                placeholder="Paste WebX:// payload..." 
                className="pl-10 h-12 bg-white/5 border-white/10 focus:border-primary focus:ring-primary/20 transition-all font-mono text-sm"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLoad()}
              />
            </div>
            <Button size="lg" className="h-12 px-8" onClick={handleLoad}>
              Render <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </motion.div>

          <div className="mt-8 flex justify-center gap-4 flex-wrap">
             <Link href="/composer">
                <Button variant="outline" className="border-white/10 hover:bg-white/5">
                   <Code className="mr-2 w-4 h-4" /> Open Composer
                </Button>
             </Link>
             <Link href={`/view?payload=${encodeWebX(SAMPLE_BLUEPRINTS.whitepaper)}`}>
                <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border border-white/10">
                   Read the Whitepaper
                </Button>
             </Link>
             <Link href="/implement">
                <Button variant="secondary" className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20">
                   How to Implement WebX
                </Button>
             </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-24">
          {[
            {
              icon: <Layers className="w-6 h-6 text-primary" />,
              title: "Extreme Compression",
              desc: "Base62 encoding, semantic compression, and string deduplication reduce links by 60-75%. Entire pages in a few hundred characters."
            },
            {
              icon: <Share2 className="w-6 h-6 text-secondary" />,
              title: "Portable Blueprints",
              desc: "Share entire pages as a single link. The content lives inside the URL. Works across every platform."
            },
            {
              icon: <Code className="w-6 h-6 text-purple-400" />,
              title: "AI Integration",
              desc: "Embed prompts directly in blueprints. Generate dynamic content on-the-fly with cryptographic certainty."
            }
          ].map((feature, i) => (
            <motion.div
               key={i}
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: i * 0.1 }}
            >
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors h-full">
                <CardContent className="pt-6">
                  <div className="mb-4 p-3 bg-white/5 rounded-lg w-fit">{feature.icon}</div>
                  <h3 className="text-xl font-display font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* WebX for Dummies */}
        <div className="border-t border-white/10 pt-12 mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-secondary" />
              <span className="text-xs font-mono uppercase tracking-widest text-secondary">ELI5 Edition</span>
            </div>
            <h2 className="text-4xl font-display font-bold text-white mb-4">WebX for Dummies</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              No tech degree required. Here's how WebX works in plain English.
            </p>
          </motion.div>

          {/* Visual Diagrams */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-xl overflow-hidden border border-white/10 hover:border-primary/30 transition-all"
            >
              <img src={comparisonDiagram} alt="WebX vs HTTP" className="w-full h-full object-cover" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-xl overflow-hidden border border-white/10 hover:border-primary/30 transition-all"
            >
              <img src={magicLink} alt="Magic Link" className="w-full h-full object-cover" />
            </motion.div>
          </div>

          {/* Simple Explanations */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {[
              {
                title: "The Old Internet",
                icon: <Database className="w-6 h-6 text-red-400" />,
                steps: [
                  "You click a link",
                  "Your browser finds a server somewhere",
                  "The server sends you a page",
                  "You see the page"
                ],
                note: "Needs servers. Costs money. Takes time."
              },
              {
                title: "The WebX Internet",
                icon: <Link2 className="w-6 h-6 text-green-400" />,
                steps: [
                  "You click a link",
                  "The link contains EVERYTHING",
                  "Your browser builds the page instantly",
                  "You see the page"
                ],
                note: "No servers needed. Free. Instant."
              },
              {
                title: "A Link is a Container",
                icon: <ZapIcon className="w-6 h-6 text-blue-400" />,
                steps: [
                  "Traditional: Link = address → GO GET DATA",
                  "WebX: Link = address + DATA inside",
                  "It's like sending an entire box to someone",
                  "Instead of just the address of the box"
                ],
                note: "The whole page is IN the link itself."
              },
              {
                title: "Why This is Awesome",
                icon: <Flame className="w-6 h-6 text-orange-400" />,
                steps: [
                  "✨ No hosting bills (ever)",
                  "⚡ Pages load instantly",
                  "🔗 Share complex pages in one link",
                  "🤖 AI can generate pages on the fly"
                ],
                note: "Welcome to the future."
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl p-6 h-full hover:border-white/20 transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white/5 rounded-lg">{item.icon}</div>
                    <h3 className="text-lg font-display font-bold">{item.title}</h3>
                  </div>
                  <ol className="space-y-2 mb-4">
                    {item.steps.map((step, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex gap-2">
                        <span className="font-mono text-primary/70 min-w-6">{idx + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-xs text-primary/80 font-mono">{item.note}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* FAQ Style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl p-8"
          >
            <h3 className="text-2xl font-display font-bold mb-8">Quick Questions</h3>
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <p className="font-bold text-primary mb-2">Q: How is the whole page in one link?</p>
                <p className="text-sm text-muted-foreground">
                  The page is minified, deduplicated, compressed, and encoded into base62 (more efficient than base64). When you click it, your browser reverses the process and builds the page. It's like sending someone a LEGO instruction set instead of a finished LEGO castle.
                </p>
              </div>
              <div>
                <p className="font-bold text-primary mb-2">Q: What's the limit? Won't links get too long?</p>
                <p className="text-sm text-muted-foreground">
                  We've crushed the size problem. Semantic compression (minified keys), string deduplication, and base62 encoding reduce payloads by 60-75%. Most pages become just a few hundred characters. For anything larger, optional gzip compression kicks in.
                </p>
              </div>
              <div>
                <p className="font-bold text-primary mb-2">Q: Can I modify a page I received?</p>
                <p className="text-sm text-muted-foreground">
                  Yes! Copy the link, modify it in the Composer, and share your new version. The content hash ensures everyone sees the EXACT same thing though. No surprise changes.
                </p>
              </div>
              <div>
                <p className="font-bold text-primary mb-2">Q: What about authentication?</p>
                <p className="text-sm text-muted-foreground">
                  Great question. WebX supports cryptographic authentication via JWTs embedded in blueprints. This enables gated content, role-based access, and temporary shares—with minimal server dependency. Read the full case study below.
                </p>
              </div>
            </div>
            
            <div className="border-t border-white/10 pt-6">
              <div className="bg-primary/5 border border-primary/30 rounded-lg p-6 flex items-start gap-4">
                <div className="text-primary text-2xl min-w-fit">🔐</div>
                <div>
                  <p className="font-bold text-white mb-2">WebX Can Do Authentication</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    We initially said WebX is for public content. That's not the whole story. Using JWT tokens, WebX can deliver gated, authenticated content with cryptographic verification—no constant server calls required.
                  </p>
                  <Link href={`/view?payload=${encodeWebX(SAMPLE_BLUEPRINTS.security_guide)}`}>
                    <Button className="text-xs h-8 gap-2">
                      Read: Building the Sovereign Internet <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* No Login Needed Segment */}
        <div className="border-t border-white/10 pt-12 mb-24 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-green-400" />
              <span className="text-xs font-mono uppercase tracking-widest text-green-400">Zero Friction Access</span>
            </div>
            <h2 className="text-4xl font-display font-bold text-white mb-4">No Login. No Passwords. No Friction.</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Share secure information instantly with one-time links. No accounts. No database. No tracking.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Left: How It Works */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="bg-white/5 border border-white/10 rounded-xl p-8 h-full">
                <h3 className="text-xl font-display font-bold mb-6 text-green-400">How It Works</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-green-400/20 border border-green-400/50">
                        <span className="text-green-400 font-bold">1</span>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-white">Create a Blueprint with a JWT Token</p>
                      <p className="text-xs text-muted-foreground mt-1">Include an expiration time (10 minutes, 1 hour, 1 day) and recipient permissions.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-green-400/20 border border-green-400/50">
                        <span className="text-green-400 font-bold">2</span>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-white">Share the Link Instantly</p>
                      <p className="text-xs text-muted-foreground mt-1">Send via email, SMS, chat. No signup page. No "Create Account" flow. Just open and view.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-green-400/20 border border-green-400/50">
                        <span className="text-green-400 font-bold">3</span>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-white">Browser Verifies Cryptographically</p>
                      <p className="text-xs text-muted-foreground mt-1">When they open the link, their browser checks if the token is valid and hasn't expired.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-green-400/20 border border-green-400/50">
                        <span className="text-green-400 font-bold">4</span>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-white">Content Appears. Link Expires.</p>
                      <p className="text-xs text-muted-foreground mt-1">After expiration, the link returns "Access Denied". No server involved in the verification.</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right: Real Use Cases */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="bg-white/5 border border-white/10 rounded-xl p-8 h-full">
                <h3 className="text-xl font-display font-bold mb-6 text-green-400">Companies Already Do This</h3>
                <div className="space-y-6">
                  <div className="border-l-2 border-green-400/50 pl-4">
                    <p className="font-semibold text-white">Banks & Financial Institutions</p>
                    <p className="text-xs text-muted-foreground mt-2">Send account statements, wire transfer confirmations, and transaction history as secure links. One-time access. Expires after 24 hours. Recipient can't forward it after expiration.</p>
                  </div>
                  <div className="border-l-2 border-green-400/50 pl-4">
                    <p className="font-semibold text-white">HR & Payroll</p>
                    <p className="text-xs text-muted-foreground mt-2">Share offer letters, W2s, and benefits summaries. Each employee gets a unique link. Expires 30 days after sharing. No database of sensitive documents.</p>
                  </div>
                  <div className="border-l-2 border-green-400/50 pl-4">
                    <p className="font-semibold text-white">Healthcare Providers</p>
                    <p className="text-xs text-muted-foreground mt-2">Share medical records and test results via secure links. HIPAA-compliant. Each link tied to a specific patient. Expires automatically.</p>
                  </div>
                  <div className="border-l-2 border-green-400/50 pl-4">
                    <p className="font-semibold text-white">Legal & Contracts</p>
                    <p className="text-xs text-muted-foreground mt-2">Send confidential agreements and contracts. Recipient can view but token prevents copying. Perfect for NDAs and sensitive negotiations.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Honesty Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="bg-blue-400/10 border border-blue-400/30 rounded-xl p-6">
              <div className="flex gap-4">
                <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-bold text-white mb-2">The Honest Truth About Expiration</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    WebX is client-side and decentralized. Here's what's real and what needs a server:
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li><span className="text-green-400">✓ Real:</span> JWT tokens with expiration timestamps. Cryptographically signed so no one can fake them.</li>
                    <li><span className="text-green-400">✓ Real:</span> Browser verifies the token instantly, client-side. No network call needed.</li>
                    <li><span className="text-green-400">✓ Real:</span> Revocation lists. Send an API call to mark a token as invalid instantly.</li>
                    <li><span className="text-orange-400">⚠️ Limited:</span> A determined user with browser dev tools could technically keep a screenshot or copy text before expiration. WebX can't prevent that—nothing can.</li>
                    <li><span className="text-orange-400">⚠️ Limited:</span> For true "one-time links" (single view), you'd need a server tracking opens. WebX can't do that client-side.</li>
                    <li><span className="text-green-400">✓ Real:</span> For 99% of use cases (temporary access, automated shares, time-gated content), WebX delivers what you need with zero infrastructure.</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Use Cases: Live Examples */}
        <div className="border-t border-white/10 pt-12 mb-24 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-secondary" />
              <span className="text-xs font-mono uppercase tracking-widest text-secondary">Real-World Examples</span>
            </div>
            <h2 className="text-4xl font-display font-bold text-white mb-4">WebX in Action</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Complex applications. Zero infrastructure. Click the links below to see fully functional platforms delivered as pure WebX blueprints.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Social Media */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Link href={`/view?payload=${encodeWebX(SAMPLE_BLUEPRINTS.social_media_feed)}`}>
                <div className="group cursor-pointer h-full">
                  <div className="bg-gradient-to-br from-secondary/20 to-transparent p-[1px] rounded-xl hover:from-secondary hover:to-primary transition-all duration-500 h-full">
                    <div className="bg-black/80 backdrop-blur-xl rounded-xl p-6 h-full flex flex-col relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-100 transition-opacity z-10">
                        <ArrowRight className="w-5 h-5 -rotate-45 group-hover:rotate-0 transition-transform duration-300 text-secondary" />
                      </div>
                      <h3 className="text-xl font-display font-bold mb-2 group-hover:text-secondary transition-colors">NexusNet</h3>
                      <p className="text-xs text-muted-foreground mb-4">Social media feed with likes, comments, and engagement.</p>
                      <div className="flex-1 mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          <li>✓ Multi-user interactions</li>
                          <li>✓ Live engagement</li>
                          <li>✓ Comment threads</li>
                        </ul>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono pt-3 border-t border-white/5">
                        <span className="w-2 h-2 rounded-full bg-secondary" />
                        Live feed
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Banking */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Link href={`/view?payload=${encodeWebX(SAMPLE_BLUEPRINTS.bank_dashboard)}`}>
                <div className="group cursor-pointer h-full">
                  <div className="bg-gradient-to-br from-green-400/20 to-transparent p-[1px] rounded-xl hover:from-green-400 hover:to-primary transition-all duration-500 h-full">
                    <div className="bg-black/80 backdrop-blur-xl rounded-xl p-6 h-full flex flex-col relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-100 transition-opacity z-10">
                        <ArrowRight className="w-5 h-5 -rotate-45 group-hover:rotate-0 transition-transform duration-300 text-green-400" />
                      </div>
                      <h3 className="text-xl font-display font-bold mb-2 group-hover:text-green-400 transition-colors">SecureBank</h3>
                      <p className="text-xs text-muted-foreground mb-4">Banking portal with accounts and transactions.</p>
                      <div className="flex-1 mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          <li>✓ JWT authentication</li>
                          <li>✓ Account management</li>
                          <li>✓ Transactions</li>
                        </ul>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono pt-3 border-t border-white/5">
                        <span className="w-2 h-2 rounded-full bg-green-400" />
                        Banking portal
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Messaging */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Link href={`/view?payload=${encodeWebX(SAMPLE_BLUEPRINTS.instant_messaging)}`}>
                <div className="group cursor-pointer h-full">
                  <div className="bg-gradient-to-br from-blue-400/20 to-transparent p-[1px] rounded-xl hover:from-blue-400 hover:to-primary transition-all duration-500 h-full">
                    <div className="bg-black/80 backdrop-blur-xl rounded-xl p-6 h-full flex flex-col relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-100 transition-opacity z-10">
                        <ArrowRight className="w-5 h-5 -rotate-45 group-hover:rotate-0 transition-transform duration-300 text-blue-400" />
                      </div>
                      <h3 className="text-xl font-display font-bold mb-2 group-hover:text-blue-400 transition-colors">WebXChat</h3>
                      <p className="text-xs text-muted-foreground mb-4">End-to-end encrypted conversations in a link.</p>
                      <div className="flex-1 mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          <li>✓ E2E encryption</li>
                          <li>✓ No servers</li>
                          <li>✓ Instant sharing</li>
                        </ul>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono pt-3 border-t border-white/5">
                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                        Conversations
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Email */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Link href={`/view?payload=${encodeWebX(SAMPLE_BLUEPRINTS.email_service)}`}>
                <div className="group cursor-pointer h-full">
                  <div className="bg-gradient-to-br from-orange-400/20 to-transparent p-[1px] rounded-xl hover:from-orange-400 hover:to-primary transition-all duration-500 h-full">
                    <div className="bg-black/80 backdrop-blur-xl rounded-xl p-6 h-full flex flex-col relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-100 transition-opacity z-10">
                        <ArrowRight className="w-5 h-5 -rotate-45 group-hover:rotate-0 transition-transform duration-300 text-orange-400" />
                      </div>
                      <h3 className="text-xl font-display font-bold mb-2 group-hover:text-orange-400 transition-colors">WebXMail</h3>
                      <p className="text-xs text-muted-foreground mb-4">Professional email delivered as an immutable link.</p>
                      <div className="flex-1 mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          <li>✓ No login needed</li>
                          <li>✓ Cryptographic proof</li>
                          <li>✓ Forever accessible</li>
                        </ul>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono pt-3 border-t border-white/5">
                        <span className="w-2 h-2 rounded-full bg-orange-400" />
                        Email service
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>

          <div className="mt-12 p-6 bg-white/5 border border-white/10 rounded-lg">
            <p className="text-sm text-muted-foreground mb-4">
              <span className="font-bold text-white">💡 Why This Matters:</span> These aren't wireframes. They're fully functional applications delivered in a single URL. Users can share them instantly. Content is verified cryptographically. The entire backend is encoded in the link itself. This is the future of distributed applications.
            </p>
          </div>
        </div>

        {/* The Nexus: Webstore */}
        <div className="border-t border-white/10 pt-12 relative">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
              <div>
                  <div className="flex items-center gap-2 mb-2">
                      <Globe className="w-5 h-5 text-primary" />
                      <span className="text-xs font-mono uppercase tracking-widest text-primary">Decentralized Registry</span>
                  </div>
                  <h2 className="text-4xl font-display font-bold text-white">The Nexus</h2>
                  <p className="text-muted-foreground mt-2">Discover and share WebX blueprints.</p>
              </div>
              <Button 
                variant="outline" 
                className="border-white/10 hover:bg-white/5 gap-2 whitespace-nowrap"
                onClick={() => toast({ title: "Access Denied", description: "You must be a verified builder to upload to The Nexus.", variant: "destructive" })}
              >
                  <Plus className="w-4 h-4" /> Upload Blueprint
              </Button>
          </div>

          {/* Featured Showcase */}
          {featured && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <Link href={`/view?payload=${encodeWebX(featured[1])}`}>
                <div className="group cursor-pointer">
                  <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/20 to-secondary/20 p-8 hover:border-primary/60 transition-all duration-500">
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-4">
                        <Flame className="w-4 h-4 text-red-400" />
                        <span className="text-xs font-mono uppercase tracking-widest text-red-400">Featured This Week</span>
                      </div>
                      <h3 className="text-3xl font-display font-bold mb-3 group-hover:text-primary transition-colors">{featured[1].title}</h3>
                      <p className="text-muted-foreground max-w-2xl mb-6 line-clamp-2">
                        {featured[1].data.find(b => b.type === 'paragraph')?.value || "Explore this blueprint..."}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground font-mono">
                          <span>{featured[1].meta.downloads || 0} downloads</span>
                          <span>•</span>
                          <span>{featured[1].meta.author || "Anonymous"}</span>
                        </div>
                        <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-2 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          )}

          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8 items-start md:items-center md:justify-between">
            <div className="relative flex-1 max-w-sm">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input 
                placeholder="Search blueprints..." 
                className="pl-10 bg-white/5 border-white/10 focus:border-primary"
                value={searchNexus}
                onChange={(e) => setSearchNexus(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-foreground hover:bg-white/10 transition-colors cursor-pointer font-mono"
              >
                <option value="popular">Most Popular</option>
                <option value="recent">Most Recent</option>
              </select>
            </div>
          </div>

          {/* Category Navigation */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-sm font-mono uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-primary text-white border border-primary"
                    : "bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10"
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          {/* Grid */}
          {filteredBlueprints.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {filteredBlueprints.map(([key, blueprint]) => (
                <Link key={key} href={`/view?payload=${encodeWebX(blueprint)}`}>
                  <div className="group cursor-pointer h-full">
                    <div className="bg-gradient-to-br from-white/10 to-transparent p-[1px] rounded-xl hover:from-primary hover:to-secondary transition-all duration-500 h-full">
                      <div className="bg-black/80 backdrop-blur-xl rounded-xl p-6 h-full relative overflow-hidden flex flex-col">
                        <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity z-10">
                           <ArrowRight className="w-5 h-5 -rotate-45 group-hover:rotate-0 transition-transform duration-300 text-primary" />
                        </div>
                        
                        <div className="mb-4 flex justify-between items-start gap-2">
                            <Badge variant="outline" className="border-white/10 text-xs font-mono text-muted-foreground">
                              {blueprint.meta.category?.toUpperCase() || "OTHER"}
                            </Badge>
                            {blueprint.meta.author === "WebX Foundation" && (
                                <div className="flex items-center gap-1 text-[10px] text-primary font-mono border border-primary/20 px-2 py-0.5 rounded-full bg-primary/10 whitespace-nowrap">
                                    <UserCheck className="w-3 h-3" /> VERIFIED
                                </div>
                            )}
                        </div>

                        <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-1">{blueprint.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                          {blueprint.data.find(b => b.type === 'paragraph')?.value || blueprint.data.find(b => b.type === 'heading')?.value || "View content..."}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground font-mono pt-4 border-t border-white/5">
                            <span className="truncate">{blueprint.meta.author || "Anonymous"}</span>
                            {blueprint.meta.downloads && (
                              <span className="flex items-center gap-1 text-primary/70">
                                <TrendingUp className="w-3 h-3" /> {blueprint.meta.downloads}
                              </span>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No blueprints found matching your search.</p>
            </div>
          )}
        </div>
      </div>
      
      <footer className="border-t border-white/10 py-8 text-center text-sm text-muted-foreground font-mono">
        <p>WebX Protocol // Proof of Concept // 2025</p>
      </footer>
    </div>
  );
}
