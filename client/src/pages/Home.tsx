import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { decodeWebX, SAMPLE_BLUEPRINTS, encodeWebX } from "@/lib/webx";
import { ArrowRight, Zap, Code, Layers, Share2, Globe, Plus, UserCheck } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

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

          <div className="mt-8 flex justify-center gap-4">
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
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-24">
          {[
            {
              icon: <Layers className="w-6 h-6 text-primary" />,
              title: "Client-Side Rendering",
              desc: "No servers required. The browser decodes the JSON payload and builds the UI instantly."
            },
            {
              icon: <Share2 className="w-6 h-6 text-secondary" />,
              title: "Portable Blueprints",
              desc: "Share entire pages as a single link. The content lives inside the URL."
            },
            {
              icon: <Code className="w-6 h-6 text-purple-400" />,
              title: "AI Integration",
              desc: "Embed prompts directly in the protocol. Let the client generate the content on the fly."
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

        {/* The Nexus: Webstore */}
        <div className="border-t border-white/10 pt-12 relative">
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
              <div>
                  <div className="flex items-center gap-2 mb-2">
                      <Globe className="w-5 h-5 text-primary" />
                      <span className="text-xs font-mono uppercase tracking-widest text-primary">Decentralized Registry</span>
                  </div>
                  <h2 className="text-3xl font-display font-bold text-white">The Nexus</h2>
                  <p className="text-muted-foreground mt-2">Curated blueprints from the community.</p>
              </div>
              <Button 
                variant="outline" 
                className="border-white/10 hover:bg-white/5 gap-2"
                onClick={() => toast({ title: "Access Denied", description: "You must be a verified builder to upload to The Nexus.", variant: "destructive" })}
              >
                  <Plus className="w-4 h-4" /> Upload Blueprint
              </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {Object.entries(SAMPLE_BLUEPRINTS).map(([key, blueprint], i) => (
              <Link key={key} href={`/view?payload=${encodeWebX(blueprint)}`}>
                <div className="group cursor-pointer h-full">
                  <div className="bg-gradient-to-br from-white/10 to-transparent p-[1px] rounded-xl hover:from-primary hover:to-secondary transition-all duration-500 h-full">
                    <div className="bg-black/80 backdrop-blur-xl rounded-xl p-6 h-full relative overflow-hidden flex flex-col">
                      <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity z-10">
                         <ArrowRight className="w-5 h-5 -rotate-45 group-hover:rotate-0 transition-transform duration-300 text-primary" />
                      </div>
                      
                      <div className="mb-4 flex justify-between items-start">
                          <Badge variant="outline" className="border-white/10 text-xs font-mono text-muted-foreground">
                            {blueprint.layout.toUpperCase()}
                          </Badge>
                          {blueprint.meta.author === "WebX Foundation" && (
                              <div className="flex items-center gap-1 text-[10px] text-primary font-mono border border-primary/20 px-2 py-0.5 rounded-full bg-primary/10">
                                  <UserCheck className="w-3 h-3" /> VERIFIED
                              </div>
                          )}
                      </div>

                      <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-1">{blueprint.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                        {blueprint.data.find(b => b.type === 'paragraph')?.value || blueprint.data.find(b => b.type === 'heading')?.value || "View content..."}
                      </p>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono pt-4 border-t border-white/5">
                          <span className="w-2 h-2 rounded-full bg-white/20 group-hover:bg-primary transition-colors" />
                          {blueprint.meta.author || "Anonymous"}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      
      <footer className="border-t border-white/10 py-8 text-center text-sm text-muted-foreground font-mono">
        <p>WebX Protocol // Proof of Concept // 2025</p>
      </footer>
    </div>
  );
}
