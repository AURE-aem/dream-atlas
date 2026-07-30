import type { Constellation } from "@/types/dream";

export interface ConstellationRepository {
  save(constellation: Constellation): Promise<void>;
  findAll(): Promise<Constellation[]>;
  findById(id: string): Promise<Constellation | null>;
}
