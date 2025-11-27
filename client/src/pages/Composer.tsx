import { useState } from "react";
import { useLocation } from "wouter";
import { WebXBlueprint, ContentBlock, encodeWebX, getPayloadMetrics } from "@/lib/webx";
import { WebXRenderer } from "@/components/webx/Renderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Eye, Code, Save, ArrowLeft, Copy, Check, Sparkles, Fingerprint, QrCode, Zap, Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Separator as SeparatorComp } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { QRCodeSVG as QRCode } from "qrcode.react";

const DEFAULT_BLUEPRINT: WebXBlueprint = {
  title: "My New Page",
  layout: "article",
  meta: { version: "1.0", author: "Me", created: Date.now() },
  data: [
    { type: "heading", value: "Hello World" },
    { type: "paragraph", value: "Start editing this content block to build your WebX page." }
  ]
};

export default function Composer() {
  const [blueprint, setBlueprint] = useState<WebXBlueprint>(DEFAULT_BLUEPRINT);
  const [activeTab, setActiveTab] = useState("editor");
  const [generatedLink, setGeneratedLink] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isBaking, setIsBaking] = useState(false);
  const [useCompression, setUseCompression] = useState(false);
  const [showQR, setShowQR] = useState(true);
  const [expirationMinutes, setExpirationMinutes] = useState<number | null>(null);
  const [expireOnFirstView, setExpireOnFirstView] = useState(false);
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const handleDownloadWebX = () => {
    const dataStr = JSON.stringify(blueprint, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${blueprint.title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.webx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      title: "Downloaded",
      description: `Saved as ${blueprint.title}.webx`
    });
  };

  const handleImportWebX = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const importedBlueprint = JSON.parse(content) as WebXBlueprint;
        setBlueprint(importedBlueprint);
        toast({
          title: "Imported",
          description: `Loaded blueprint: ${importedBlueprint.title}`
        });
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to parse .webx file. Make sure it's valid JSON.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };
  
  const metrics = getPayloadMetrics(blueprint);

  const updateMeta = (key: string, value: string) => {
    setBlueprint(prev => ({
        ...prev,
        meta: { ...prev.meta, [key]: value }
    }));
  };

  const addBlock = (type: ContentBlock["type"], value?: string) => {
    const newBlock: ContentBlock = { type, value: value || "", props: {} };
    if (type === "image" && !value) {
        newBlock.props = { src: "https://placehold.co/600x400", alt: "Placeholder" };
        newBlock.value = "https://placehold.co/600x400"; // fallback
    }
    if (type === "metric" && !value) {
        newBlock.value = "9.2K";
        newBlock.props = { label: "Growth", subtitle: "Month over month" };
    }
    if (type === "table" && !value) {
        newBlock.value = "Header 1,Header 2,Header 3|Data 1,Data 2,Data 3";
    }
    if (type === "callout" && !value) {
        newBlock.value = "Important information goes here";
        newBlock.props = { title: "Note", severity: "info" };
    }
    setBlueprint(prev => ({
      ...prev,
      data: [...prev.data, newBlock]
    }));
  };
  
  const handleBakeAI = () => {
      if (!blueprint.ai?.prompt) return;
      
      setIsBaking(true);
      
      // Simulate AI call
      setTimeout(() => {
          const prompt = blueprint.ai?.prompt || "";
          const generatedText = `[BAKED CONTENT]: Based on "${prompt}"...\n\nThe digital landscape shifted, revealing a structure of pure logic. It was consistent, immutable, and distributed across the mesh. Each node verified the integrity of the data, ensuring that what was written could not be unwritten.`;
          
          // Add the generated text as a permanent block
          addBlock("paragraph", generatedText);
          
          // Clear the AI prompt so it's static now
          setBlueprint(prev => ({
              ...prev,
              ai: { ...prev.ai, prompt: "", auto_generate: false }
          }));
          
          setIsBaking(false);
          toast({
              title: "Content Baked",
              description: "AI content has been converted to a static block for consistency.",
          });
      }, 1500);
  };

  const updateBlock = (index: number, field: keyof ContentBlock, value: any) => {
    setBlueprint(prev => {
      const newData = [...prev.data];
      newData[index] = { ...newData[index], [field]: value };
      return { ...prev, data: newData };
    });
  };
  
  const updateBlockProp = (index: number, propKey: string, propValue: any) => {
      setBlueprint(prev => {
          const newData = [...prev.data];
          const currentProps = newData[index].props || {};
          newData[index] = { 
              ...newData[index], 
              props: { ...currentProps, [propKey]: propValue } 
          };
          return { ...prev, data: newData };
      });
  }

  const removeBlock = (index: number) => {
    setBlueprint(prev => ({
      ...prev,
      data: prev.data.filter((_, i) => i !== index)
    }));
  };

  const handleGenerate = () => {
      let blueprintToEncode = blueprint;
      
      // Add expiration to blueprint if set
      if (expirationMinutes !== null || expireOnFirstView) {
        const jwtData: any = {
          token: "demo_token_" + Math.random().toString(36).slice(2, 11),
          permissions: ["read"]
        };
        
        if (expirationMinutes !== null) {
          jwtData.expiration = Date.now() + (expirationMinutes * 60 * 1000);
        }
        
        if (expireOnFirstView) {
          jwtData.expireOnFirstView = true;
        }
        
        blueprintToEncode = {
          ...blueprint,
          jwt: jwtData
        };
      }
      
      const payload = encodeWebX(blueprintToEncode, useCompression);
      const url = `${window.location.origin}/view?payload=${payload}`;
      setGeneratedLink(url);
      setIsDialogOpen(true);
      setCopied(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
        title: "Link Copied",
        description: "WebX link copied to clipboard.",
    });
  };

  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-card/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="font-display font-bold text-lg">WebX Composer</h1>
        </div>
        <div className="flex gap-2">
           <label className="cursor-pointer">
             <input 
               type="file" 
               accept=".webx,.json"
               onChange={handleImportWebX}
               className="hidden"
             />
             <Button size="sm" variant="outline" asChild>
               <span>
                 <Upload className="w-4 h-4 mr-2" /> Import .webx
               </span>
             </Button>
           </label>
           <Button size="sm" variant="outline" onClick={handleDownloadWebX} className="gap-2">
             <Download className="w-4 h-4" /> Download .webx
           </Button>
           <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
             <DialogTrigger asChild>
               <Button size="sm" onClick={handleGenerate} className="bg-primary hover:bg-primary/90 text-white">
                 <Save className="w-4 h-4 mr-2" /> Generate Link
               </Button>
             </DialogTrigger>
             <DialogContent className="sm:max-w-2xl border-white/10 bg-background/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
               <DialogHeader>
                 <DialogTitle>Your WebX Link is Ready</DialogTitle>
                 <DialogDescription>
                   Share instantly or scan with your phone.
                 </DialogDescription>
               </DialogHeader>
               
               {/* Payload Metrics */}
               <div className="mb-4 p-4 bg-white/5 rounded-lg border border-white/10">
                 <div className="grid grid-cols-2 gap-3 mb-4">
                   <div>
                     <p className="text-xs text-muted-foreground font-mono">Original</p>
                     <p className="text-sm font-bold">{(metrics.originalSize / 1024).toFixed(1)} KB</p>
                   </div>
                   <div>
                     <p className="text-xs text-muted-foreground font-mono">Standard</p>
                     <p className="text-sm font-bold text-yellow-400">{(metrics.base64CompressedSize / 1024).toFixed(1)} KB</p>
                   </div>
                   <div>
                     <p className="text-xs text-muted-foreground font-mono">Advanced</p>
                     <p className="text-sm font-bold text-green-400">{((metrics as any).optimizedSize / 1024).toFixed(1)} KB</p>
                   </div>
                   <div>
                     <p className="text-xs text-muted-foreground font-mono">Total Savings</p>
                     <p className="text-sm font-bold text-primary">{((metrics as any).advancedRatio)}% smaller</p>
                   </div>
                 </div>
                 <p className="text-xs text-muted-foreground border-t border-white/10 pt-3">
                   Advanced: minified keys (30% smaller) + string deduplication (25% smaller) + base62 encoding (15% smaller) + optional gzip
                 </p>
               </div>
               
               {/* Compression Toggle */}
               <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 mb-4">
                 <div className="flex items-center gap-2">
                   <Zap className="w-4 h-4 text-yellow-400" />
                   <span className="text-sm font-mono">Enable Compression</span>
                 </div>
                 <input 
                   type="checkbox" 
                   checked={useCompression}
                   onChange={(e) => setUseCompression(e.target.checked)}
                   className="w-4 h-4 cursor-pointer"
                 />
               </div>
               
               {/* QR Code */}
               {showQR && generatedLink && (
                 <div className="flex justify-center mb-4 p-4 bg-white/5 rounded-lg border border-white/10">
                   <QRCode 
                     value={generatedLink}
                     size={180}
                     level="H"
                     includeMargin={true}
                     bgColor="#000000"
                     fgColor="#00FF00"
                   />
                 </div>
               )}
               
               <div className="space-y-3 mt-4">
                 <div>
                   <Label className="text-xs text-muted-foreground mb-2 block">Full URL Link</Label>
                   <div className="flex items-center space-x-2">
                     <div className="grid flex-1 gap-2">
                       <Input
                         readOnly
                         value={generatedLink}
                         className="bg-white/5 border-white/10 font-mono text-xs h-9"
                       />
                     </div>
                     <Button 
                       type="submit" 
                       size="sm" 
                       className="px-3" 
                       onClick={() => {
                         navigator.clipboard.writeText(generatedLink);
                         setCopied(true);
                         setTimeout(() => setCopied(false), 2000);
                         toast({ title: "Copied", description: "Full URL copied to clipboard." });
                       }}
                     >
                       {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                       <span className="sr-only">Copy</span>
                     </Button>
                   </div>
                 </div>

                 <div>
                   <Label className="text-xs text-muted-foreground mb-2 block">WebX Payload Link</Label>
                   <div className="flex items-center space-x-2">
                     <div className="grid flex-1 gap-2">
                       <Input
                         readOnly
                         value={`WebX://${generatedLink.split('payload=')[1] || ''}`}
                         className="bg-white/5 border-white/10 font-mono text-xs h-9"
                       />
                     </div>
                     <Button 
                       type="submit" 
                       size="sm" 
                       className="px-3" 
                       onClick={() => {
                         navigator.clipboard.writeText(`WebX://${generatedLink.split('payload=')[1] || ''}`);
                         setCopied(true);
                         setTimeout(() => setCopied(false), 2000);
                         toast({ title: "Copied", description: "WebX payload link copied to clipboard." });
                       }}
                     >
                       {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                       <span className="sr-only">Copy</span>
                     </Button>
                   </div>
                 </div>
               </div>
             </DialogContent>
           </Dialog>
        </div>
      </header>

      {/* Main Content */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Editor Panel */}
        <ResizablePanel defaultSize={40} minSize={30} className="bg-background/50 border-r border-white/10">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-8">
              
              {/* Meta Section */}
              <section className="space-y-4">
                <h3 className="text-sm font-mono uppercase text-muted-foreground tracking-wider">Metadata</h3>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Page Title</Label>
                    <Input 
                        value={blueprint.title} 
                        onChange={(e) => setBlueprint(prev => ({ ...prev, title: e.target.value }))} 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Layout</Label>
                        <Select 
                            value={blueprint.layout} 
                            onValueChange={(v: any) => setBlueprint(prev => ({ ...prev, layout: v }))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="article">Article</SelectItem>
                                <SelectItem value="card">Card</SelectItem>
                                <SelectItem value="minimal">Minimal</SelectItem>
                                <SelectItem value="newsfeed">Newsfeed (WIP)</SelectItem>
                            </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Author</Label>
                        <Input 
                            value={blueprint.meta.author} 
                            onChange={(e) => updateMeta('author', e.target.value)} 
                        />
                      </div>
                  </div>
                  
                  {/* Expiration Settings */}
                  <div className="space-y-2 border border-green-400/30 p-4 rounded-lg bg-green-400/5">
                      <Label className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_#4ade80]" />
                          Link Expiration (Optional)
                      </Label>
                      <Select 
                          value={expirationMinutes?.toString() || "never"}
                          onValueChange={(v) => {
                            setExpirationMinutes(v === "never" ? null : parseInt(v));
                            setExpireOnFirstView(false);
                          }}
                      >
                          <SelectTrigger className="bg-white/5 border-white/10">
                              <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="never">No Expiration</SelectItem>
                              <SelectItem value="10">10 Minutes</SelectItem>
                              <SelectItem value="60">1 Hour</SelectItem>
                              <SelectItem value="1440">1 Day</SelectItem>
                              <SelectItem value="10080">1 Week</SelectItem>
                              <SelectItem value="43200">30 Days</SelectItem>
                          </SelectContent>
                      </Select>
                      {expirationMinutes && (
                        <p className="text-xs text-green-400 font-mono">
                          Link expires in {expirationMinutes} minute{expirationMinutes > 1 ? 's' : ''} ({new Date(Date.now() + expirationMinutes * 60 * 1000).toLocaleString()})
                        </p>
                      )}
                      
                      {/* Expire on First View */}
                      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-green-400/20">
                        <input
                          type="checkbox"
                          id="expireOnFirstView"
                          checked={expireOnFirstView}
                          onChange={(e) => {
                            setExpireOnFirstView(e.target.checked);
                            if (e.target.checked) setExpirationMinutes(null);
                          }}
                          className="w-4 h-4 rounded cursor-pointer"
                        />
                        <label htmlFor="expireOnFirstView" className="text-sm cursor-pointer">
                          <p className="font-semibold text-white">Expire After First Opening</p>
                          <p className="text-xs text-muted-foreground">Link becomes invalid after the first view</p>
                        </label>
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                          {expireOnFirstView 
                            ? "Link can only be viewed once. Perfect for one-time sharing or sensitive content." 
                            : expirationMinutes 
                            ? "Link expires at a specific time." 
                            : "Embed an expiration rule in the blueprint. Recipients will see 'Access Denied' when expired."}
                      </p>
                  </div>

                  {/* AI Settings */}
                  <div className="space-y-2 border border-white/10 p-4 rounded-lg bg-white/5">
                      <div className="flex items-center justify-between">
                          <Label className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]" />
                              AI Content Generation
                          </Label>
                          {blueprint.ai?.prompt && (
                              <Button 
                                  size="sm" 
                                  variant="secondary" 
                                  className="h-6 text-xs bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/50"
                                  onClick={handleBakeAI}
                                  disabled={isBaking}
                              >
                                  {isBaking ? <Sparkles className="w-3 h-3 animate-spin mr-1" /> : <Fingerprint className="w-3 h-3 mr-1" />}
                                  {isBaking ? "Baking..." : "Bake to Static"}
                              </Button>
                          )}
                      </div>
                      <Input 
                         placeholder="Prompt for AI generation..." 
                         value={blueprint.ai?.prompt || ""}
                         onChange={(e) => setBlueprint(prev => ({
                             ...prev,
                             ai: { 
                                 prompt: e.target.value, 
                                 auto_generate: !!e.target.value 
                             }
                         }))}
                      />
                      <p className="text-xs text-muted-foreground">
                          {blueprint.ai?.prompt 
                              ? "Click 'Bake to Static' to freeze the output for deterministic rendering." 
                              : "If set, content can be generated dynamically or baked into the blueprint."}
                      </p>
                  </div>
                </div>
              </section>

              <SeparatorComp className="bg-white/10" />

              {/* Blocks Section */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                   <h3 className="text-sm font-mono uppercase text-muted-foreground tracking-wider">Content Blocks</h3>
                </div>
                
                <div className="space-y-4">
                    {blueprint.data.map((block, index) => (
                        <Card key={index} className="bg-card/30 border-white/10 relative group">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => removeBlock(index)}
                            >
                                <Trash2 className="w-3 h-3" />
                            </Button>
                            <CardContent className="p-4 pt-8 space-y-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="secondary" className="font-mono text-[10px] uppercase">{block.type}</Badge>
                                </div>
                                
                                {block.type === 'heading' || block.type === 'paragraph' || block.type === 'button' || block.type === 'code' || block.type === 'quote' ? (
                                    <Textarea 
                                        value={block.value} 
                                        onChange={(e) => updateBlock(index, 'value', e.target.value)}
                                        className="min-h-[80px] bg-background/50"
                                        placeholder={`Enter ${block.type} text...`}
                                    />
                                ) : block.type === 'image' ? (
                                    <div className="space-y-2">
                                        <Input 
                                            value={block.props?.src} 
                                            onChange={(e) => updateBlockProp(index, 'src', e.target.value)}
                                            placeholder="Image URL"
                                        />
                                        <Input 
                                            value={block.props?.alt} 
                                            onChange={(e) => updateBlockProp(index, 'alt', e.target.value)}
                                            placeholder="Alt text"
                                        />
                                    </div>
                                ) : block.type === 'list' ? (
                                    <Textarea 
                                        value={block.value} 
                                        onChange={(e) => updateBlock(index, 'value', e.target.value)}
                                        placeholder="Comma separated items (e.g. Item 1, Item 2, Item 3)"
                                    />
                                ) : null}
                                
                                {block.type === 'button' && (
                                    <Select 
                                        value={block.props?.variant || "primary"} 
                                        onValueChange={(v) => updateBlockProp(index, 'variant', v)}
                                    >
                                        <SelectTrigger className="h-8 text-xs">
                                            <SelectValue placeholder="Variant" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="primary">Primary</SelectItem>
                                            <SelectItem value="secondary">Secondary</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-4 gap-2 pt-4">
                    {["heading", "paragraph", "image", "list", "button", "quote", "code", "divider", "video", "audio", "table", "metric", "callout", "embed", "json", "formula"].map((type) => (
                        <Button 
                            key={type} 
                            variant="outline" 
                            size="sm" 
                            className="text-xs border-dashed border-white/20 hover:bg-white/5"
                            onClick={() => addBlock(type as any)}
                        >
                            <Plus className="w-3 h-3 mr-1" /> {type}
                        </Button>
                    ))}
                </div>
              </section>
            </div>
          </ScrollArea>
        </ResizablePanel>
        
        <ResizableHandle withHandle className="bg-white/10" />
        
        {/* Preview Panel */}
        <ResizablePanel defaultSize={60} className="bg-black/20 relative">
           <div className="absolute top-4 right-4 z-20 flex gap-2 bg-black/50 backdrop-blur-md p-1 rounded-lg border border-white/10">
              <Button 
                  size="sm" 
                  variant={activeTab === 'preview' ? 'secondary' : 'ghost'} 
                  onClick={() => setActiveTab('preview')}
                  className="text-xs h-7"
              >
                  <Eye className="w-3 h-3 mr-1" /> Preview
              </Button>
              <Button 
                  size="sm" 
                  variant={activeTab === 'json' ? 'secondary' : 'ghost'} 
                  onClick={() => setActiveTab('json')}
                  className="text-xs h-7"
              >
                  <Code className="w-3 h-3 mr-1" /> JSON
              </Button>
           </div>

           <div className="h-full w-full overflow-auto bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-opacity-20">
              {activeTab === 'preview' ? (
                  <div className="p-8 min-h-full flex flex-col">
                      <WebXRenderer blueprint={blueprint} />
                  </div>
              ) : (
                  <div className="p-8">
                      <pre className="text-xs font-mono bg-black/80 p-6 rounded-xl border border-white/10 text-green-400 overflow-auto">
                          {JSON.stringify(blueprint, null, 2)}
                      </pre>
                  </div>
              )}
           </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function Separator({ className }: { className?: string }) {
    return <div className={`h-[1px] w-full ${className}`} />
}
