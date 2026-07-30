import type { GeneratedDream } from "@/types/dream";

export type MemoryMatchKind =
  | "symbol"
  | "title"
  | "dream"
  | "reflection"
  | "mention";

export type MemoryResult = {
  dream: GeneratedDream;
  score: number;
  kinds: MemoryMatchKind[];
};

export type TimelineGroup = {
  label: string;
  items: MemoryResult[];
};

export type ConstellationNode = {
  dream: GeneratedDream;
  x: number;
  y: number;
  strength: number;
};
