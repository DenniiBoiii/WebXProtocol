import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBlueprintSchema } from "@shared/schema";
import { encodeWebX, decodeWebX, computeBlueprintHash, SAMPLE_BLUEPRINTS, type WebXBlueprint } from "../client/src/lib/webx";

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

  return httpServer;
}
