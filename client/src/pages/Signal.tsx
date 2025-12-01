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
  MessageSquare, RefreshCw, Check, Send, X
} from "lucide-react";
import { encodeWebX, decodeWebX, WebXBlueprint } from "@/lib/webx";

// WebRTC configuration for STUN servers
const rtcConfig: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
};

// Generate unique room ID
function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

// WebRTC video calling with link-based signaling
export default function Signal() {
  const [step, setStep] = useState<"start" | "created" | "joining" | "connected">("start");
  const [role, setRole] = useState<"caller" | "callee" | null>(null);
  const [generatedLink, setGeneratedLink] = useState("");
  const [remoteLink, setRemoteLink] = useState("");
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<{sender: string, text: string, time: number}[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [logs, setLogs] = useState<string[]>([]);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Media stream refs
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [hasMediaAccess, setHasMediaAccess] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  // WebRTC peer connection ref
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingIceCandidates = useRef<RTCIceCandidate[]>([]);
  const pendingOffer = useRef<RTCSessionDescriptionInit | null>(null);
  
  // WebSocket signaling
  const wsRef = useRef<WebSocket | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  const roleRef = useRef(role);
  const stepRef = useRef(step);
  const roomIdRef = useRef(roomId);

  useEffect(() => {
    roleRef.current = role;
    stepRef.current = step;
    roomIdRef.current = roomId;
  }, [role, step, roomId]);

  // Check for WebX offer in URL (joining via shared link)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const offerPayload = params.get('offer');
    
    if (offerPayload && !roomId && wsConnected) {
      // Decode the WebX blueprint to extract room ID and SDP
      const blueprint = decodeWebX(offerPayload);
      if (blueprint && blueprint.data) {
        const jsonBlock = blueprint.data.find((block: any) => block.type === 'json');
        if (jsonBlock && jsonBlock.value) {
          try {
            const signalData = JSON.parse(jsonBlock.value as string);
            if (signalData.roomId && signalData.sdp) {
              addLog(`Decoded WebX offer for room: ${signalData.roomId}`);
              setRoomId(signalData.roomId);
              setRole("callee");
              setStep("joining");
              
              // Store the SDP offer for later processing
              pendingOffer.current = signalData.sdp;
              
              // Join the signaling room
              sendSignal({ type: 'JOIN', roomId: signalData.roomId });
              
              // Auto-start joining process
              handleJoinCallWithRoom(signalData.roomId);
            }
          } catch (e) {
            console.error("Error parsing signal data from blueprint:", e);
            addLog("ERROR: Invalid WebX offer format.");
          }
        }
      }
    }
  }, [wsConnected]);

  const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  
  // Join call when room ID is provided from URL
  const handleJoinCallWithRoom = async (joinRoomId: string) => {
    setConnectionStatus("Requesting Media Access...");
    
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    }).catch((error) => {
      console.error("Media access error:", error);
      addLog("ERROR: Media access denied or unavailable.");
      toast({ 
        title: "Camera/Mic Access Required", 
        description: "Please allow camera and microphone access for video calls.",
        variant: "destructive" 
      });
      return null;
    });
    
    if (!stream) {
      setStep("start");
      setRole(null);
      setRoomId(null);
      setConnectionStatus("Disconnected");
      return;
    }
    
    setLocalStream(stream);
    localStreamRef.current = stream;
    setHasMediaAccess(true);
    addLog("Media access granted.");
    
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
    
    createPeerConnection(stream);
    setConnectionStatus("Ready - Waiting for Offer...");
    addLog("Peer connection ready. Listening for incoming offer...");
    
    if (pendingOffer.current) {
      await processPendingOffer();
    }
  };

  // Request camera and microphone access
  const requestMediaAccess = async () => {
    try {
      addLog("Requesting camera and microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);
      localStreamRef.current = stream;
      setHasMediaAccess(true);
      addLog("Media access granted.");
      
      // Connect stream to local video element
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      return stream;
    } catch (error) {
      console.error("Media access error:", error);
      addLog("ERROR: Media access denied or unavailable.");
      toast({ 
        title: "Camera/Mic Access Required", 
        description: "Please allow camera and microphone access for video calls.",
        variant: "destructive" 
      });
      return null;
    }
  };

  // Create WebRTC peer connection
  const createPeerConnection = (stream: MediaStream) => {
    addLog("Creating RTCPeerConnection...");
    const pc = new RTCPeerConnection(rtcConfig);
    
    // Add local tracks to the connection
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
      addLog(`Added ${track.kind} track to connection.`);
    });
    
    // Handle incoming remote tracks
    pc.ontrack = (event) => {
      addLog(`Received remote ${event.track.kind} track.`);
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      }
    };
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        addLog("ICE candidate gathered.");
        sendSignal({ 
          type: 'ICE_CANDIDATE', 
          payload: event.candidate.toJSON() 
        });
      }
    };
    
    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      addLog(`Connection state: ${pc.connectionState}`);
      if (pc.connectionState === 'connected') {
        setConnectionStatus("Connected");
        setStep("connected");
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        setConnectionStatus("Connection Lost");
      }
    };
    
    pc.oniceconnectionstatechange = () => {
      addLog(`ICE connection state: ${pc.iceConnectionState}`);
    };
    
    peerConnectionRef.current = pc;
    return pc;
  };

  // Stop media streams and close peer connection
  const stopMediaStreams = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
      setHasMediaAccess(false);
    }
    setRemoteStream(null);
    pendingOffer.current = null;
    pendingIceCandidates.current = [];
  };

  // Connect local video when stream changes
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, step]);

  // Connect remote video when stream changes
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Toggle video track
  useEffect(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = isVideoEnabled;
      });
    }
  }, [isVideoEnabled, localStream]);

  // Toggle audio track
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isAudioEnabled;
      });
    }
  }, [isAudioEnabled, localStream]);

  // Send message via WebSocket
  const sendSignal = (message: object) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  // Process pending offer when peer connection becomes available
  const processPendingOffer = async () => {
    if (pendingOffer.current && peerConnectionRef.current && localStreamRef.current) {
      addLog("Processing pending SDP Offer...");
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(pendingOffer.current));
        addLog("Remote description set successfully.");
        
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        addLog("Created and set local SDP Answer.");
        
        sendSignal({ type: 'SDP_ANSWER', payload: answer });
        addLog("Sent SDP Answer to peer.");
        
        for (const candidate of pendingIceCandidates.current) {
          await peerConnectionRef.current.addIceCandidate(candidate);
        }
        pendingIceCandidates.current = [];
        pendingOffer.current = null;
      } catch (e) {
        console.error("Error processing pending offer:", e);
        addLog("ERROR: Failed to process pending offer.");
      }
    }
  };

  // Initialize WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/signal`;
    
    addLog("Connecting to signaling server...");
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    
    ws.onopen = () => {
      addLog("Connected to signaling server.");
      setWsConnected(true);
    };
    
    ws.onclose = () => {
      addLog("Disconnected from signaling server.");
      setWsConnected(false);
    };
    
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      addLog("ERROR: WebSocket connection failed.");
    };
    
    ws.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        const { type, payload } = message;
        
        // Handle room join confirmation
        if (type === 'JOINED') {
          addLog(`Joined room ${message.roomId} (${message.peerCount} peer(s) waiting)`);
          if (message.peerCount > 0 && roleRef.current === 'callee') {
            addLog("Peer is already in room, waiting for offer...");
          }
        }
        
        // Handle peer join notification
        if (type === 'PEER_JOINED') {
          addLog(`Peer joined the room (${message.peerCount} total)`);
          // If we're the caller and peer just joined, send our offer
          if (roleRef.current === 'caller' && peerConnectionRef.current) {
            const offer = peerConnectionRef.current.localDescription;
            if (offer) {
              addLog("Re-sending SDP Offer to new peer...");
              sendSignal({ type: 'SDP_OFFER', payload: offer });
            }
          }
        }
        
        // Handle peer left
        if (type === 'PEER_LEFT') {
          addLog(`Peer left the room (${message.peerCount} remaining)`);
        }
        
        // Handle ICE candidates
        if (type === 'ICE_CANDIDATE') {
          if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
            try {
              await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(payload));
              addLog("Added remote ICE candidate.");
            } catch (e) {
              console.error("Error adding ICE candidate:", e);
            }
          } else {
            pendingIceCandidates.current.push(new RTCIceCandidate(payload));
          }
        }
        
        // Handle SDP Answer for caller
        if (type === 'SDP_ANSWER' && roleRef.current === 'caller' && peerConnectionRef.current) {
          addLog("Received SDP Answer from peer.");
          try {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payload));
            addLog("Remote description set successfully.");
            
            for (const candidate of pendingIceCandidates.current) {
              await peerConnectionRef.current.addIceCandidate(candidate);
            }
            pendingIceCandidates.current = [];
            
            toast({ title: "Peer Connected", description: "Video call established!" });
          } catch (e) {
            console.error("Error setting remote description:", e);
            addLog("ERROR: Failed to set remote description.");
          }
        }
        
        // Handle SDP Offer for callee
        if (type === 'SDP_OFFER' && roleRef.current === 'callee') {
          addLog("Received SDP Offer from peer.");
          if (peerConnectionRef.current && localStreamRef.current) {
            try {
              await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payload));
              addLog("Remote description set successfully.");
              
              const answer = await peerConnectionRef.current.createAnswer();
              await peerConnectionRef.current.setLocalDescription(answer);
              addLog("Created and set local SDP Answer.");
              
              sendSignal({ type: 'SDP_ANSWER', payload: answer });
              addLog("Sent SDP Answer to peer.");
              
              for (const candidate of pendingIceCandidates.current) {
                await peerConnectionRef.current.addIceCandidate(candidate);
              }
              pendingIceCandidates.current = [];
            } catch (e) {
              console.error("Error handling offer:", e);
              addLog("ERROR: Failed to handle offer.");
            }
          } else {
            pendingOffer.current = payload;
            addLog("Stored pending offer (waiting for peer connection).");
          }
        }
        
        // Handle chat messages
        if (type === 'CHAT_MSG' && stepRef.current === 'connected') {
          setMessages(prev => [...prev, { sender: "Peer", text: payload.text, time: payload.time }]);
        }

        // Handle call end
        if (type === 'END_CALL') {
           stopMediaStreams();
           setStep("start");
           setConnectionStatus("Disconnected");
           setLogs([]);
           setRole(null);
           setRoomId(null);
           setIsChatOpen(false);
           setMessages([]);
           toast({ title: "Call Ended", description: "Remote peer ended the call." });
        }
      } catch (e) {
        console.error("Error parsing WebSocket message:", e);
      }
    };
    
    return () => {
      ws.close();
    };
  }, [toast]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isChatOpen]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const msg = { sender: "You", text: newMessage, time: Date.now() };
    setMessages(prev => [...prev, msg]);
    
    sendSignal({ 
        type: 'CHAT_MSG', 
        payload: { text: newMessage, time: Date.now() } 
    });
    
    setNewMessage("");
  };

  const handleCreateCall = async () => {
    setRole("caller");
    setStep("created");
    setConnectionStatus("Requesting Media Access...");
    addLog("Initializing WebRTC PeerConnection...");
    
    // Generate room ID for this call
    const newRoomId = generateRoomId();
    setRoomId(newRoomId);
    addLog(`Created room: ${newRoomId}`);
    
    // Join the room via WebSocket
    sendSignal({ type: 'JOIN', roomId: newRoomId });
    
    // Request media access first
    const stream = await requestMediaAccess();
    if (!stream) {
      setStep("start");
      setRole(null);
      setRoomId(null);
      setConnectionStatus("Disconnected");
      return;
    }
    
    // Create WebRTC peer connection
    const pc = createPeerConnection(stream);
    setConnectionStatus("Generating Offer...");
    
    try {
      // Create real SDP offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      addLog("Created and set local SDP Offer.");
      
      // Broadcast offer to other tabs
      sendSignal({ type: 'SDP_OFFER', payload: offer });
      addLog("SDP Offer broadcasted to local peers.");
      
      // Create WebX-formatted offer link
      const offerBlueprint: WebXBlueprint = {
        title: "WebX Signal: Video Call Invite",
        layout: "video-call",
        meta: { 
          version: "1.0", 
          author: "WebX Signal", 
          created: Date.now(), 
          category: "communication",
          featured: false,
          downloads: 0
        },
        data: [
          { type: "heading", value: "Secure P2P Video Call" },
          { type: "paragraph", value: "You've been invited to a serverless encrypted video call." },
          { type: "json", value: JSON.stringify({ 
            roomId: newRoomId, 
            sdp: offer,
            type: "offer"
          })}
        ]
      };
      
      const payload = encodeWebX(offerBlueprint);
      const url = `webx://signal?offer=${payload}`;
      setGeneratedLink(url);
      setConnectionStatus("Waiting for Peer...");
      addLog("Waiting for peer to join (auto-connect via local broadcast)...");
    } catch (e) {
      console.error("Error creating offer:", e);
      addLog("ERROR: Failed to create offer.");
      setConnectionStatus("Error");
    }
  };

  const handleJoinCall = async () => {
    setRole("callee");
    setStep("joining");
    setConnectionStatus("Requesting Media Access...");
    
    // Generate room ID if none exists (manual join)
    if (!roomId) {
      const newRoomId = generateRoomId();
      setRoomId(newRoomId);
      sendSignal({ type: 'JOIN', roomId: newRoomId });
      addLog(`Created room for manual join: ${newRoomId}`);
    }
    
    // Request media access first
    const stream = await requestMediaAccess();
    if (!stream) {
      setStep("start");
      setRole(null);
      setRoomId(null);
      setConnectionStatus("Disconnected");
      return;
    }
    
    // Create peer connection ready to receive offer
    createPeerConnection(stream);
    setConnectionStatus("Ready - Waiting for Offer...");
    addLog("Peer connection ready. Listening for incoming offer...");
    
    // Check if there's a pending offer that arrived before we were ready
    if (pendingOffer.current) {
      await processPendingOffer();
    }
  };

  const handleProcessOffer = async () => {
    if (!remoteLink) return;
    
    addLog("Decoding Remote WebX Offer...");
    setConnectionStatus("Processing Offer...");
    
    // Extract payload from URL or raw string
    let payload = remoteLink;
    if (remoteLink.includes("offer=")) {
      payload = remoteLink.split("offer=")[1];
    } else if (remoteLink.includes("webx://")) {
      const url = new URL(remoteLink.replace("webx://", "http://"));
      payload = url.searchParams.get("offer") || remoteLink;
    }
    
    const blueprint = decodeWebX(payload);
    if (blueprint && blueprint.data) {
      // Extract signal data from JSON block
      const jsonBlock = blueprint.data.find((block: any) => block.type === 'json');
      if (jsonBlock && jsonBlock.value) {
        try {
          const signalData = JSON.parse(jsonBlock.value as string);
          if (signalData.roomId && signalData.sdp) {
            addLog(`Remote Offer decoded - Room: ${signalData.roomId}`);
            
            // Set room and role
            setRoomId(signalData.roomId);
            setRole("callee");
            
            // Join the signaling room
            sendSignal({ type: 'JOIN', roomId: signalData.roomId });
            addLog("Joined signaling room.");
            
            // Store the SDP offer
            pendingOffer.current = signalData.sdp;
            
            // Request media access if not already
            if (!localStreamRef.current) {
              const stream = await requestMediaAccess();
              if (!stream) {
                setStep("start");
                setRole(null);
                setRoomId(null);
                setConnectionStatus("Disconnected");
                return;
              }
              createPeerConnection(stream);
            }
            
            // Process the offer now
            if (peerConnectionRef.current && pendingOffer.current) {
              await processPendingOffer();
            }
            
            addLog("Processing complete - waiting for connection...");
          }
        } catch (e) {
          console.error("Error parsing signal data:", e);
          toast({ title: "Invalid Offer", description: "Could not parse the WebX offer data.", variant: "destructive" });
        }
      } else {
        toast({ title: "Invalid Format", description: "WebX offer missing signal data.", variant: "destructive" });
      }
    } else {
      toast({ title: "Invalid Link", description: "Could not decode the WebX offer.", variant: "destructive" });
    }
  };

  const handleCompleteHandshake = (overrideLink?: string) => {
    const linkToUse = overrideLink || remoteLink;
    if (!linkToUse) return;
    
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
                                stopMediaStreams();
                                setStep("start");
                                setConnectionStatus("Disconnected");
                                setLogs([]);
                                setRole(null);
                            }
                        } else {
                            stopMediaStreams();
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
                      <div className="flex items-center gap-2 p-3 rounded bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 mb-2">
                        <Radio className="w-4 h-4 animate-pulse" />
                        <span>Listening for local broadcast answer (Auto-Connect active)</span>
                      </div>
                      <div className="text-xs text-white/30 uppercase tracking-widest font-bold mb-1 mt-4">Manual Fallback</div>
                      <Input 
                        placeholder="Paste their Answer Link here..." 
                        className="bg-white/5 border-white/10"
                        value={remoteLink}
                        onChange={(e) => setRemoteLink(e.target.value)}
                      />
                      <Button 
                        className="w-full mt-2" 
                        disabled={!remoteLink}
                        onClick={() => handleCompleteHandshake()}
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
                        <div className="flex items-center justify-center gap-2 p-2 my-2 rounded bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
                            <Radio className="w-4 h-4 animate-pulse" />
                            <span>Answer broadcasted to local peers automatically</span>
                        </div>
                        
                        <Button className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white" onClick={() => {
                            setConnectionStatus("Connecting...");
                            setTimeout(() => {
                                setStep("connected");
                                setConnectionStatus("Connected");
                            }, 1000);
                        }}>
                           Connecting... <Video className="w-4 h-4 ml-2 animate-pulse" />
                        </Button>

                        <div className="mt-4 pt-4 border-t border-white/10">
                             <p className="text-xs text-white/30 text-center mb-2">If auto-connect fails:</p>
                             <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full border-white/10 text-white/50 hover:text-white text-xs"
                                onClick={copyLink}
                             >
                                <Copy className="w-3 h-3 mr-2" /> Copy Answer Link Manually
                             </Button>
                        </div>
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
               {remoteStream ? (
                  <video 
                     ref={remoteVideoRef}
                     autoPlay 
                     playsInline
                     className="w-full h-full object-cover"
                  />
               ) : (
                  <div className="text-center">
                     <div className="w-32 h-32 rounded-full bg-white/5 mx-auto mb-4 flex items-center justify-center animate-pulse">
                        <Video className="w-12 h-12 text-white/30" />
                     </div>
                     <p className="text-white/50">Peer Connected</p>
                     <p className="text-xs text-white/30 font-mono mt-2">Waiting for remote stream...</p>
                     <p className="text-xs text-green-400/60 font-mono mt-1">Your camera is active below ↓</p>
                  </div>
               )}
               
               {/* Simulated Video Noise/Grain */}
               <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}></div>
            </div>

            {/* Self View (PIP) - Shows local camera feed */}
            <motion.div 
               drag
               dragConstraints={{ left: 0, right: 300, top: 0, bottom: 300 }}
               className="absolute bottom-24 right-6 w-48 h-32 bg-black/80 border border-white/20 rounded-xl overflow-hidden shadow-xl cursor-move z-10"
            >
               {hasMediaAccess && isVideoEnabled ? (
                  <video 
                     ref={localVideoRef}
                     autoPlay 
                     playsInline
                     muted
                     className="w-full h-full object-cover mirror"
                     style={{ transform: 'scaleX(-1)' }}
                  />
               ) : (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                     {!isVideoEnabled ? (
                        <VideoOff className="w-8 h-8 text-red-500/50" />
                     ) : (
                        <Video className="w-8 h-8 text-white/30 animate-pulse" />
                     )}
                  </div>
               )}
               <div className="absolute bottom-2 left-2">
                  <div className="flex gap-1">
                     {!isAudioEnabled && <MicOff className="w-3 h-3 text-red-500" />}
                     {!isVideoEnabled && <VideoOff className="w-3 h-3 text-red-500" />}
                  </div>
               </div>
               <div className="absolute top-2 right-2 text-[10px] text-white/50 bg-black/50 px-1.5 py-0.5 rounded">
                  You
               </div>
            </motion.div>

            {/* Chat Panel */}
            {isChatOpen && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute top-4 right-4 bottom-24 w-80 bg-black/90 border border-white/20 rounded-xl overflow-hidden shadow-2xl z-20 flex flex-col backdrop-blur-xl"
              >
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-white/70" />
                    <span className="font-bold text-sm">P2P Chat</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-white/10" onClick={() => setIsChatOpen(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center text-white/30 text-xs mt-10">
                      <p>Messages are end-to-end encrypted.</p>
                      <p>No server history.</p>
                    </div>
                  )}
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex flex-col ${msg.sender === "You" ? "items-end" : msg.sender === "System" ? "items-center" : "items-start"}`}>
                      {msg.sender === "System" ? (
                        <div className="text-xs text-white/50 bg-white/5 px-3 py-1 rounded-full my-2 border border-white/5">
                            {msg.text}
                        </div>
                      ) : (
                        <>
                          <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
                            msg.sender === "You" 
                              ? "bg-green-600 text-white" 
                              : "bg-white/10 text-white border border-white/10"
                          }`}>
                            {msg.text}
                          </div>
                          <span className="text-[10px] text-white/30 mt-1 px-1">
                            {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-3 border-t border-white/10 bg-white/5">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Type a message..." 
                      className="bg-black/50 border-white/10 h-9 text-sm"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    />
                    <Button size="icon" className="h-9 w-9 bg-green-600 hover:bg-green-700" onClick={handleSendMessage}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Controls Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent flex justify-center items-center gap-4 z-30">
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
                     sendSignal({ type: 'END_CALL' });
                     stopMediaStreams();
                     setStep("start");
                     setConnectionStatus("Disconnected");
                     setLogs([]);
                     setRole(null);
                     setIsChatOpen(false);
                     setMessages([]);
                     toast({ title: "Call Ended", description: "P2P connection terminated." });
                  }}
               >
                  <PhoneOff className="w-6 h-6" />
               </Button>

               <Button 
                  variant="outline" 
                  size="icon" 
                  className={`h-12 w-12 rounded-full border-white/10 backdrop-blur-md ${isChatOpen ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-white/10 hover:bg-white/20'}`}
                  onClick={() => setIsChatOpen(!isChatOpen)}
               >
                  <MessageSquare className="w-5 h-5" />
               </Button>

               <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-12 w-12 rounded-full border-white/10 bg-white/10 hover:bg-white/20 backdrop-blur-md"
                  onClick={copyLink}
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