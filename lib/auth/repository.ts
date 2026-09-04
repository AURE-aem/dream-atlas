import type { StoredUser } from "@/lib/auth/types";

export interface UserRepository {
  save(user: StoredUser): Promise<void>;
  findById(id: string): Promise<StoredUser | null>;
  findByEmail(email: string): Promise<StoredUser | null>;
  delete(id: string): Promise<void>;
}
