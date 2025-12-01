import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Video, Mic, MicOff, VideoOff, PhoneOff, Copy, 
  ArrowRight, Radio, ShieldCheck, Globe, Share2, 
  MessageSquare, RefreshCw, Check
} from "lucide-react";
import { encodeWebX, decodeWebX, WebXBlueprint } from "@/lib/webx";

// Mock WebRTC for the prototype to demonstrate the signaling flow via links
// In a real implementation, this would use actual RTCPeerConnection
export default function Signal() {
  const [step, setStep] = useState<"start" | "created" | "joining" | "connected">("start");
  const [role, setRole] = useState<"caller" | "callee" | null>(null);
  const [generatedLink, setGeneratedLink] = useState("");
  const [remoteLink, setRemoteLink] = useState("");
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [logs, setLogs] = useState<string[]>([]);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const handleCreateCall = () => {
    setRole("caller");
    setStep("created");
    setConnectionStatus("Generating Offer...");
    addLog("Initializing WebRTC PeerConnection...");
    addLog("Creating Data Channel 'webx-signal'...");
    
    // Simulate SDP generation
    setTimeout(() => {
      addLog("Generated Local SDP Offer.");
      addLog("Gathering ICE Candidates...");
      
      const offerBlueprint: WebXBlueprint = {
        title: "Incoming Secure Video Call",
        layout: "video-call",
        meta: { 
          version: "1.0", 
          author: "WebX Signal", 
          created: Date.now(), 
          category: "utility",
          featured: false,
          downloads: 0
        },
        data: [
          { type: "heading", value: "Secure Video Call Request" },
          { type: "paragraph", value: "Someone is inviting you to a P2P encrypted video call." },
          { type: "code", value: "SDP_OFFER_v=0_o=-_463748_2_IN_IP4_127.0.0.1..." } // Mock SDP
        ]
      };
      
      const payload = encodeWebX(offerBlueprint);
      const url = `${window.location.origin}/signal?offer=${payload}`;
      setGeneratedLink(url);
      setConnectionStatus("Waiting for Answer...");
      addLog("Offer encoded into WebX Link. Ready to share.");
    }, 1500);
  };

  const handleJoinCall = () => {
    setRole("callee");
    setStep("joining");
  };

  const handleProcessOffer = () => {
    if (!remoteLink) return;
    
    addLog("Decoding Remote Offer...");
    setConnectionStatus("Processing Offer...");
    
    // Extract payload from URL or raw string
    let payload = remoteLink;
    if (remoteLink.includes("offer=")) {
      payload = remoteLink.split("offer=")[1];
    }
    
    const blueprint = decodeWebX(payload);
    if (blueprint) {
      addLog("Remote Offer Accepted.");
      addLog("Generating Local SDP Answer...");
      
      setTimeout(() => {
        const answerBlueprint: WebXBlueprint = {
          title: "Call Accepted",
          layout: "video-call",
          meta: { 
            version: "1.0", 
            author: "WebX Signal", 
            created: Date.now(),
            category: "utility"
          },
          data: [
            { type: "heading", value: "Call Accepted" },
            { type: "code", value: "SDP_ANSWER_v=0_o=-_847362_2_IN_IP4..." }
          ]
        };
        
        const answerPayload = encodeWebX(answerBlueprint);
        const url = `${window.location.origin}/signal?answer=${answerPayload}`;
        setGeneratedLink(url);
        setConnectionStatus("Answer Generated");
        addLog("Answer encoded into WebX Link. Send this back to caller.");
      }, 1500);
    } else {
      toast({ title: "Invalid Link", description: "Could not decode the WebX offer.", variant: "destructive" });
    }
  };

  const handleCompleteHandshake = () => {
    if (!remoteLink) return;
    addLog("Receiving Remote Answer...");
    setConnectionStatus("Establishing Connection...");
    
    setTimeout(() => {
      addLog("ICE Connectivity Check Passed.");
      addLog("DTLS Handshake Complete.");
      addLog("P2P Connection Established.");
      setConnectionStatus("Connected");
      setStep("connected");
    }, 1500);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    toast({ title: "Link Copied", description: "Share this with your peer." });
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono selection:bg-green-500 selection:text-black">
      {/* Header */}
      <header className="border-b border-white/10 p-4 flex justify-between items-center bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setLocation("/")}>
          <div className="p-1 rounded bg-white/5 group-hover:bg-white/10 transition-colors">
            <ArrowRight className="w-4 h-4 rotate-180 text-white/70" />
          </div>
          <div className="flex items-center gap-2">
             <Radio className={`w-5 h-5 ${connectionStatus === "Connected" ? "text-green-500 animate-pulse" : "text-white/50"}`} />
             <span className="font-bold tracking-wider">WebX <span className="text-green-500">SIGNAL</span></span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-white/50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden md:inline">End-to-End Encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span className="hidden md:inline">P2P Mesh</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 md:p-12">
        {/* Back Button for Sub-Steps */}
        {(step !== "start") && (
            <div className="mb-6">
                <Button 
                    variant="ghost" 
                    className="text-white/50 hover:text-white p-0 h-auto hover:bg-transparent gap-2"
                    onClick={() => {
                        if (step === "connected") {
                            if (confirm("End call and return to menu?")) {
                                setStep("start");
                                setConnectionStatus("Disconnected");
                                setLogs([]);
                                setRole(null);
                            }
                        } else {
                            setStep("start");
                            setConnectionStatus("Disconnected");
                            setLogs([]);
                            setRole(null);
                        }
                    }}
                >
                    <ArrowRight className="w-4 h-4 rotate-180" /> Back to Menu
                </Button>
            </div>
        )}
        
        {/* Start Screen */}
        {step === "start" && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-12 py-12"
          >
            <div>
              <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tighter">
                Serverless <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">Video</span>
              </h1>
              <p className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
                Establish peer-to-peer video calls using nothing but URL links.
                No accounts. No central servers. The link carries the signal.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <Card className="bg-white/5 border-white/10 hover:border-green-500/50 transition-all cursor-pointer group" onClick={handleCreateCall}>
                <CardContent className="p-8 flex flex-col items-center justify-center h-full">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Video className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Start a Call</h3>
                  <p className="text-sm text-white/50">Generate an Invite Link to send to someone</p>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10 hover:border-blue-500/50 transition-all cursor-pointer group" onClick={handleJoinCall}>
                <CardContent className="p-8 flex flex-col items-center justify-center h-full">
                  <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <ArrowRight className="w-8 h-8 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Join a Call</h3>
                  <p className="text-sm text-white/50">Paste an Invite Link you received</p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Connection Steps */}
        {(step === "created" || step === "joining") && (
          <div className="grid md:grid-cols-2 gap-12">
            {/* Left Column: Instructions & Inputs */}
            <div className="space-y-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-lg">
                  {step === "created" ? "1" : "2"}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {step === "created" ? "Share Invitation" : "Accept Invitation"}
                  </h2>
                  <p className="text-white/50 text-sm">
                    {step === "created" 
                      ? "Send this link to your peer to start the handshake." 
                      : "Paste the link your peer sent you."}
                  </p>
                </div>
              </div>

              {/* Logic for Caller */}
              {role === "caller" && (
                <div className="space-y-6">
                  <Card className="bg-green-500/5 border-green-500/20">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center mb-2">
                        <Label className="text-green-400 text-xs uppercase tracking-widest">Your Offer Link</Label>
                        {generatedLink && <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">Ready</Badge>}
                      </div>
                      
                      {generatedLink ? (
                        <div className="flex gap-2">
                          <Input value={generatedLink} readOnly className="bg-black/50 border-white/10 font-mono text-xs" />
                          <Button size="icon" onClick={copyLink}><Copy className="w-4 h-4" /></Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-white/50 animate-pulse">
                          <RefreshCw className="w-4 h-4 animate-spin" /> Generating cryptographic offer...
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="relative">
                    <div className="absolute left-5 top-0 bottom-0 w-px bg-white/10"></div>
                    <div className="ml-12 space-y-2">
                      <p className="text-sm text-white/70">Waiting for peer to send back an Answer Link...</p>
                      <Input 
                        placeholder="Paste their Answer Link here..." 
                        className="bg-white/5 border-white/10"
                        value={remoteLink}
                        onChange={(e) => setRemoteLink(e.target.value)}
                      />
                      <Button 
                        className="w-full mt-2" 
                        disabled={!remoteLink}
                        onClick={handleCompleteHandshake}
                      >
                        Verify Answer & Connect <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Logic for Callee */}
              {role === "callee" && (
                <div className="space-y-6">
                   <div className="space-y-2">
                      <Label className="text-blue-400 text-xs uppercase tracking-widest">Incoming Offer Link</Label>
                      <Input 
                        placeholder="Paste the Offer Link here..." 
                        className="bg-white/5 border-white/10"
                        value={remoteLink}
                        onChange={(e) => setRemoteLink(e.target.value)}
                      />
                      <Button 
                        className="w-full" 
                        variant="secondary"
                        disabled={!remoteLink}
                        onClick={handleProcessOffer}
                      >
                        Process Offer & Generate Answer
                      </Button>
                   </div>

                   {generatedLink && (
                     <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: "auto" }}
                        className="pt-6 border-t border-white/10"
                     >
                        <div className="flex justify-between items-center mb-2">
                          <Label className="text-green-400 text-xs uppercase tracking-widest">Your Answer Link</Label>
                          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">Generated</Badge>
                        </div>
                        <div className="flex gap-2 mb-4">
                          <Input value={generatedLink} readOnly className="bg-black/50 border-white/10 font-mono text-xs" />
                          <Button size="icon" onClick={copyLink}><Copy className="w-4 h-4" /></Button>
                        </div>
                        <p className="text-sm text-white/60 text-center">
                          Send this link BACK to the caller to connect.
                        </p>
                        <Button className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white" onClick={() => {
                            setConnectionStatus("Connecting...");
                            setTimeout(() => {
                                setStep("connected");
                                setConnectionStatus("Connected");
                            }, 1000);
                        }}>
                           I've Sent It, Join Call <Video className="w-4 h-4 ml-2" />
                        </Button>
                     </motion.div>
                   )}
                </div>
              )}
            </div>

            {/* Right Column: Terminal & Preview */}
            <div className="bg-black/50 border border-white/10 rounded-xl overflow-hidden flex flex-col h-[500px]">
              <div className="bg-white/5 p-3 border-b border-white/10 flex justify-between items-center">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                </div>
                <div className="text-xs font-mono text-white/30">webx-signal-daemon</div>
              </div>
              
              {/* Connection Status */}
              <div className="p-6 border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-4">
                   <span className="text-sm text-white/50">Status</span>
                   <Badge variant={connectionStatus === "Connected" ? "default" : "outline"} className={connectionStatus === "Connected" ? "bg-green-500" : "border-white/20"}>
                      {connectionStatus}
                   </Badge>
                </div>
                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                   <motion.div 
                      className="h-full bg-green-500"
                      initial={{ width: "0%" }}
                      animate={{ width: connectionStatus === "Connected" ? "100%" : role ? "30%" : "0%" }}
                   />
                </div>
              </div>

              {/* Logs */}
              <div className="flex-1 p-4 font-mono text-xs space-y-2 overflow-y-auto text-green-400/80 bg-black">
                {logs.length === 0 && <span className="text-white/20 opacity-50">System ready. Initializing protocol...</span>}
                {logs.map((log, i) => (
                  <div key={i} className="border-l-2 border-green-900 pl-2">{log}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Active Call Interface */}
        {step === "connected" && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative h-[80vh] rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 shadow-2xl"
          >
            {/* Main Video (Remote) */}
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
               <div className="text-center">
                  <div className="w-32 h-32 rounded-full bg-white/5 mx-auto mb-4 flex items-center justify-center animate-pulse">
                     <span className="text-4xl">👤</span>
                  </div>
                  <p className="text-white/50">Peer Connected</p>
                  <p className="text-xs text-white/30 font-mono mt-2">1080p • 60fps • 24ms latency</p>
               </div>
               
               {/* Simulated Video Noise/Grain */}
               <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}></div>
            </div>

            {/* Self View (PIP) */}
            <motion.div 
               drag
               dragConstraints={{ left: 0, right: 300, top: 0, bottom: 300 }}
               className="absolute bottom-24 right-6 w-48 h-32 bg-black/80 border border-white/20 rounded-xl overflow-hidden shadow-xl cursor-move z-10"
            >
               <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                  <span className="text-2xl">😊</span>
               </div>
               <div className="absolute bottom-2 left-2">
                  <div className="flex gap-1">
                     {!isAudioEnabled && <MicOff className="w-3 h-3 text-red-500" />}
                     {!isVideoEnabled && <VideoOff className="w-3 h-3 text-red-500" />}
                  </div>
               </div>
            </motion.div>

            {/* Controls Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent flex justify-center items-center gap-4">
               <Button 
                  variant="outline" 
                  size="icon" 
                  className={`h-12 w-12 rounded-full border-white/10 backdrop-blur-md ${!isAudioEnabled ? 'bg-red-500/20 text-red-500 border-red-500/50' : 'bg-white/10 hover:bg-white/20'}`}
                  onClick={() => setIsAudioEnabled(!isAudioEnabled)}
               >
                  {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
               </Button>
               
               <Button 
                  variant="outline" 
                  size="icon" 
                  className={`h-12 w-12 rounded-full border-white/10 backdrop-blur-md ${!isVideoEnabled ? 'bg-red-500/20 text-red-500 border-red-500/50' : 'bg-white/10 hover:bg-white/20'}`}
                  onClick={() => setIsVideoEnabled(!isVideoEnabled)}
               >
                  {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
               </Button>

               <Button 
                  variant="destructive" 
                  size="icon" 
                  className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700 shadow-lg shadow-red-900/20"
                  onClick={() => {
                     setStep("start");
                     setConnectionStatus("Disconnected");
                     setLogs([]);
                     setRole(null);
                     toast({ title: "Call Ended", description: "P2P connection terminated." });
                  }}
               >
                  <PhoneOff className="w-6 h-6" />
               </Button>

               <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-12 w-12 rounded-full border-white/10 bg-white/10 hover:bg-white/20 backdrop-blur-md"
               >
                  <MessageSquare className="w-5 h-5" />
               </Button>

               <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-12 w-12 rounded-full border-white/10 bg-white/10 hover:bg-white/20 backdrop-blur-md"
               >
                  <Share2 className="w-5 h-5" />
               </Button>
            </div>

            {/* Encryption Badge */}
            <div className="absolute top-6 left-6 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-green-500/30 flex items-center gap-2 text-xs text-green-400">
               <ShieldCheck className="w-3 h-3" />
               <span>E2EE ACTIVE</span>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}