export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string;
  author: string;
  version: string;
  category: string;
  identifier: string;
  downloads: string;
  rating: number;
  features: string[];
  publishedAt: string;
  lastReleased: string;
  status: "active" | "paused" | "idle";
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgentInput {
  name: string;
  description?: string;
  icon?: string;
  author?: string;
  category?: string;
  identifier?: string;
  features?: string[];
}

export interface UpdateAgentInput {
  name?: string;
  description?: string;
  icon?: string;
  category?: string;
  features?: string[];
  status?: Agent["status"];
}

export class AgentService {
  static async create(input: CreateAgentInput): Promise<Agent> {
    // TODO: wire to Supabase
    const now = new Date().toISOString();
    return {
      id: crypto.randomUUID(),
      name: input.name,
      description: input.description ?? "",
      icon: input.icon ?? "/icons/agents/trigger.svg",
      author: input.author ?? "Provance",
      version: "1.0.0",
      category: input.category ?? "General",
      identifier: input.identifier ?? `provance.${input.name.toLowerCase().replace(/\s+/g, "-")}`,
      downloads: "0",
      rating: 0,
      features: input.features ?? [],
      publishedAt: now,
      lastReleased: now,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };
  }

  static async list(): Promise<Agent[]> {
    // TODO: wire to Supabase
    return [];
  }

  static async get(id: string): Promise<Agent | null> {
    // TODO: wire to Supabase
    void id;
    return null;
  }

  static async update(id: string, input: UpdateAgentInput): Promise<Agent | null> {
    // TODO: wire to Supabase
    void id;
    void input;
    return null;
  }

  static async delete(id: string): Promise<void> {
    // TODO: wire to Supabase
    void id;
  }
}
