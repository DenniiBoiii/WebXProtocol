import { useState } from "react";
import { useLocation } from "wouter";
import { WebXBlueprint, ContentBlock, encodeWebX } from "@/lib/webx";
import { WebXRenderer } from "@/components/webx/Renderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Eye, Code, Save, ArrowLeft, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const updateMeta = (key: string, value: string) => {
    setBlueprint(prev => ({
        ...prev,
        meta: { ...prev.meta, [key]: value }
    }));
  };

  const addBlock = (type: ContentBlock["type"]) => {
    const newBlock: ContentBlock = { type, value: "", props: {} };
    if (type === "image") {
        newBlock.props = { src: "https://placehold.co/600x400", alt: "Placeholder" };
        newBlock.value = "https://placehold.co/600x400"; // fallback
    }
    setBlueprint(prev => ({
      ...prev,
      data: [...prev.data, newBlock]
    }));
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
      const payload = encodeWebX(blueprint);
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
           <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
             <DialogTrigger asChild>
               <Button size="sm" onClick={handleGenerate} className="bg-primary hover:bg-primary/90 text-white">
                 <Save className="w-4 h-4 mr-2" /> Generate Link
               </Button>
             </DialogTrigger>
             <DialogContent className="sm:max-w-md border-white/10 bg-background/95 backdrop-blur-xl">
               <DialogHeader>
                 <DialogTitle>Your WebX Link is Ready</DialogTitle>
                 <DialogDescription>
                   Share this link to let anyone view your page instantly without servers.
                 </DialogDescription>
               </DialogHeader>
               <div className="flex items-center space-x-2 mt-4">
                 <div className="grid flex-1 gap-2">
                   <Label htmlFor="link" className="sr-only">
                     Link
                   </Label>
                   <Input
                     id="link"
                     readOnly
                     value={generatedLink}
                     className="bg-white/5 border-white/10 font-mono text-xs h-9"
                   />
                 </div>
                 <Button type="submit" size="sm" className="px-3" onClick={handleCopy}>
                   {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                   <span className="sr-only">Copy</span>
                 </Button>
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
                  
                  {/* AI Settings */}
                  <div className="space-y-2 border border-white/10 p-4 rounded-lg bg-white/5">
                      <Label className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]" />
                          AI Content Generation
                      </Label>
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
                      <p className="text-xs text-muted-foreground">If set, the renderer will attempt to generate content.</p>
                  </div>
                </div>
              </section>

              <Separator className="bg-white/10" />

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

                <div className="grid grid-cols-3 gap-2 pt-4">
                    {["heading", "paragraph", "image", "list", "button", "quote", "code", "divider"].map((type) => (
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
