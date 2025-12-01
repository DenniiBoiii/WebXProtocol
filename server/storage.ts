import { type Blueprint, type InsertBlueprint } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Blueprint operations
  getAllBlueprints(): Promise<Blueprint[]>;
  getBlueprintById(id: string): Promise<Blueprint | undefined>;
  getBlueprintsByCategory(category: string): Promise<Blueprint[]>;
  getFeaturedBlueprints(): Promise<Blueprint[]>;
  createBlueprint(blueprint: InsertBlueprint): Promise<Blueprint>;
  incrementDownloads(id: string): Promise<void>;
  searchBlueprints(query: string): Promise<Blueprint[]>;
}

export class MemStorage implements IStorage {
  private blueprints: Map<string, Blueprint>;

  constructor() {
    this.blueprints = new Map();
  }

  async getAllBlueprints(): Promise<Blueprint[]> {
    return Array.from(this.blueprints.values()).sort((a, b) => 
      (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }

  async getBlueprintById(id: string): Promise<Blueprint | undefined> {
    return this.blueprints.get(id);
  }

  async getBlueprintsByCategory(category: string): Promise<Blueprint[]> {
    return Array.from(this.blueprints.values())
      .filter(bp => bp.category === category)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getFeaturedBlueprints(): Promise<Blueprint[]> {
    return Array.from(this.blueprints.values())
      .filter(bp => bp.featured)
      .sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
  }

  async createBlueprint(insertBlueprint: InsertBlueprint): Promise<Blueprint> {
    const id = randomUUID();
    const blueprint: Blueprint = { 
      ...insertBlueprint, 
      id,
      createdAt: new Date()
    };
    this.blueprints.set(id, blueprint);
    return blueprint;
  }

  async incrementDownloads(id: string): Promise<void> {
    const blueprint = this.blueprints.get(id);
    if (blueprint) {
      blueprint.downloads = (blueprint.downloads || 0) + 1;
      this.blueprints.set(id, blueprint);
    }
  }

  async searchBlueprints(query: string): Promise<Blueprint[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.blueprints.values())
      .filter(bp => 
        bp.title.toLowerCase().includes(lowerQuery) ||
        bp.author?.toLowerCase().includes(lowerQuery) ||
        bp.category?.toLowerCase().includes(lowerQuery)
      )
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }
}

export const storage = new MemStorage();
