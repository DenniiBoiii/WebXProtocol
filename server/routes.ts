import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertBlueprintSchema } from "@shared/schema";
import { encodeWebX, decodeWebX, computeBlueprintHash, SAMPLE_BLUEPRINTS, type WebXBlueprint } from "../client/src/lib/webx";

interface SignalClient {
  ws: WebSocket;
  roomId: string | null;
}

const rooms = new Map<string, Set<WebSocket>>();
const clients = new Map<WebSocket, SignalClient>();

export async function registerRoutes(app: Express): Promise<Server> {
  // Seed database with sample blueprints on startup
  const seedSamples = async () => {
    const existing = await storage.getAllBlueprints();
    if (existing.length === 0) {
      console.log("Seeding database with sample blueprints...");
      for (const [key, blueprint] of Object.entries(SAMPLE_BLUEPRINTS)) {
        const payload = encodeWebX(blueprint);
        const contentHash = computeBlueprintHash(blueprint);
        
        await storage.createBlueprint({
          title: blueprint.title,
          layout: blueprint.layout,
          payload,
          rawData: blueprint as any,
          category: blueprint.meta.category || "other",
          author: blueprint.meta.author || "Anonymous",
          featured: blueprint.meta.featured || false,
          downloads: blueprint.meta.downloads || 0,
          contentHash
        });
      }
      console.log(`Seeded ${Object.keys(SAMPLE_BLUEPRINTS).length} blueprints.`);
    }
  };
  
  await seedSamples();

  // Get all blueprints
  app.get("/api/blueprints", async (req, res) => {
    try {
      const blueprints = await storage.getAllBlueprints();
      res.json(blueprints);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blueprints" });
    }
  });

  // Get featured blueprints
  app.get("/api/blueprints/featured", async (req, res) => {
    try {
      const blueprints = await storage.getFeaturedBlueprints();
      res.json(blueprints);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch featured blueprints" });
    }
  });

  // Get blueprints by category
  app.get("/api/blueprints/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const blueprints = await storage.getBlueprintsByCategory(category);
      res.json(blueprints);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blueprints by category" });
    }
  });

  // Search blueprints
  app.get("/api/blueprints/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Search query required" });
      }
      const blueprints = await storage.searchBlueprints(query);
      res.json(blueprints);
    } catch (error) {
      res.status(500).json({ error: "Failed to search blueprints" });
    }
  });

  // Get single blueprint by ID
  app.get("/api/blueprints/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const blueprint = await storage.getBlueprintById(id);
      if (!blueprint) {
        return res.status(404).json({ error: "Blueprint not found" });
      }
      res.json(blueprint);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blueprint" });
    }
  });

  // Create new blueprint
  app.post("/api/blueprints", async (req, res) => {
    try {
      // Validate the WebX blueprint from request
      const blueprint: WebXBlueprint = req.body;
      
      // Generate payload and hash
      const payload = encodeWebX(blueprint);
      const contentHash = computeBlueprintHash(blueprint);
      
      const newBlueprint = await storage.createBlueprint({
        title: blueprint.title,
        layout: blueprint.layout,
        payload,
        rawData: blueprint as any,
        category: blueprint.meta.category || "other",
        author: blueprint.meta.author || "Anonymous",
        featured: false,
        downloads: 0,
        contentHash
      });
      
      res.status(201).json(newBlueprint);
    } catch (error) {
      console.error("Failed to create blueprint:", error);
      res.status(400).json({ error: "Invalid blueprint data" });
    }
  });

  // Increment download count
  app.post("/api/blueprints/:id/download", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.incrementDownloads(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to increment download count" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket signaling server for WebX Signal video calls
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/signal' });
  
  wss.on('connection', (ws: WebSocket) => {
    console.log('[WebSocket] Client connected');
    clients.set(ws, { ws, roomId: null });
    
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        const client = clients.get(ws);
        if (!client) return;
        
        switch (message.type) {
          case 'JOIN': {
            const roomId = message.roomId;
            if (!roomId || typeof roomId !== 'string') {
              ws.send(JSON.stringify({ type: 'ERROR', error: 'Invalid room ID' }));
              return;
            }
            
            // Leave previous room if any
            if (client.roomId && rooms.has(client.roomId)) {
              rooms.get(client.roomId)!.delete(ws);
              if (rooms.get(client.roomId)!.size === 0) {
                rooms.delete(client.roomId);
              }
            }
            
            // Join new room
            client.roomId = roomId;
            if (!rooms.has(roomId)) {
              rooms.set(roomId, new Set());
            }
            rooms.get(roomId)!.add(ws);
            
            const roomSize = rooms.get(roomId)!.size;
            console.log(`[WebSocket] Client joined room ${roomId} (${roomSize} clients)`);
            ws.send(JSON.stringify({ type: 'JOINED', roomId, peerCount: roomSize - 1 }));
            
            // Notify other peers in room
            broadcastToRoom(roomId, ws, { type: 'PEER_JOINED', peerCount: roomSize });
            break;
          }
          
          case 'SDP_OFFER':
          case 'SDP_ANSWER':
          case 'ICE_CANDIDATE':
          case 'CHAT_MSG':
          case 'END_CALL': {
            if (client.roomId) {
              console.log(`[WebSocket] Relaying ${message.type} in room ${client.roomId}`);
              broadcastToRoom(client.roomId, ws, message);
            }
            break;
          }
          
          default:
            console.log(`[WebSocket] Unknown message type: ${message.type}`);
        }
      } catch (e) {
        console.error('[WebSocket] Error parsing message:', e);
      }
    });
    
    ws.on('close', () => {
      const client = clients.get(ws);
      if (client && client.roomId && rooms.has(client.roomId)) {
        rooms.get(client.roomId)!.delete(ws);
        const remaining = rooms.get(client.roomId)!.size;
        console.log(`[WebSocket] Client left room ${client.roomId} (${remaining} remaining)`);
        
        // Notify remaining peers
        if (remaining > 0) {
          broadcastToRoom(client.roomId, ws, { type: 'PEER_LEFT', peerCount: remaining });
        } else {
          rooms.delete(client.roomId);
        }
      }
      clients.delete(ws);
      console.log('[WebSocket] Client disconnected');
    });
    
    ws.on('error', (error) => {
      console.error('[WebSocket] Error:', error);
    });
  });
  
  function broadcastToRoom(roomId: string, sender: WebSocket, message: object) {
    const room = rooms.get(roomId);
    if (!room) return;
    
    const payload = JSON.stringify(message);
    room.forEach((client) => {
      if (client !== sender && client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }
  
  console.log('[WebSocket] Signal server initialized at /ws/signal');

  return httpServer;
}
