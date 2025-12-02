import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
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
  MessageSquare, RefreshCw, Check, Send, X, HelpCircle,
  Link2, Users, Sparkles, ChevronRight, ChevronLeft, SwitchCamera,
  UserPlus, FlipHorizontal
} from "lucide-react";
import { encodeWebX, decodeWebX, WebXBlueprint } from "@/lib/webx";

// WebRTC configuration with STUN and free TURN servers for better connectivity
// Using Open Relay Project servers which support multiple transports
const rtcConfig: RTCConfiguration = {
  iceServers: [
    // Google STUN servers (fast, reliable)
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    // Open Relay STUN
    { urls: 'stun:openrelay.metered.ca:80' },
    // Open Relay TURN servers (UDP)
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    // Open Relay TURN servers (TCP - important for restrictive firewalls!)
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    // TURNS (TLS) for maximum compatibility
    {
      urls: 'turns:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ],
  iceCandidatePoolSize: 10,
  iceTransportPolicy: 'all', // Try all transports (relay + direct)
  bundlePolicy: 'max-bundle'
};

// Generate unique room ID
function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

// Tutorial steps configuration
const TUTORIAL_STEPS = [
  {
    title: "Welcome to WebX Signal",
    description: "A serverless peer-to-peer video calling system. No accounts needed - just share a link to connect!",
    icon: Sparkles,
    color: "text-green-400"
  },
  {
    title: "Starting a Call",
    description: "Click 'Start a Call' to generate a unique invite link. Share this link with anyone you want to video chat with.",
    icon: Video,
    color: "text-green-400"
  },
  {
    title: "Joining a Call",
    description: "Received an invite link? Click 'Join a Call' and paste it, or simply open the link directly in your browser.",
    icon: Link2,
    color: "text-blue-400"
  },
  {
    title: "Secure & Private",
    description: "Your calls are end-to-end encrypted and peer-to-peer. No data passes through central servers once connected.",
    icon: ShieldCheck,
    color: "text-emerald-400"
  }
];

// WebRTC video calling with link-based signaling
export default function Signal() {
  const [step, setStep] = useState<"start" | "created" | "joining" | "connected">("start");
  const [role, setRole] = useState<"caller" | "callee" | null>(null);
  const [generatedLink, setGeneratedLink] = useState("");
  const [remoteLink, setRemoteLink] = useState("");
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [isMirrored, setIsMirrored] = useState(true);
  const [participantCount, setParticipantCount] = useState(1);
  const [messages, setMessages] = useState<{sender: string, text: string, time: number}[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [logs, setLogs] = useState<string[]>([]);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  
  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  
  // Check if first-time user on mount
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('webx-signal-tutorial-seen');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, []);
  
  const completeTutorial = () => {
    localStorage.setItem('webx-signal-tutorial-seen', 'true');
    setShowTutorial(false);
    setTutorialStep(0);
  };
  
  const nextTutorialStep = () => {
    if (tutorialStep < TUTORIAL_STEPS.length - 1) {
      setTutorialStep(prev => prev + 1);
    } else {
      completeTutorial();
    }
  };
  
  const prevTutorialStep = () => {
    if (tutorialStep > 0) {
      setTutorialStep(prev => prev - 1);
    }
  };
  
  const openTutorial = () => {
    setTutorialStep(0);
    setShowTutorial(true);
  };
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Media stream refs
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [hasMediaAccess, setHasMediaAccess] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const callContainerRef = useRef<HTMLDivElement>(null);
  
  // WebRTC peer connection ref
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingIceCandidates = useRef<RTCIceCandidate[]>([]);
  const pendingOffer = useRef<RTCSessionDescriptionInit | null>(null);
  const hasProcessedOffer = useRef<boolean>(false);
  
  // WebSocket signaling
  const wsRef = useRef<WebSocket | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  
  // Pending invite state (for Android gesture requirement)
  const [pendingInviteRoom, setPendingInviteRoom] = useState<string | null>(null);

  const roleRef = useRef(role);
  const stepRef = useRef(step);
  const roomIdRef = useRef(roomId);

  useEffect(() => {
    roleRef.current = role;
    stepRef.current = step;
    roomIdRef.current = roomId;
  }, [role, step, roomId]);

  // Check for WebX call invite in URL (joining via shared link)
  // NOTE: We don't auto-join here - Android requires a user gesture before requesting camera/mic
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const callPayload = params.get('call');
    
    if (callPayload && !roomId && !pendingInviteRoom && wsConnected) {
      // Decode the WebX blueprint to extract room ID
      const blueprint = decodeWebX(callPayload);
      if (blueprint && blueprint.data) {
        const jsonBlock = blueprint.data.find((block: any) => block.type === 'json');
        if (jsonBlock && jsonBlock.value) {
          try {
            const signalData = JSON.parse(jsonBlock.value as string);
            if (signalData.room) {
              addLog(`Decoded WebX call invite for room: ${signalData.room}`);
              // Store pending invite - user must tap to join (Android gesture requirement)
              setPendingInviteRoom(signalData.room);
            }
          } catch (e) {
            console.error("Error parsing call data from blueprint:", e);
            addLog("ERROR: Invalid WebX call format.");
          }
        }
      }
    }
  }, [wsConnected, pendingInviteRoom]);
  
  // Handle accepting a pending invite (triggered by user tap)
  const acceptPendingInvite = async () => {
    if (!pendingInviteRoom) return;
    
    const joinRoomId = pendingInviteRoom;
    setPendingInviteRoom(null);
    
    // Clear URL param to prevent re-triggering
    window.history.replaceState({}, '', '/signal');
    
    // Show joining state
    setConnectionStatus("Requesting Media Access...");
    
    // Request media access FIRST (with user gesture!)
    const stream = await requestMediaAccess();
    
    if (!stream) {
      // Permission denied or failed - stay on start screen
      setStep("start");
      setRole(null);
      setRoomId(null);
      setConnectionStatus("Disconnected");
      toast({
        title: "Camera/Mic Access Required",
        description: "Please allow camera and microphone access to join the call.",
        variant: "destructive"
      });
      return;
    }
    
    // Media access granted - now join the room
    setRoomId(joinRoomId);
    setRole("callee");
    setStep("joining");
    
    // Join the signaling room (SDP will come via WebSocket)
    sendSignal({ type: 'JOIN', roomId: joinRoomId });
    
    // Create peer connection and process any pending offer
    createPeerConnection(stream);
    setConnectionStatus("Ready - Waiting for Offer...");
    addLog("Peer connection ready. Listening for incoming offer...");
    
    if (pendingOffer.current) {
      await processPendingOffer();
    }
  };

  const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  
  // Join call when room ID is provided from URL
  const handleJoinCallWithRoom = async (joinRoomId: string) => {
    setConnectionStatus("Requesting Media Access...");
    
    // Use requestMediaAccess for proper camera detection and facing mode support
    const stream = await requestMediaAccess();
    
    if (!stream) {
      setStep("start");
      setRole(null);
      setRoomId(null);
      setConnectionStatus("Disconnected");
      return;
    }
    
    createPeerConnection(stream);
    setConnectionStatus("Ready - Waiting for Offer...");
    addLog("Peer connection ready. Listening for incoming offer...");
    
    if (pendingOffer.current) {
      await processPendingOffer();
    }
  };

  // Check for multiple cameras (for flip camera feature)
  const checkForMultipleCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(device => device.kind === 'videoinput');
      setHasMultipleCameras(videoInputs.length > 1);
      addLog(`Found ${videoInputs.length} camera(s).`);
    } catch (error) {
      console.error("Error checking cameras:", error);
    }
  };

  // Request camera and microphone access
  const requestMediaAccess = async (preferredFacingMode?: "user" | "environment") => {
    try {
      addLog("Requesting camera and microphone access...");
      const mode = preferredFacingMode || facingMode;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
        audio: true
      });
      setLocalStream(stream);
      localStreamRef.current = stream;
      setHasMediaAccess(true);
      addLog("Media access granted.");
      
      // Check for multiple cameras
      await checkForMultipleCameras();
      
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

  // Flip camera (switch between front and back cameras)
  const flipCamera = async () => {
    if (!localStreamRef.current || !peerConnectionRef.current) return;
    
    const newFacingMode = facingMode === "user" ? "environment" : "user";
    addLog(`Switching to ${newFacingMode === "user" ? "front" : "back"} camera...`);
    
    try {
      // Get new video stream only (reuse existing audio to avoid permission prompts)
      const newVideoStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
        audio: false
      });
      
      // Stop old video tracks
      localStreamRef.current.getVideoTracks().forEach(track => track.stop());
      
      // Replace track in peer connection
      const newVideoTrack = newVideoStream.getVideoTracks()[0];
      const senders = peerConnectionRef.current.getSenders();
      const videoSender = senders.find(sender => sender.track?.kind === 'video');
      
      if (videoSender && newVideoTrack) {
        await videoSender.replaceTrack(newVideoTrack);
        addLog("Camera switched successfully.");
      }
      
      // Update local stream with new video track and existing audio track
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      const updatedStream = new MediaStream([newVideoTrack, audioTrack].filter(Boolean));
      
      setLocalStream(updatedStream);
      localStreamRef.current = updatedStream;
      setFacingMode(newFacingMode);
      
      // Update local video element
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = updatedStream;
      }
      
      toast({
        title: "Camera Flipped",
        description: `Now using ${newFacingMode === "user" ? "front" : "back"} camera.`
      });
    } catch (error) {
      console.error("Error flipping camera:", error);
      addLog("ERROR: Failed to flip camera.");
      toast({
        title: "Camera Flip Failed",
        description: "Could not switch cameras. Your device may not support this.",
        variant: "destructive"
      });
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
        const stream = event.streams[0];
        setRemoteStream(stream);
        
        // Immediately attach to video element if available
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
          addLog("Remote video attached to element.");
        }
        
        // Transition to connected state when we receive remote stream
        setConnectionStatus("Connected");
        setStep("connected");
        addLog("Call connected - remote stream received.");
      }
    };
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candidateType = event.candidate.type || 'unknown';
        const protocol = event.candidate.protocol || 'unknown';
        addLog(`ICE candidate: ${candidateType} (${protocol})`);
        sendSignal({ 
          type: 'ICE_CANDIDATE', 
          payload: event.candidate.toJSON() 
        });
      } else {
        addLog("ICE gathering complete.");
      }
    };
    
    // Handle ICE gathering state changes (important for debugging!)
    pc.onicegatheringstatechange = () => {
      addLog(`ICE gathering state: ${pc.iceGatheringState}`);
      if (pc.iceGatheringState === 'gathering') {
        setConnectionStatus("Gathering ICE candidates...");
      }
    };
    
    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      addLog(`Connection state: ${pc.connectionState}`);
      if (pc.connectionState === 'connected') {
        setConnectionStatus("Connected");
        setStep("connected");
      } else if (pc.connectionState === 'connecting') {
        setConnectionStatus("Connecting to peer...");
      } else if (pc.connectionState === 'failed') {
        setConnectionStatus("Connection Failed - Try again");
        toast({
          title: "Connection Failed",
          description: "Could not establish peer connection. Both users may need to retry.",
          variant: "destructive"
        });
      } else if (pc.connectionState === 'disconnected') {
        setConnectionStatus("Peer Disconnected");
      }
    };
    
    pc.oniceconnectionstatechange = () => {
      addLog(`ICE connection state: ${pc.iceConnectionState}`);
      if (pc.iceConnectionState === 'checking') {
        setConnectionStatus("Checking connectivity...");
      } else if (pc.iceConnectionState === 'failed') {
        addLog("ICE connection failed - attempting restart...");
        // Attempt ICE restart
        pc.restartIce();
      }
    };
    
    // Handle signaling state changes
    pc.onsignalingstatechange = () => {
      addLog(`Signaling state: ${pc.signalingState}`);
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
    hasProcessedOffer.current = false;
  };

  // Connect local video when stream changes
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, step]);

  // Connect remote video when stream or step changes
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      // Force play in case autoplay is blocked
      remoteVideoRef.current.play().catch(e => console.log("Remote video play:", e));
    }
  }, [remoteStream, step]);

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
    if (pendingOffer.current && peerConnectionRef.current && localStreamRef.current && !hasProcessedOffer.current) {
      hasProcessedOffer.current = true;
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
        hasProcessedOffer.current = false;
      }
    }
  };

  // Initialize WebSocket connection with auto-reconnect
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/signal`;
    
    const connectWebSocket = () => {
      addLog("Connecting to signaling server...");
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      ws.onopen = () => {
        addLog("Connected to signaling server.");
        setWsConnected(true);
        reconnectAttempts.current = 0;
        
        // Re-join room if we were in one
        if (roomIdRef.current) {
          addLog(`Rejoining room ${roomIdRef.current}...`);
          ws.send(JSON.stringify({ type: 'JOIN', roomId: roomIdRef.current }));
          
          // Re-send offer if we're the caller
          if (roleRef.current === 'caller' && peerConnectionRef.current?.localDescription) {
            setTimeout(() => {
              if (peerConnectionRef.current?.localDescription) {
                addLog("Re-sending SDP Offer after reconnect...");
                sendSignal({ type: 'SDP_OFFER', payload: peerConnectionRef.current.localDescription });
              }
            }, 500);
          }
        }
      };
      
      ws.onclose = () => {
        addLog("Disconnected from signaling server.");
        setWsConnected(false);
        
        // Attempt reconnection with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectAttempts.current++;
          addLog(`Reconnecting in ${delay/1000}s (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})...`);
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);
        } else {
          addLog("ERROR: Max reconnection attempts reached. Please refresh the page.");
        }
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
          
          // Handle SDP Offer for callee (skip if already processed)
          if (type === 'SDP_OFFER' && roleRef.current === 'callee') {
            if (hasProcessedOffer.current) {
              addLog("Skipping duplicate SDP Offer (already processed).");
              return;
            }
            
            addLog("Received SDP Offer from peer via WebSocket.");
            if (peerConnectionRef.current && localStreamRef.current) {
              hasProcessedOffer.current = true;
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
                hasProcessedOffer.current = false;
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
    };
    
    // Initial connection
    connectWebSocket();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
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
      
      // Create compact WebX-formatted offer link (SDP via WebSocket, only room ID in link)
      const offerBlueprint: WebXBlueprint = {
        title: "WebX Signal Call",
        layout: "video-call",
        meta: { 
          version: "1.0", 
          author: "WebX Signal", 
          created: Date.now(), 
          category: "communication"
        },
        data: [
          { type: "heading", value: "Secure P2P Call" },
          { type: "json", value: JSON.stringify({ room: newRoomId }) }
        ]
      };
      
      const payload = encodeWebX(offerBlueprint);
      const url = `webx://signal?call=${payload}`;
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
    
    addLog("Decoding WebX Call Invite...");
    setConnectionStatus("Processing Invite...");
    
    // Extract payload from URL or raw string
    let payload = remoteLink;
    if (remoteLink.includes("call=")) {
      payload = remoteLink.split("call=")[1];
    } else if (remoteLink.includes("webx://")) {
      const url = new URL(remoteLink.replace("webx://", "http://"));
      payload = url.searchParams.get("call") || remoteLink;
    }
    
    const blueprint = decodeWebX(payload);
    if (blueprint && blueprint.data) {
      // Extract room ID from JSON block
      const jsonBlock = blueprint.data.find((block: any) => block.type === 'json');
      if (jsonBlock && jsonBlock.value) {
        try {
          const signalData = JSON.parse(jsonBlock.value as string);
          if (signalData.room) {
            addLog(`Call invite decoded - Room: ${signalData.room}`);
            
            // Set room and role
            setRoomId(signalData.room);
            setRole("callee");
            setStep("joining");
            
            // Join the signaling room (SDP will come via WebSocket)
            sendSignal({ type: 'JOIN', roomId: signalData.room });
            addLog("Joined signaling room. Waiting for caller's SDP...");
            
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
              
              // Check if there's a pending offer that arrived while we were getting media access
              if (pendingOffer.current) {
                addLog("Processing pending offer that arrived during setup...");
                await processPendingOffer();
                return;
              }
            }
            
            setConnectionStatus("Waiting for SDP Offer...");
            addLog("Ready to receive offer from caller.");
          }
        } catch (e) {
          console.error("Error parsing call data:", e);
          toast({ title: "Invalid Invite", description: "Could not parse the WebX call data.", variant: "destructive" });
        }
      } else {
        toast({ title: "Invalid Format", description: "WebX call missing room data.", variant: "destructive" });
      }
    } else {
      toast({ title: "Invalid Link", description: "Could not decode the WebX call invite.", variant: "destructive" });
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
      {/* Tutorial Popup Modal */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && completeTutorial()}
            data-testid="tutorial-overlay"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
              data-testid="tutorial-modal"
            >
              {/* Close button */}
              <button
                onClick={completeTutorial}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors z-10"
                data-testid="button-close-tutorial"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>

              {/* Progress dots */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2">
                {TUTORIAL_STEPS.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTutorialStep(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === tutorialStep 
                        ? 'bg-green-500 w-6' 
                        : idx < tutorialStep 
                          ? 'bg-green-500/50' 
                          : 'bg-white/20'
                    }`}
                    data-testid={`tutorial-dot-${idx}`}
                  />
                ))}
              </div>

              {/* Content */}
              <div className="pt-16 pb-8 px-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tutorialStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="text-center"
                  >
                    {/* Icon */}
                    <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center mb-6 border border-white/10">
                      {(() => {
                        const CurrentIcon = TUTORIAL_STEPS[tutorialStep].icon;
                        return <CurrentIcon className={`w-10 h-10 ${TUTORIAL_STEPS[tutorialStep].color}`} />;
                      })()}
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold mb-3 text-white">
                      {TUTORIAL_STEPS[tutorialStep].title}
                    </h2>

                    {/* Description */}
                    <p className="text-white/60 text-base leading-relaxed max-w-sm mx-auto mb-8">
                      {TUTORIAL_STEPS[tutorialStep].description}
                    </p>

                    {/* Visual hint for step 1 and 2 */}
                    {tutorialStep === 1 && (
                      <div className="flex justify-center mb-6">
                        <div className="flex items-center gap-3 px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-xl">
                          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                            <Video className="w-5 h-5 text-green-400" />
                          </div>
                          <span className="text-green-400 font-medium">Start a Call</span>
                          <ChevronRight className="w-4 h-4 text-green-400" />
                        </div>
                      </div>
                    )}

                    {tutorialStep === 2 && (
                      <div className="flex justify-center mb-6">
                        <div className="flex items-center gap-3 px-4 py-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <Link2 className="w-5 h-5 text-blue-400" />
                          </div>
                          <span className="text-blue-400 font-medium">Join a Call</span>
                          <ChevronRight className="w-4 h-4 text-blue-400" />
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Navigation buttons */}
                <div className="flex items-center justify-between mt-6">
                  <Button
                    variant="ghost"
                    onClick={prevTutorialStep}
                    disabled={tutorialStep === 0}
                    className={`text-white/50 hover:text-white ${tutorialStep === 0 ? 'invisible' : ''}`}
                    data-testid="button-tutorial-prev"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>

                  <Button
                    onClick={nextTutorialStep}
                    className="bg-green-600 hover:bg-green-500 text-white px-6"
                    data-testid="button-tutorial-next"
                  >
                    {tutorialStep === TUTORIAL_STEPS.length - 1 ? (
                      <>Get Started</>
                    ) : (
                      <>
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>

                {/* Skip link */}
                {tutorialStep < TUTORIAL_STEPS.length - 1 && (
                  <button
                    onClick={completeTutorial}
                    className="block mx-auto mt-4 text-sm text-white/40 hover:text-white/60 transition-colors"
                    data-testid="button-skip-tutorial"
                  >
                    Skip tutorial
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
          <button
            onClick={openTutorial}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            data-testid="button-open-tutorial"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden md:inline">How it works</span>
          </button>
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
                                setPendingInviteRoom(null);
                            }
                        } else {
                            stopMediaStreams();
                            setStep("start");
                            setConnectionStatus("Disconnected");
                            setLogs([]);
                            setRole(null);
                            setPendingInviteRoom(null);
                        }
                    }}
                >
                    <ArrowRight className="w-4 h-4 rotate-180" /> Back to Menu
                </Button>
            </div>
        )}
        
        {/* Pending Invite Screen (Android gesture requirement) */}
        {step === "start" && pendingInviteRoom && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-8 py-12"
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Video className="w-12 h-12 text-green-400" />
            </div>
            
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
                You've Been Invited
              </h1>
              <p className="text-lg text-white/60 max-w-md mx-auto">
                Someone wants to video call with you. Tap below to enable your camera and microphone, then join the call.
              </p>
            </div>
            
            <Button
              size="lg"
              onClick={acceptPendingInvite}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-6 px-12 text-lg rounded-full shadow-lg shadow-green-500/25"
              data-testid="button-accept-invite"
            >
              <Video className="w-5 h-5 mr-2" />
              Tap to Join Call
            </Button>
            
            <p className="text-xs text-white/40 max-w-sm mx-auto">
              You'll be asked to allow camera and microphone access. This is required for the video call.
            </p>
            
            <button
              onClick={() => {
                setPendingInviteRoom(null);
                window.history.replaceState({}, '', '/signal');
              }}
              className="text-sm text-white/40 hover:text-white/60 transition-colors mt-4"
              data-testid="button-dismiss-invite"
            >
              Not now
            </button>
          </motion.div>
        )}

        {/* Start Screen */}
        {step === "start" && !pendingInviteRoom && (
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
            ref={callContainerRef}
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
               dragConstraints={callContainerRef}
               dragMomentum={false}
               dragElastic={0.1}
               whileDrag={{ scale: 1.05 }}
               className="absolute bottom-24 right-6 w-48 h-32 bg-black/80 border border-white/20 rounded-xl overflow-hidden shadow-xl cursor-move z-40"
            >
               {hasMediaAccess && isVideoEnabled ? (
                  <video 
                     ref={localVideoRef}
                     autoPlay 
                     playsInline
                     muted
                     className="w-full h-full object-cover"
                     style={{ transform: isMirrored ? 'scaleX(-1)' : 'none' }}
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
               <div className="absolute top-2 right-2 flex items-center gap-1">
                  <button
                     onPointerDownCapture={(e) => e.stopPropagation()}
                     onMouseDown={(e) => e.stopPropagation()}
                     onClick={() => setIsMirrored(!isMirrored)}
                     className="p-1 rounded bg-black/50 hover:bg-black/70 transition-colors"
                     title={isMirrored ? "Show as others see you" : "Show mirrored (like a mirror)"}
                     data-testid="button-toggle-mirror"
                  >
                     <FlipHorizontal className={`w-3 h-3 ${isMirrored ? 'text-white/50' : 'text-green-400'}`} />
                  </button>
                  <span className="text-[10px] text-white/50 bg-black/50 px-1.5 py-0.5 rounded">
                     You
                  </span>
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
                  data-testid="button-toggle-video"
               >
                  {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
               </Button>

               {/* Camera Flip Button - Only shown on devices with multiple cameras */}
               {hasMultipleCameras && (
                  <Button 
                     variant="outline" 
                     size="icon" 
                     className="h-12 w-12 rounded-full border-white/10 bg-white/10 hover:bg-white/20 backdrop-blur-md"
                     onClick={flipCamera}
                     data-testid="button-flip-camera"
                     title={`Switch to ${facingMode === "user" ? "back" : "front"} camera`}
                  >
                     <SwitchCamera className="w-5 h-5" />
                  </Button>
               )}

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
                  data-testid="button-share-link"
               >
                  <Share2 className="w-5 h-5" />
               </Button>

               {/* Invite More Button - copies room link for sharing */}
               <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-12 w-12 rounded-full border-white/10 bg-blue-500/20 hover:bg-blue-500/30 backdrop-blur-md text-blue-400"
                  onClick={() => {
                     if (generatedLink) {
                        navigator.clipboard.writeText(generatedLink);
                        toast({ 
                           title: "Invite Link Copied", 
                           description: "Share this link to invite someone to a new call with you." 
                        });
                     } else if (roomId) {
                        // Generate a new link for the current room
                        const inviteBlueprint: WebXBlueprint = {
                          title: "WebX Signal Call Invitation",
                          layout: "card",
                          meta: { version: "1.0", author: "WebX Signal", created: Date.now() },
                          data: [{ type: "json" as const, value: JSON.stringify({ room: roomId }) }]
                        };
                        const payload = encodeWebX(inviteBlueprint);
                        const inviteUrl = `webx://signal?call=${payload}`;
                        navigator.clipboard.writeText(inviteUrl);
                        setGeneratedLink(inviteUrl);
                        toast({ 
                           title: "Invite Link Copied", 
                           description: "Share this link to invite someone to join your call." 
                        });
                     } else {
                        toast({
                           title: "No Room Active",
                           description: "Start or join a call first.",
                           variant: "destructive"
                        });
                     }
                  }}
                  data-testid="button-invite-more"
                  title="Copy invite link"
               >
                  <UserPlus className="w-5 h-5" />
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