import type { GeneratedDream } from "@/types/dream";

export interface DreamRepository {
  save(dream: GeneratedDream): Promise<void>;
  findAll(): Promise<GeneratedDream[]>;
  findById(id: string): Promise<GeneratedDream | null>;
  delete(id: string): Promise<void>;
}