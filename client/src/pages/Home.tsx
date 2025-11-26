import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { decodeWebX, SAMPLE_BLUEPRINTS, encodeWebX } from "@/lib/webx";
import { ArrowRight, Zap, Code, Layers, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [_, setLocation] = useLocation();

  const handleLoad = () => {
    if (!inputValue) return;
    // If it's a full WebX:// link, strip the protocol
    const payload = inputValue.replace("WebX://", "");
    setLocation(`/view?payload=${payload}`);
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

        {/* Samples */}
        <div className="border-t border-white/10 pt-12">
          <h2 className="text-2xl font-display font-bold mb-8 text-center">Try a Sample Blueprint</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {Object.entries(SAMPLE_BLUEPRINTS).map(([key, blueprint], i) => (
              <Link key={key} href={`/view?payload=${encodeWebX(blueprint)}`}>
                <div className="group cursor-pointer">
                  <div className="bg-gradient-to-br from-white/10 to-transparent p-[1px] rounded-xl hover:from-primary hover:to-secondary transition-all duration-500">
                    <div className="bg-black/80 backdrop-blur-xl rounded-xl p-6 h-full relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity">
                         <ArrowRight className="w-5 h-5 -rotate-45 group-hover:rotate-0 transition-transform duration-300 text-primary" />
                      </div>
                      <Badge variant="outline" className="mb-4 border-white/10 text-xs font-mono text-muted-foreground">
                        {blueprint.layout.toUpperCase()}
                      </Badge>
                      <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">{blueprint.title}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {blueprint.data.find(b => b.type === 'paragraph' || b.type === 'heading')?.value || "View content..."}
                      </p>
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
