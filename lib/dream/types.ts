import type { GeneratedDream } from "@/types/dream";

/**
 * Persisted dreams currently use the same shape as GeneratedDream.
 * Keeping this alias avoids a second competing storage model.
 */
export type StoredDream = GeneratedDream;
